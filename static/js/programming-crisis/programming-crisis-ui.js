export class ProgrammingCrisisUI {
    constructor(room) {
        this.room = room;
    }

    render() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-bug text-6xl text-red-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-red-400">PROGRAMMING CRISIS</h2>
                    <p class="text-gray-300 mt-2">Debug the system by writing code to control your character!</p>
                </div>
                
                ${this.renderTwoColumnLayout()}
            </div>
        `;

        this.setupEventListeners();
    }

    renderTwoColumnLayout() {
        return `
            <div class="main-game-layout grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
                <!-- Game Grid Column - Full width on mobile, left column on desktop -->
                <div class="debug-grid-column order-2 xl:order-1">
                    ${this.renderGameContainer()}
                </div>
                
                <!-- Controls Column - Full width on mobile, right column on desktop -->
                <div class="controls-column space-y-4 xl:space-y-6 order-1 xl:order-2">
                    ${this.renderCodeEditor()}
                    ${this.renderCommandReference()}
                </div>
            </div>
        `;
    }

    renderGameContainer() {
        return `
            <div class="game-container bg-gray-800 rounded-lg p-4 xl:p-6">
                <!-- Header with title and execution status -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 xl:mb-6 gap-2">
                    <h3 class="text-xl xl:text-2xl font-bold text-white">🎮 Debug Grid - Level ${this.room.currentLevel}</h3>
                    <div class="execution-status">
                        <span class="text-gray-300 text-sm">Status: </span>
                        <span id="execution-status" class="font-bold text-sm ${this.room.codeExecutor.isExecuting ? 'text-yellow-400' : 'text-green-400'}">
                            ${this.room.codeExecutor.isExecuting ? 'EXECUTING' : 'READY'}
                        </span>
                    </div>
                </div>
                
                <!-- Integrated Status Panel - Responsive grid -->
                <div class="debug-status-panel grid grid-cols-2 sm:grid-cols-4 gap-2 xl:gap-3 mb-4 xl:mb-6 p-3 xl:p-4 bg-gray-900 rounded-lg border border-gray-600">
                    <div class="status-metric text-center">
                        <div class="flex items-center justify-center mb-1">
                            <i class="bi bi-heart text-green-400 text-lg xl:text-xl mr-1"></i>
                            <span class="text-xs text-green-200 font-medium hidden sm:inline">Health</span>
                        </div>
                        <div id="player-health" class="text-lg xl:text-xl font-bold text-green-100">${this.room.player.health}</div>
                    </div>
                    <div class="status-metric text-center">
                        <div class="flex items-center justify-center mb-1">
                            <i class="bi bi-lightning text-blue-400 text-lg xl:text-xl mr-1"></i>
                            <span class="text-xs text-blue-200 font-medium hidden sm:inline">Energy</span>
                        </div>
                        <div id="player-energy" class="text-lg xl:text-xl font-bold text-blue-100">${this.room.player.energy}</div>
                    </div>
                    <div class="status-metric text-center">
                        <div class="flex items-center justify-center mb-1">
                            <i class="bi bi-bug text-purple-400 text-lg xl:text-xl mr-1"></i>
                            <span class="text-xs text-purple-200 font-medium hidden lg:inline">Bugs Fixed</span>
                            <span class="text-xs text-purple-200 font-medium hidden sm:inline lg:hidden">Bugs</span>
                        </div>
                        <div id="bugs-defeated" class="text-lg xl:text-xl font-bold text-purple-100">${this.room.bugsDefeated}</div>
                    </div>
                    <div class="status-metric text-center">
                        <div class="flex items-center justify-center mb-1">
                            <i class="bi bi-layers text-yellow-400 text-lg xl:text-xl mr-1"></i>
                            <span class="text-xs text-yellow-200 font-medium hidden sm:inline">Level</span>
                        </div>
                        <div id="current-level" class="text-lg xl:text-xl font-bold text-yellow-100">${this.room.currentLevel}/${this.room.maxLevel}</div>
                    </div>
                </div>
                
                <!-- Game Grid - Responsive container -->
                <div class="grid-container flex justify-center mb-4 xl:mb-6 overflow-x-auto">
                    <div id="game-grid" class="bg-black rounded border-2 border-gray-600 relative mx-auto" 
                         style="width: ${this.room.gridManager.gridWidth * this.room.gridManager.cellSize}px; height: ${this.room.gridManager.gridHeight * this.room.gridManager.cellSize}px; min-width: 300px;">
                        <!-- Game grid will be rendered here -->
                    </div>
                </div>
                
                <!-- Grid Legend - Responsive layout -->
                <div class="grid-legend text-xs xl:text-sm text-gray-400 text-center mb-4 xl:mb-6">
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 xl:gap-3">
                        <span>🤖 = You</span>
                        <span>🐛 = Bug</span>
                        <span>🧱 = Wall</span>
                        <span>🔥 = Firewall</span>
                        <span>💊 = Power-up</span>
                        <span>🔐 = Encrypted</span>
                    </div>
                </div>
                
                <!-- Execution Queue - Responsive -->
                <div class="execution-queue bg-gray-900 p-3 xl:p-4 rounded border border-gray-700">
                    <h5 class="font-bold text-blue-400 mb-2 flex items-center text-sm xl:text-base">
                        <i class="bi bi-gear-fill mr-2"></i>
                        Execution Queue
                    </h5>
                    <div id="queue-display" class="text-xs xl:text-sm text-gray-300 max-h-20 xl:max-h-24 overflow-y-auto">
                        <div class="text-gray-500">No commands queued</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCodeEditor() {
        return `
            <div class="code-editor bg-gray-800 rounded-lg p-4 xl:p-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h4 class="text-lg xl:text-xl font-bold text-white">💻 Code Editor</h4>
                    <div class="code-controls flex gap-2 xl:gap-3 w-full sm:w-auto">
                        <button id="step-debug" class="bg-purple-600 hover:bg-purple-500 px-3 xl:px-4 py-1 xl:py-2 text-xs xl:text-sm rounded transition-colors flex-1 sm:flex-none">
                            <i class="bi bi-skip-forward"></i> <span class="hidden sm:inline">Step</span>
                        </button>
                        <button id="execute-code" class="bg-green-600 hover:bg-green-500 px-3 xl:px-4 py-1 xl:py-2 text-xs xl:text-sm rounded transition-colors flex-1 sm:flex-none">
                            <i class="bi bi-play-fill"></i> <span class="hidden sm:inline">Run</span>
                        </button>
                        <button id="stop-execution" class="bg-red-600 hover:bg-red-500 px-3 xl:px-4 py-1 xl:py-2 text-xs xl:text-sm rounded transition-colors flex-1 sm:flex-none" disabled>
                            <i class="bi bi-stop-fill"></i> <span class="hidden sm:inline">Stop</span>
                        </button>
                    </div>
                </div>
                
                <div class="mb-4">
                    <textarea id="code-input" 
                             class="w-full h-48 xl:h-64 bg-black text-green-400 font-mono p-3 xl:p-4 rounded border border-gray-500 text-xs xl:text-sm resize-none"
                             placeholder="# Write Python-like commands with loops and conditions:
# Basic commands:
# move('up'), move('down'), move('left'), move('right')
# attack('direction'), scan(), wait(), collect()
# 
# Loops (Python syntax):
# for i in range(3):
#     move('right')
#     scan()
# 
# Conditions (Python syntax):
# if has_energy():
#     attack('up')
# elif bug_nearby('left'):
#     attack('left')
# else:
#     wait()
#
# While loops:
# while can_move('right'):
#     move('right')
#
# Example multi-line program:
# for i in range(2):
#     if can_move('right'):
#         move('right')
#     if bug_nearby('up'):
#         attack('up')
#     else:
#         wait()"></textarea>
                </div>
                
                <div class="code-actions flex flex-wrap gap-2 xl:gap-3 mb-4">
                    <button id="clear-code" class="bg-gray-600 hover:bg-gray-500 px-3 xl:px-4 py-2 text-xs xl:text-sm rounded transition-colors">
                        <i class="bi bi-trash"></i> Clear
                    </button>
                    <button class="bg-yellow-600 hover:bg-yellow-500 px-3 xl:px-4 py-2 text-xs xl:text-sm rounded transition-colors" onclick="this.nextSibling.nextSibling.classList.toggle('hidden')">
                        <i class="bi bi-lightbulb"></i> Examples
                    </button>
                    <div class="hidden absolute bg-gray-700 border rounded p-3 text-sm z-10 mt-10 w-72 max-w-full">
                        <div class="font-bold mb-2">Quick Examples:</div>
                        <div class="space-y-1 text-xs">
                            <div class="cursor-pointer hover:bg-gray-600 p-1 rounded" onclick="this.parentElement.parentElement.parentElement.classList.add('hidden'); document.getElementById('code-input').value = 'for i in range(3):\\n    move(\\'right\\')\\n    scan()'">Basic loop</div>
                            <div class="cursor-pointer hover:bg-gray-600 p-1 rounded" onclick="this.parentElement.parentElement.parentElement.classList.add('hidden'); document.getElementById('code-input').value = 'if bug_nearby(\\'up\\'):\\n    attack(\\'up\\')\\nelse:\\n    move(\\'up\\')'">Conditional attack</div>
                            <div class="cursor-pointer hover:bg-gray-600 p-1 rounded" onclick="this.parentElement.parentElement.parentElement.classList.add('hidden'); document.getElementById('code-input').value = 'while energy > 10:\\n    if can_move(\\'right\\'):\\n        move(\\'right\\')\\n    else:\\n        wait()'">Smart movement</div>
                        </div>
                    </div>
                </div>
                
                <div class="text-xs xl:text-sm text-gray-400">
                    💡 <span class="hidden sm:inline">Press Tab to indent, Shift+Tab to unindent, Ctrl+Enter to execute</span><span class="sm:hidden">Use examples button for quick code</span>
                </div>
            </div>
        `;
    }

    renderCommandReference() {
        return `
            <div class="command-reference bg-gray-800 rounded-lg p-4 xl:p-6">
                <h4 class="text-lg xl:text-xl font-bold text-white mb-4">📋 Command Reference</h4>
                
                <div class="commands-content space-y-4 xl:space-y-5 max-h-64 xl:max-h-80 overflow-y-auto">
                    <!-- Basic Commands -->
                    <div class="command-category">
                        <div class="font-bold text-blue-400 mb-2 text-sm xl:text-base">Basic Commands:</div>
                        <div class="command-list text-xs xl:text-sm text-gray-300 space-y-1 ml-2">
                            <div><code class="text-green-400">move('direction')</code> - Move in direction (2 energy)</div>
                            <div><code class="text-red-400">attack('direction')</code> - Attack adjacent bug (5 energy)</div>
                            <div><code class="text-blue-400">scan()</code> - Reveal nearby info (3 energy)</div>
                            <div><code class="text-yellow-400">use_item('item')</code> - Use inventory item</div>
                            <div><code class="text-purple-400">wait()</code> - Skip turn, gain 5 energy</div>
                            <div><code class="text-cyan-400">collect()</code> - Pick up items at current position</div>
                        </div>
                    </div>
                    
                    <!-- Conditionals -->
                    <div class="command-category">
                        <div class="font-bold text-orange-400 mb-2 text-sm xl:text-base">Conditionals (Python syntax):</div>
                        <div class="command-list text-xs xl:text-sm text-gray-300 space-y-1 ml-2">
                            <div><code class="text-orange-400">if condition:</code> - Execute if true</div>
                            <div><code class="text-orange-400">elif condition:</code> - Else if condition</div>
                            <div><code class="text-orange-400">else:</code> - Execute if all above false</div>
                        </div>
                    </div>
                    
                    <!-- Condition Functions -->
                    <div class="command-category">
                        <div class="font-bold text-green-400 mb-2 text-sm xl:text-base">Condition Functions:</div>
                        <div class="command-list text-xs xl:text-sm text-gray-300 space-y-1 ml-2">
                            <div><code class="text-green-300">has_energy()</code> - Check if energy > 10</div>
                            <div><code class="text-green-300">bug_nearby('dir')</code> - Check for bug in direction</div>
                            <div><code class="text-green-300">can_move('dir')</code> - Check if movement possible</div>
                            <div><code class="text-green-300">health_low()</code> - Check if health < 30</div>
                            <div><code class="text-green-300">energy_low()</code> - Check if energy < 15</div>
                            <div><code class="text-green-300">energy > 20</code> - Compare energy value</div>
                            <div><code class="text-green-300">health < 50</code> - Compare health value</div>
                        </div>
                    </div>
                    
                    <!-- Loops -->
                    <div class="command-category">
                        <div class="font-bold text-pink-400 mb-2 text-sm xl:text-base">Loops (Python syntax):</div>
                        <div class="command-list text-xs xl:text-sm text-gray-300 space-y-1 ml-2">
                            <div><code class="text-pink-400">for i in range(n):</code> - Repeat n times</div>
                            <div><code class="text-pink-400">while condition:</code> - Repeat while true</div>
                        </div>
                    </div>
                </div>
                
                <!-- Inventory Section -->
                <div class="inventory-section mt-4 xl:mt-6 pt-4 xl:pt-6 border-t border-gray-600">
                    <h5 class="font-bold text-purple-400 mb-2 flex items-center text-sm xl:text-base">
                        <i class="bi bi-backpack mr-2"></i>
                        Inventory
                    </h5>
                    <div id="inventory-display" class="text-xs xl:text-sm text-gray-300 bg-gray-900 p-2 xl:p-3 rounded min-h-12 xl:min-h-16 border border-gray-700">
                        <div class="text-gray-500">Empty</div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        document.getElementById('execute-code')?.addEventListener('click', () => {
            this.room.codeExecutor.executeCode();
        });

        document.getElementById('clear-code')?.addEventListener('click', () => {
            document.getElementById('code-input').value = '';
        });

        document.getElementById('stop-execution')?.addEventListener('click', () => {
            this.room.codeExecutor.stopExecution();
        });

        document.getElementById('step-debug')?.addEventListener('click', () => {
            this.room.codeExecutor.stepDebug();
        });

        // Enhanced code input event listeners
        const codeInput = document.getElementById('code-input');
        if (codeInput) {
            // Tab functionality for indentation
            codeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    
                    const start = codeInput.selectionStart;
                    const end = codeInput.selectionEnd;
                    const value = codeInput.value;
                    
                    if (e.shiftKey) {
                        // Shift+Tab: Remove indentation
                        this.handleUnindent(codeInput, start, end);
                    } else {
                        // Tab: Add indentation
                        this.handleIndent(codeInput, start, end);
                    }
                } else if (e.key === 'Enter' && e.ctrlKey) {
                    // Ctrl+Enter: Execute code
                    e.preventDefault();
                    this.room.codeExecutor.executeCode();
                } else if (e.key === 'Enter') {
                    // Auto-indentation after colon
                    this.handleAutoIndent(e, codeInput);
                }
            });
            
            // Close examples dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.code-actions')) {
                    document.querySelectorAll('.code-actions .hidden').forEach(el => {
                        el.classList.add('hidden');
                    });
                }
            });
        }
        
        // Level editor button
        document.getElementById('open-level-editor')?.addEventListener('click', () => {
            this.room.levelEditor.enterEditorMode();
        });
    }

    handleIndent(codeInput, start, end) {
        const value = codeInput.value;
        const indent = '    '; // 4 spaces
        
        if (start === end) {
            // No selection, just insert tab at cursor
            const newValue = value.substring(0, start) + indent + value.substring(end);
            codeInput.value = newValue;
            codeInput.selectionStart = codeInput.selectionEnd = start + indent.length;
        } else {
            // Selection exists, indent all selected lines
            const lines = value.split('\n');
            const startLine = value.substring(0, start).split('\n').length - 1;
            const endLine = value.substring(0, end).split('\n').length - 1;
            
            for (let i = startLine; i <= endLine; i++) {
                lines[i] = indent + lines[i];
            }
            
            codeInput.value = lines.join('\n');
            codeInput.selectionStart = start + indent.length;
            codeInput.selectionEnd = end + (indent.length * (endLine - startLine + 1));
        }
    }

    handleUnindent(codeInput, start, end) {
        const value = codeInput.value;
        const lines = value.split('\n');
        const startLine = value.substring(0, start).split('\n').length - 1;
        const endLine = value.substring(0, end).split('\n').length - 1;
        
        let removedChars = 0;
        for (let i = startLine; i <= endLine; i++) {
            if (lines[i].startsWith('    ')) {
                lines[i] = lines[i].substring(4);
                removedChars += 4;
            } else if (lines[i].startsWith('\t')) {
                lines[i] = lines[i].substring(1);
                removedChars += 1;
            }
        }
        
        codeInput.value = lines.join('\n');
        codeInput.selectionStart = Math.max(0, start - 4);
        codeInput.selectionEnd = Math.max(0, end - removedChars);
    }

    handleAutoIndent(e, codeInput) {
        const start = codeInput.selectionStart;
        const value = codeInput.value;
        const currentLine = value.substring(0, start).split('\n').pop();
        
        // Check if current line ends with colon (for if/for/while statements)
        if (currentLine.trim().endsWith(':')) {
            // Let the Enter key work normally first
            setTimeout(() => {
                const newStart = codeInput.selectionStart;
                const indent = this.getIndentLevel(currentLine) + '    '; // Add 4 spaces
                const newValue = codeInput.value.substring(0, newStart) + indent + codeInput.value.substring(newStart);
                codeInput.value = newValue;
                codeInput.selectionStart = codeInput.selectionEnd = newStart + indent.length;
            }, 0);
        }
    }

    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1] : '';
    }

    renderSuccessScreen() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="system-success text-center p-8">
                <i class="bi bi-check-circle text-8xl text-green-400 mb-4 animate-bounce"></i>
                <h2 class="text-3xl font-bold text-green-400 mb-4">SYSTEM DEBUGGED!</h2>
                
                <div class="final-stats grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-green-800 p-3 rounded">
                        <p class="text-green-200">Player Health</p>
                        <p class="text-xl font-bold text-green-400">${this.room.player.health}%</p>
                        <p class="text-xs text-green-300">✓ Survived</p>
                    </div>
                    <div class="bg-purple-800 p-3 rounded">
                        <p class="text-purple-200">Bugs Fixed</p>
                        <p class="text-xl font-bold text-purple-400">${this.room.bugsDefeated}</p>
                        <p class="text-xs text-purple-300">✓ Debugging Master</p>
                    </div>
                    <div class="bg-blue-800 p-3 rounded">
                        <p class="text-blue-200">Levels Completed</p>
                        <p class="text-xl font-bold text-blue-400">${this.room.maxLevel}</p>
                        <p class="text-xs text-blue-300">✓ Full System</p>
                    </div>
                </div>
                
                <div class="debug-report bg-gray-800 p-4 rounded mb-4">
                    <h4 class="font-bold text-gray-200 mb-2">🐛 System Debug Report</h4>
                    <div class="text-left text-sm text-gray-300">
                        <p>✅ All ${this.room.bugsDefeated} critical bugs successfully eliminated</p>
                        <p>✅ System traversed using programmatic movement controls</p>
                        <p>✅ Python-like command syntax with loops and conditionals mastered</p>
                        <p>✅ Strategic debugging approach with resource management</p>
                        <p>✅ All ${this.room.maxLevel} system levels debugged and stabilized</p>
                        <p>✅ Programming crisis resolved through advanced code-based problem solving</p>
                    </div>
                </div>
            </div>
        `;
    }

    updateDisplay() {
        // Check if elements exist before updating them
        const playerHealth = document.getElementById('player-health');
        const playerEnergy = document.getElementById('player-energy');
        const bugsDefeated = document.getElementById('bugs-defeated');
        const currentLevel = document.getElementById('current-level');
        
        if (playerHealth) playerHealth.textContent = this.room.player.health;
        if (playerEnergy) playerEnergy.textContent = this.room.player.energy;
        if (bugsDefeated) bugsDefeated.textContent = this.room.bugsDefeated;
        if (currentLevel) currentLevel.textContent = `${this.room.currentLevel}/${this.room.maxLevel}`;
        // Remove time remaining update
        
        this.updateInventoryDisplay();
    }

    updateInventoryDisplay() {
        const inventoryDisplay = document.getElementById('inventory-display');
        if (inventoryDisplay) {
            if (this.room.player.inventory.length > 0) {
                inventoryDisplay.innerHTML = this.room.player.inventory.map(item => 
                    `<div class="text-green-300">${item.type} ${item.value ? `(+${item.value})` : ''}</div>`
                ).join('');
            } else {
                inventoryDisplay.innerHTML = '<div class="text-gray-500">Empty</div>';
            }
        }
    }
}
