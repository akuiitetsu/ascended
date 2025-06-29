export class TerminalManager {
    constructor(room) {
        this.room = room;
    }

    renderAssessmentStep() {
        return `
            <div class="assessment-step">
                <h3 class="text-xl font-bold text-blue-400 mb-4">📊 Database Assessment</h3>
                <p class="text-gray-300 mb-4">Run diagnostic queries to assess database corruption</p>
                
                <div class="sql-terminal bg-black p-4 rounded mb-4">
                    <div class="terminal-header bg-gray-800 p-2 rounded-t flex justify-between items-center">
                        <span class="text-green-400">MySQL Terminal</span>
                        <span class="text-gray-400">Server version: 8.0.35</span>
                    </div>
                    <div id="terminal-container" class="terminal-body p-4" style="min-height: 300px; max-height: 400px; overflow-y: auto;">
                        <div id="terminal-output" class="font-mono text-sm text-gray-300 mb-3">
                            <div class="text-blue-400">MySQL [CriticalBusiness_DB]> </div>
                            <div class="text-gray-400 mb-2">Welcome to the MySQL monitor. Commands end with ; or \\g.</div>
                            <div class="text-gray-400 mb-2">Database connection established. Type 'help;' or '\\h' for help.</div>
                            <div class="text-gray-400 mb-4">Emergency recovery mode active.</div>
                        </div>
                        <div class="terminal-input flex items-center">
                            <span class="text-blue-400 mr-2">mysql> </span>
                            <input type="text" id="sql-command" 
                                   class="flex-1 bg-transparent text-green-400 font-mono border-none outline-none"
                                   placeholder="Enter SQL command..."
                                   autocomplete="off">
                        </div>
                    </div>
                    <div class="terminal-footer p-2 border-t border-gray-600">
                        <button id="execute-sql" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm">
                            <i class="bi bi-play-fill"></i> Execute (Enter)
                        </button>
                        <button id="clear-terminal" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-sm ml-2">
                            <i class="bi bi-trash"></i> Clear History
                        </button>
                        <span class="text-gray-400 text-xs ml-4">Tip: Press Enter to execute, use ↑↓ for command history</span>
                    </div>
                </div>
                
                <div class="diagnostic-hint bg-blue-900 p-3 rounded">
                    <p class="text-blue-200 text-sm">
                        <strong>Emergency Commands:</strong> 
                        <code>SHOW TABLES;</code> | 
                        <code>CHECK TABLE tablename;</code> | 
                        <code>SHOW STATUS;</code> | 
                        <code>DESCRIBE tablename;</code> |
                        <code>CLEAR;</code>
                    </p>
                </div>
            </div>
        `;
    }

    renderRepairStep() {
        return `
            <div class="repair-step">
                <h3 class="text-xl font-bold text-yellow-400 mb-4">🔧 Manual Table Repair</h3>
                <p class="text-gray-300 mb-4">Use SQL commands to repair corrupted tables</p>
                
                <div class="table-status grid grid-cols-4 gap-3 mb-4">
                    ${Object.entries(this.room.tablesStatus).map(([table, status]) => `
                        <div class="table-card ${this.getTableCardClass(status)} p-3 rounded text-center">
                            <div class="table-icon text-2xl mb-1">${this.getTableIcon(status)}</div>
                            <div class="table-name font-bold text-sm">${table}</div>
                            <div class="table-status text-xs">${status.toUpperCase()}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="repair-terminal bg-black p-4 rounded mb-4">
                    <div class="terminal-header bg-gray-800 p-2 rounded-t">
                        <span class="text-yellow-400">Repair Terminal - MySQL Recovery Mode</span>
                    </div>
                    <div class="repair-console p-4" style="min-height: 200px; max-height: 300px; overflow-y: auto;">
                        <div id="repair-output" class="font-mono text-sm text-gray-300 mb-3">
                            <div class="text-blue-400">mysql> </div>
                            <div class="text-gray-400 mb-2">Ready for table repair operations.</div>
                            <div class="text-gray-400 mb-4">Use: REPAIR TABLE tablename; OPTIMIZE TABLE tablename;</div>
                        </div>
                        <div class="repair-input flex items-center">
                            <span class="text-blue-400 mr-2">mysql> </span>
                            <input type="text" id="repair-command" 
                                   class="flex-1 bg-transparent text-green-400 font-mono border-none outline-none"
                                   placeholder="Enter repair command..."
                                   autocomplete="off">
                        </div>
                    </div>
                    <div class="terminal-footer p-2 border-t border-gray-600">
                        <button id="execute-repair" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-sm">
                            <i class="bi bi-tools"></i> Execute Repair
                        </button>
                    </div>
                </div>
                
                <div class="repair-hint bg-yellow-900 p-3 rounded">
                    <p class="text-yellow-200 text-sm">
                        <strong>Repair Commands:</strong> 
                        <code>REPAIR TABLE users;</code> | 
                        <code>OPTIMIZE TABLE orders;</code> | 
                        <code>ANALYZE TABLE products;</code>
                    </p>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // SQL execution
        document.getElementById('execute-sql')?.addEventListener('click', () => {
            this.executeSQLCommand();
        });

        document.getElementById('sql-command')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeSQLCommand();
            }
        });

        // Auto-scroll on typing
        document.getElementById('sql-command')?.addEventListener('input', () => {
            this.scrollTerminalToBottom();
        });

        // Auto-scroll on focus
        document.getElementById('sql-command')?.addEventListener('focus', () => {
            this.scrollTerminalToBottom();
        });

        // Command history navigation
        document.getElementById('sql-command')?.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            }
        });

        document.getElementById('clear-terminal')?.addEventListener('click', () => {
            this.clearTerminal();
        });

        // Table repair
        document.getElementById('execute-repair')?.addEventListener('click', () => {
            this.executeRepairCommand();
        });

        document.getElementById('repair-command')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeRepairCommand();
            }
        });
    }

    async executeSQLCommand() {
        const sqlInput = document.getElementById('sql-command');
        const terminalOutput = document.getElementById('terminal-output');
        const command = sqlInput.value.trim();

        if (!command) return;

        // Add command to terminal output
        const commandDiv = document.createElement('div');
        commandDiv.className = 'mb-2';
        commandDiv.innerHTML = `<span class="text-blue-400">mysql> </span><span class="text-white">${command}</span>`;
        terminalOutput.appendChild(commandDiv);

        // Check for emergency commands first
        const emergencyResult = this.handleEmergencyCommands(command);
        if (emergencyResult) {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'mb-3';
            resultDiv.innerHTML = emergencyResult;
            terminalOutput.appendChild(resultDiv);
            
            // Auto-scroll to bottom after adding content
            this.scrollTerminalToBottom();
            
            // Clear input and add to history
            sqlInput.value = '';
            this.addToCommandHistory(command);
            return;
        }

        // Process command and generate result (await the async call)
        try {
            const result = await this.room.sqlProcessor.processSQL(command.toUpperCase());
            
            if (result) {
                // Add result to terminal output
                const resultDiv = document.createElement('div');
                resultDiv.className = 'mb-3';
                resultDiv.innerHTML = result;
                terminalOutput.appendChild(resultDiv);
            }
        } catch (error) {
            // Handle any errors from the async operation
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mb-3';
            errorDiv.innerHTML = `<div class="text-red-400">Error: ${error.message}</div>`;
            terminalOutput.appendChild(errorDiv);
        }

        // Auto-scroll to bottom after adding content
        this.scrollTerminalToBottom();
        
        // Clear input
        sqlInput.value = '';
        
        // Add command to history
        this.addToCommandHistory(command);
    }

    handleEmergencyCommands(command) {
        const cmd = command.toLowerCase().trim();
        
        switch (cmd) {
            case '/h':
            case '\\h':
            case 'help;':
            case 'help':
                return `
                    <div class="text-green-400">
                        <div class="mb-2"><strong>Emergency Recovery Commands:</strong></div>
                        <div class="text-gray-300 ml-4">
                            <div>SHOW TABLES; - List all tables in database</div>
                            <div>SHOW STATUS; - Display server status</div>
                            <div>CHECK TABLE tablename; - Check table integrity</div>
                            <div>REPAIR TABLE tablename; - Repair corrupted table</div>
                            <div>DESCRIBE tablename; - Show table structure</div>
                            <div>SELECT * FROM tablename LIMIT 5; - Sample table data</div>
                            <div>CLEAR; - Clear terminal output</div>
                            <div>\\h or help; - Show this help message</div>
                        </div>
                        <div class="mt-2 text-yellow-400">Note: Only emergency commands are available in recovery mode.</div>
                    </div>
                `;
            
            case 'clear;':
            case 'clear':
                this.clearTerminal();
                return null; // clearTerminal handles the output
            
            case 'status;':
            case 'status':
                return `
                    <div class="text-blue-400">
                        <div><strong>Database Recovery Status:</strong></div>
                        <div class="text-gray-300 ml-4 mt-1">
                            <div>Server: MySQL 8.0.35 (Emergency Mode)</div>
                            <div>Database: CriticalBusiness_DB</div>
                            <div>Connection: Active</div>
                            <div>Recovery Mode: Enabled</div>
                            <div>Tables Status: ${Object.keys(this.room.tablesStatus).length} tables detected</div>
                        </div>
                    </div>
                `;
            
            default:
                return null; // Not an emergency command, let SQL processor handle it
        }
    }

    async executeRepairCommand() {
        const commandInput = document.getElementById('repair-command');
        const repairOutput = document.getElementById('repair-output');
        const command = commandInput.value.trim().toUpperCase();

        if (!command) return;

        try {
            const result = await this.room.sqlProcessor.processSQL(command);
            
            repairOutput.innerHTML += `
                <div class="mb-1">
                    <div class="text-cyan-400">> ${command}</div>
                    ${result}
                </div>
            `;
        } catch (error) {
            repairOutput.innerHTML += `
                <div class="mb-1">
                    <div class="text-cyan-400">> ${command}</div>
                    <div class="text-red-400">Error: ${error.message}</div>
                </div>
            `;
        }
        
        // Auto-scroll repair terminal to bottom
        repairOutput.scrollTop = repairOutput.scrollHeight;
        commandInput.value = '';
    }

    scrollTerminalToBottom() {
        const terminalContainer = document.getElementById('terminal-container');
        if (terminalContainer) {
            terminalContainer.scrollTop = terminalContainer.scrollHeight;
            
            setTimeout(() => {
                terminalContainer.scrollTop = terminalContainer.scrollHeight;
            }, 10);
            
            setTimeout(() => {
                terminalContainer.scrollTo({
                    top: terminalContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 50);
        }
    }

    clearTerminal() {
        const terminalOutput = document.getElementById('terminal-output');
        terminalOutput.innerHTML = `
            <div class="text-blue-400">MySQL [CriticalBusiness_DB]> </div>
            <div class="text-gray-400 mb-2">Terminal cleared. Emergency recovery mode active.</div>
            <div class="text-gray-400 mb-4">Type 'help;' for available commands.</div>
        `;
        
        // Clear command history
        this.room.commandHistory = [];
        this.room.commandHistoryIndex = -1;
        
        // Show confirmation
        const clearConfirm = document.createElement('div');
        clearConfirm.className = 'text-green-400 mb-2';
        clearConfirm.textContent = 'Terminal and command history cleared.';
        terminalOutput.appendChild(clearConfirm);
        
        // Auto-scroll after clearing
        this.scrollTerminalToBottom();
    }

    addToCommandHistory(command) {
        if (!command.trim() || (this.room.commandHistory.length > 0 && this.room.commandHistory[this.room.commandHistory.length - 1] === command)) {
            return;
        }
        
        this.room.commandHistory.push(command);
        this.room.commandHistoryIndex = this.room.commandHistory.length;
        
        if (this.room.commandHistory.length > 50) {
            this.room.commandHistory.shift();
            this.room.commandHistoryIndex = this.room.commandHistory.length;
        }
    }

    navigateHistory(direction) {
        const sqlInput = document.getElementById('sql-command');
        
        if (this.room.commandHistory.length === 0) return;
        
        if (direction === 'up') {
            if (this.room.commandHistoryIndex > 0) {
                this.room.commandHistoryIndex--;
                sqlInput.value = this.room.commandHistory[this.room.commandHistoryIndex];
            }
        } else if (direction === 'down') {
            if (this.room.commandHistoryIndex < this.room.commandHistory.length - 1) {
                this.room.commandHistoryIndex++;
                sqlInput.value = this.room.commandHistory[this.room.commandHistoryIndex];
            } else {
                this.room.commandHistoryIndex = this.room.commandHistory.length;
                sqlInput.value = '';
            }
        }
        
        setTimeout(() => {
            sqlInput.setSelectionRange(sqlInput.value.length, sqlInput.value.length);
            this.scrollTerminalToBottom();
        }, 0);
    }

    getTableCardClass(status) {
        switch(status) {
            case 'corrupted': return 'bg-red-800 border-red-500';
            case 'repairing': return 'bg-yellow-800 border-yellow-500';
            case 'recovered': return 'bg-green-800 border-green-500';
            default: return 'bg-gray-800 border-gray-500';
        }
    }

    getTableIcon(status) {
        switch(status) {
            case 'corrupted': return '💥';
            case 'repairing': return '🔧';
            case 'recovered': return '✅';
            default: return '❓';
        }
    }
}
