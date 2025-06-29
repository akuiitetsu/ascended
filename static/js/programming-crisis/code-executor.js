export class CodeExecutor {
    constructor(room) {
        this.room = room;
        this.codeQueue = [];
        this.isExecuting = false;
        this.executionSpeed = 500; // ms between commands
        this.stepMode = false;
        this.currentLine = 0;
        this.variables = new Map();
        this.callStack = [];
    }

    executeCode() {
        if (this.isExecuting) return;
        
        const codeInput = document.getElementById('code-input');
        const code = codeInput.value.trim();
        
        if (!code) {
            this.room.showMessage('Please enter some code to execute!', 'error');
            return;
        }
        
        // Parse code into commands with control structures
        try {
            this.codeQueue = this.parseAdvancedCode(code);
        } catch (error) {
            this.room.showMessage(`Parse Error: ${error.message}`, 'error');
            return;
        }
        
        if (this.codeQueue.length === 0) {
            this.room.showMessage('No valid commands found!', 'error');
            return;
        }
        
        this.isExecuting = true;
        this.currentLine = 0;
        this.variables.clear();
        this.callStack = [];
        this.updateExecutionDisplay();
        this.executeNextCommand();
    }

    parseAdvancedCode(code) {
        const lines = code.split('\n').map(line => line.trimEnd());
        const commands = [];
        const tokens = this.tokenize(lines);
        
        return this.parseTokens(tokens);
    }

    tokenize(lines) {
        const tokens = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            
            const indentLevel = this.getIndentLevel(line);
            const lineNumber = index + 1;
            
            // Handle control structures with Python syntax
            if (trimmed.match(/^for\s+\w+\s+in\s+range\s*\(\s*\d+\s*\)\s*:/)) {
                const match = trimmed.match(/^for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/);
                tokens.push({
                    type: 'for_loop',
                    variable: match[1],
                    count: parseInt(match[2]),
                    indentLevel,
                    lineNumber
                });
            }
            else if (trimmed.match(/^while\s+.+:/)) {
                const condition = trimmed.replace(/^while\s+/, '').replace(/:$/, '').trim();
                tokens.push({
                    type: 'while_loop',
                    condition,
                    indentLevel,
                    lineNumber
                });
            }
            else if (trimmed.match(/^if\s+.+:/)) {
                const condition = trimmed.replace(/^if\s+/, '').replace(/:$/, '').trim();
                tokens.push({
                    type: 'if_statement',
                    condition,
                    indentLevel,
                    lineNumber
                });
            }
            else if (trimmed.match(/^elif\s+.+:/)) {
                const condition = trimmed.replace(/^elif\s+/, '').replace(/:$/, '').trim();
                tokens.push({
                    type: 'elif_statement',
                    condition,
                    indentLevel,
                    lineNumber
                });
            }
            else if (trimmed.match(/^else\s*:/)) {
                tokens.push({
                    type: 'else_statement',
                    indentLevel,
                    lineNumber
                });
            }
            else {
                // Regular command
                const command = this.parseBasicCommand(trimmed, lineNumber);
                if (command) {
                    command.indentLevel = indentLevel;
                    tokens.push(command);
                }
            }
        });
        
        return tokens;
    }

    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? Math.floor(match[1].length / 4) : 0; // Assume 4 spaces per indent
    }

    parseTokens(tokens) {
        const commands = [];
        let i = 0;
        
        while (i < tokens.length) {
            const token = tokens[i];
            
            if (token.type === 'for_loop') {
                const loopBody = this.extractBlock(tokens, i + 1, token.indentLevel);
                commands.push({
                    type: 'for_loop',
                    variable: token.variable,
                    count: token.count,
                    body: this.parseTokens(loopBody.tokens),
                    lineNumber: token.lineNumber
                });
                i = loopBody.nextIndex;
            }
            else if (token.type === 'while_loop') {
                const loopBody = this.extractBlock(tokens, i + 1, token.indentLevel);
                commands.push({
                    type: 'while_loop',
                    condition: token.condition,
                    body: this.parseTokens(loopBody.tokens),
                    lineNumber: token.lineNumber
                });
                i = loopBody.nextIndex;
            }
            else if (token.type === 'if_statement') {
                const ifBlock = this.extractConditionalBlock(tokens, i, token.indentLevel);
                commands.push({
                    type: 'conditional',
                    condition: token.condition,
                    ifBody: this.parseTokens(ifBlock.ifTokens),
                    elifBodies: ifBlock.elifBodies ? ifBlock.elifBodies.map(elif => ({
                        condition: elif.condition,
                        body: this.parseTokens(elif.tokens)
                    })) : [],
                    elseBody: ifBlock.elseTokens ? this.parseTokens(ifBlock.elseTokens) : [],
                    lineNumber: token.lineNumber
                });
                i = ifBlock.nextIndex;
            }
            else if (token.type === 'elif_statement' || token.type === 'else_statement') {
                // Skip standalone elif/else statements as they should be part of if blocks
                // This can happen if there's malformed code
                console.warn(`Standalone ${token.type} found at line ${token.lineNumber}, skipping`);
                i++;
            }
            else {
                commands.push(token);
                i++;
            }
        }
        
        return commands;
    }

    extractBlock(tokens, startIndex, parentIndentLevel) {
        const blockTokens = [];
        let i = startIndex;
        
        while (i < tokens.length && tokens[i].indentLevel > parentIndentLevel) {
            blockTokens.push(tokens[i]);
            i++;
        }
        
        return { tokens: blockTokens, nextIndex: i };
    }

    extractConditionalBlock(tokens, startIndex, parentIndentLevel) {
        let i = startIndex + 1;
        const ifTokens = [];
        const elifBodies = [];
        let elseTokens = null;
        
        // Extract if block
        while (i < tokens.length && tokens[i].indentLevel > parentIndentLevel) {
            if ((tokens[i].type === 'elif_statement' || tokens[i].type === 'else_statement') && 
                tokens[i].indentLevel === parentIndentLevel + 1) {
                break;
            }
            ifTokens.push(tokens[i]);
            i++;
        }
        
        // Handle elif blocks
        while (i < tokens.length && tokens[i].type === 'elif_statement' && 
               tokens[i].indentLevel === parentIndentLevel + 1) {
            const elifCondition = tokens[i].condition;
            i++; // Skip elif statement
            
            const elifTokens = [];
            while (i < tokens.length && tokens[i].indentLevel > parentIndentLevel) {
                if ((tokens[i].type === 'elif_statement' || tokens[i].type === 'else_statement') && 
                    tokens[i].indentLevel === parentIndentLevel + 1) {
                    break;
                }
                elifTokens.push(tokens[i]);
                i++;
            }
            
            elifBodies.push({
                condition: elifCondition,
                tokens: elifTokens
            });
        }
        
        // Check for else block
        if (i < tokens.length && tokens[i].type === 'else_statement' && 
            tokens[i].indentLevel === parentIndentLevel + 1) {
            i++; // Skip else statement
            elseTokens = [];
            while (i < tokens.length && tokens[i].indentLevel > parentIndentLevel) {
                elseTokens.push(tokens[i]);
                i++;
            }
        }
        
        return { ifTokens, elifBodies, elseTokens, nextIndex: i };
    }

    parseBasicCommand(line, lineNumber) {
        // Parse move commands
        if (line.match(/move\s*\(\s*['"]?(up|down|left|right)['"]?\s*\)/i)) {
            const direction = line.match(/['"]?(up|down|left|right)['"]?/i)[1].toLowerCase();
            return { type: 'move', direction, lineNumber };
        }
        
        // Parse attack commands
        else if (line.match(/attack\s*\(\s*['"]?(up|down|left|right)['"]?\s*\)/i)) {
            const direction = line.match(/['"]?(up|down|left|right)['"]?/i)[1].toLowerCase();
            return { type: 'attack', direction, lineNumber };
        }
        
        // Parse scan command
        else if (line.match(/scan\s*\(\s*\)/i)) {
            return { type: 'scan', lineNumber };
        }
        
        // Parse wait command
        else if (line.match(/wait\s*\(\s*\)/i)) {
            return { type: 'wait', lineNumber };
        }
        
        // Parse collect command
        else if (line.match(/collect\s*\(\s*\)/i)) {
            return { type: 'collect', lineNumber };
        }
        
        // Parse use_item command
        else if (line.match(/use_item\s*\(\s*['"]?\w+['"]?\s*\)/i)) {
            const item = line.match(/use_item\s*\(\s*['"]?(\w+)['"]?\s*\)/i)[1];
            return { type: 'use_item', item, lineNumber };
        }
        
        // Invalid command
        else {
            return { type: 'error', message: `Syntax error on line ${lineNumber}: ${line}`, lineNumber };
        }
    }

    executeNextCommand() {
        if (!this.isExecuting || this.codeQueue.length === 0) {
            this.isExecuting = false;
            this.updateExecutionDisplay();
            return;
        }
        
        if (this.stepMode) {
            this.updateExecutionDisplay();
            return; // Wait for manual step
        }
        
        const command = this.codeQueue.shift();
        this.currentLine = command.lineNumber || this.currentLine + 1;
        
        this.executeCommand(command).then(result => {
            if (result.success) {
                this.room.ui.updateDisplay();
                this.room.gridManager.renderPlayer();
                this.room.gridManager.renderGameObjects();
                
                // Check for level completion
                if (this.room.bugs.length === 0) {
                    this.room.levelComplete();
                    return;
                }
                
                // Check for game over
                if (this.room.player.health <= 0) {
                    this.room.gameOver();
                    return;
                }
                
                // Continue execution
                setTimeout(() => {
                    this.executeNextCommand();
                }, this.executionSpeed);
            } else {
                this.room.showMessage(result.message, 'error');
                this.isExecuting = false;
                this.updateExecutionDisplay();
            }
        });
    }

    executeForLoop(command) {
        for (let i = 0; i < command.count; i++) {
            this.variables.set(command.variable, i);
            // Add loop body commands to the front of the queue
            this.codeQueue.unshift(...command.body.map(cmd => ({ ...cmd })));
        }
        return { success: true };
    }

    executeWhileLoop(command) {
        // Check if condition is still true
        if (this.evaluateCondition(command.condition)) {
            // Add the loop body commands to the front of the queue
            const loopBody = command.body.map(cmd => ({ ...cmd }));
            
            // Add the while loop command back to the queue to check condition again after body executes
            const whileLoopContinuation = {
                type: 'while_loop',
                condition: command.condition,
                body: command.body,
                lineNumber: command.lineNumber
            };
            
            // Add body commands first, then the while loop check
            this.codeQueue.unshift(...loopBody, whileLoopContinuation);
        }
        
        return { success: true };
    }

    async executeCommand(command) {
        switch (command.type) {
            case 'move':
                return this.room.playerActions.executeMove(command.direction);
            case 'attack':
                return this.room.playerActions.executeAttack(command.direction);
            case 'scan':
                return this.room.playerActions.executeScan();
            case 'wait':
                return this.room.playerActions.executeWait();
            case 'collect':
                return this.room.playerActions.executeCollect();
            case 'use_item':
                return this.room.playerActions.executeUseItem(command.item);
            case 'for_loop':
                return this.executeForLoop(command);
            case 'while_loop':
                return this.executeWhileLoop(command);
            case 'conditional':
                return this.executeConditional(command);
            case 'error':
                return { success: false, message: command.message };
            default:
                console.error('Unknown command type:', command);
                return { success: false, message: `Unknown command type: ${command.type}. Line: ${command.lineNumber || 'unknown'}` };
        }
    }

    executeConditional(command) {
        // Check if condition
        if (this.evaluateCondition(command.condition)) {
            this.codeQueue.unshift(...command.ifBody.map(cmd => ({ ...cmd })));
            return { success: true };
        }
        
        // Check elif conditions
        for (const elifBlock of command.elifBodies) {
            if (this.evaluateCondition(elifBlock.condition)) {
                this.codeQueue.unshift(...elifBlock.body.map(cmd => ({ ...cmd })));
                return { success: true };
            }
        }
        
        // Execute else block if no conditions matched
        if (command.elseBody.length > 0) {
            this.codeQueue.unshift(...command.elseBody.map(cmd => ({ ...cmd })));
        }
        
        return { success: true };
    }

    evaluateCondition(condition) {
        // Handle built-in condition functions
        if (condition === 'has_energy()') {
            return this.room.player.energy > 10;
        }
        
        if (condition === 'health_low()') {
            return this.room.player.health < 30;
        }
        
        if (condition === 'energy_low()') {
            return this.room.player.energy < 15;
        }
        
        // Handle function calls with parameters (support both single and double quotes)
        if (condition.match(/bug_nearby\s*\(\s*['"]?(up|down|left|right)['"]?\s*\)/)) {
            const direction = condition.match(/['"]?(up|down|left|right)['"]?/)[1];
            return this.room.playerActions.checkBugNearby(direction);
        }
        
        if (condition.match(/can_move\s*\(\s*['"]?(up|down|left|right)['"]?\s*\)/)) {
            const direction = condition.match(/['"]?(up|down|left|right)['"]?/)[1];
            return this.room.playerActions.checkCanMove(direction);
        }
        
        // Handle comparison operations with proper variable evaluation
        if (condition.match(/energy\s*([<>=!]+)\s*\d+/)) {
            return this.evaluateComparison(condition, this.room.player.energy);
        }
        
        if (condition.match(/health\s*([<>=!]+)\s*\d+/)) {
            return this.evaluateComparison(condition, this.room.player.health);
        }
        
        // Handle boolean conditions
        if (condition === 'True' || condition === 'true') return true;
        if (condition === 'False' || condition === 'false') return false;
        
        // Default to false for unknown conditions
        console.warn(`Unknown condition: ${condition}`);
        return false;
    }

    evaluateComparison(condition, value) {
        // Improved regex to handle spaces and different operators
        const match = condition.match(/(\w+)\s*([<>=!]+)\s*(\d+)/);
        if (!match) return false;
        
        const operator = match[2];
        const compareValue = parseInt(match[3]);
        
        switch (operator) {
            case '<': return value < compareValue;
            case '<=': return value <= compareValue;
            case '>': return value > compareValue;
            case '>=': return value >= compareValue;
            case '==': return value === compareValue;
            case '!=': return value !== compareValue;
            default: return false;
        }
    }

    updateExecutionDisplay() {
        const statusDisplay = document.getElementById('execution-status');
        const queueDisplay = document.getElementById('queue-display');
        const executeBtn = document.getElementById('execute-code');
        const stopBtn = document.getElementById('stop-execution');
        const stepBtn = document.getElementById('step-debug');
        
        if (statusDisplay) {
            const status = this.stepMode ? 'STEP MODE' : (this.isExecuting ? 'EXECUTING' : 'READY');
            statusDisplay.textContent = status;
            statusDisplay.className = `font-bold ${this.isExecuting ? 'text-yellow-400' : 'text-green-400'}`;
        }
        
        if (queueDisplay) {
            if (this.codeQueue.length > 0) {
                const preview = this.codeQueue.slice(0, 5).map(cmd => {
                    let cmdText = cmd.type;
                    if (cmd.direction) cmdText += `('${cmd.direction}')`;
                    else if (cmd.condition) cmdText += ` (${cmd.condition.substring(0, 15)}...)`;
                    else if (cmd.count) cmdText += ` (${cmd.count}x)`;
                    else if (cmd.item) cmdText += `('${cmd.item}')`;
                    return `<div class="text-yellow-300">${cmdText}</div>`;
                }).join('');
                
                if (this.codeQueue.length > 5) {
                    queueDisplay.innerHTML = preview + `<div class="text-gray-400">... +${this.codeQueue.length - 5} more</div>`;
                } else {
                    queueDisplay.innerHTML = preview;
                }
            } else {
                queueDisplay.innerHTML = '<div class="text-gray-500">No commands queued</div>';
            }
        }
        
        if (executeBtn) executeBtn.disabled = this.isExecuting;
        if (stopBtn) stopBtn.disabled = !this.isExecuting;
        if (stepBtn) stepBtn.disabled = this.isExecuting && !this.stepMode;
    }

    stepDebug() {
        if (!this.isExecuting) {
            this.stepMode = true;
            this.executeCode();
        } else {
            this.executeNextCommand();
        }
    }

    stopExecution() {
        this.isExecuting = false;
        this.stepMode = false;
        this.codeQueue = [];
        this.variables.clear();
        this.callStack = [];
        this.updateExecutionDisplay();
        this.room.showMessage('Code execution stopped.', 'info');
    }
}
