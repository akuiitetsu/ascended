import { DatabaseConnection } from '../database/database-connection.js';

export class SQLProcessor {
    constructor(room) {
        this.room = room;
        this.dbConnection = new DatabaseConnection();
        this.useRealDatabase = false;
    }

    async initializeConnection() {
        try {
            const result = await this.dbConnection.connect();
            if (result.success) {
                this.useRealDatabase = true;
                console.log('SQL Processor connected to real database');
                return true;
            }
        } catch (error) {
            console.log('Real database not available, using simulation');
            this.useRealDatabase = false;
        }
        return false;
    }

    async processSQL(command) {
        // Try real database first if available
        if (this.useRealDatabase && this.isReadOnlyQuery(command)) {
            try {
                const result = await this.dbConnection.executeQuery(command);
                if (result.success) {
                    return this.formatRealDatabaseResult(result);
                }
            } catch (error) {
                console.log('Real database query failed, falling back to simulation');
            }
        }

        // Fall back to simulation (make sure this always returns a string)
        return this.processSimulatedSQL(command);
    }

    isReadOnlyQuery(command) {
        const readOnlyCommands = ['SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'CHECK', 'EXPLAIN'];
        return readOnlyCommands.some(cmd => command.toUpperCase().includes(cmd));
    }

    formatRealDatabaseResult(result) {
        if (result.data && Array.isArray(result.data)) {
            let output = '<div class="text-green-400">Real Database Query Result:</div>';
            
            if (result.data.length > 0) {
                const headers = Object.keys(result.data[0]);
                const headerRow = headers.map(h => h.padEnd(15)).join(' | ');
                const separator = headers.map(() => '-'.repeat(15)).join('-+-');
                
                output += `<div class="text-green-400">+${separator}+</div>`;
                output += `<div class="text-green-400">| ${headerRow} |</div>`;
                output += `<div class="text-green-400">+${separator}+</div>`;
                
                result.data.forEach(row => {
                    const values = headers.map(h => String(row[h] || '').padEnd(15)).join(' | ');
                    output += `<div class="text-gray-300">| ${values} |</div>`;
                });
                
                output += `<div class="text-green-400">+${separator}+</div>`;
            }
            
            output += `<div class="text-blue-400">${result.rowCount} rows in set</div>`;
            return output;
        }
        
        return `<div class="text-green-400">${result.message || 'Query executed successfully'}</div>`;
    }

    processSimulatedSQL(command) {
        if (command.includes('SHOW TABLES')) {
            return this.generateShowTablesResult();
        } else if (command.includes('CHECK TABLE')) {
            const tableName = command.match(/CHECK TABLE (\w+)/)?.[1]?.toLowerCase();
            return this.generateCheckTableResult(tableName);
        } else if (command.includes('SHOW STATUS')) {
            return this.generateShowStatusResult();
        } else if (command.includes('DESCRIBE') || command.includes('DESC')) {
            const tableName = command.match(/DESC(?:RIBE)?\s+(\w+)/)?.[1]?.toLowerCase();
            return this.generateDescribeTableResult(tableName);
        } else if (command.includes('SELECT')) {
            return this.generateSelectResult(command);
        } else if (command.includes('REPAIR TABLE')) {
            const tableName = command.match(/REPAIR TABLE (\w+)/)?.[1]?.toLowerCase();
            return this.generateRepairTableResult(tableName);
        } else if (command.includes('OPTIMIZE TABLE')) {
            const tableName = command.match(/OPTIMIZE TABLE (\w+)/)?.[1]?.toLowerCase();
            return this.generateOptimizeTableResult(tableName);
        } else if (command.includes('ANALYZE TABLE')) {
            const tableName = command.match(/ANALYZE TABLE (\w+)/)?.[1]?.toLowerCase();
            return this.generateAnalyzeTableResult(tableName);
        } else if (command.includes('HELP') || command.includes('\\H')) {
            return this.generateHelpResult();
        } else if (command.includes('CLEAR') || command === 'CLS') {
            return ''; // Return empty string instead of undefined
        } else if (command.includes('HISTORY')) {
            return this.generateHistoryResult();
        } else {
            return '<div class="text-red-400">ERROR 1064 (42000): Command not recognized or not safe in recovery mode</div><div class="text-gray-400">Type \'help;\' for available emergency commands.</div>';
        }
    }

    generateShowTablesResult() {
        const result = `
            <div class="text-green-400">+------------------+</div>
            <div class="text-green-400">| Tables_in_db     |</div>
            <div class="text-green-400">+------------------+</div>
            ${Object.keys(this.room.tablesStatus).map(table => 
                `<div class="text-gray-300">| ${table.padEnd(16)} |</div>`
            ).join('')}
            <div class="text-green-400">+------------------+</div>
            <div class="text-blue-400">${Object.keys(this.room.tablesStatus).length} rows in set (0.01 sec)</div>
        `;
        return result;
    }

    generateCheckTableResult(tableName) {
        if (!tableName || !this.room.tablesStatus[tableName]) {
            return '<div class="text-red-400">ERROR 1146 (42S02): Table doesn\'t exist</div>';
        }

        const status = this.room.tablesStatus[tableName];
        const statusText = status === 'corrupted' ? 'Corrupted' : status === 'repairing' ? 'Under repair' : 'OK';
        const statusColor = status === 'corrupted' ? 'text-red-400' : status === 'repairing' ? 'text-yellow-400' : 'text-green-400';
        
        const result = `
            <div class="text-green-400">+----------+--------+----------+----------+</div>
            <div class="text-green-400">| Table    | Op     | Msg_type | Msg_text |</div>
            <div class="text-green-400">+----------+--------+----------+----------+</div>
            <div class="text-gray-300">| ${tableName.padEnd(8)} | check  | status   | <span class="${statusColor}">${statusText.padEnd(8)}</span> |</div>
            ${status === 'corrupted' ? `<div class="text-gray-300">| ${tableName.padEnd(8)} | check  | warning  | <span class="text-orange-400">1 client is using or hasn't closed the table properly</span> |</div>` : ''}
            ${status === 'corrupted' ? `<div class="text-gray-300">| ${tableName.padEnd(8)} | check  | error    | <span class="text-red-400">Table '${tableName}' is marked as crashed and should be repaired</span> |</div>` : ''}
            <div class="text-green-400">+----------+--------+----------+----------+</div>
            <div class="text-blue-400">1 row in set (0.03 sec)</div>
        `;

        // Progress assessment
        if (status === 'corrupted') {
            this.room.assessmentProgress = (this.room.assessmentProgress || 0) + 1;
            if (this.room.assessmentProgress >= 3) {
                setTimeout(() => this.room.proceedToBackup(), 2000);
            }
        }

        return result;
    }

    generateShowStatusResult() {
        return `
            <div class="text-green-400">+---------------------------+-------+</div>
            <div class="text-green-400">| Variable_name             | Value |</div>
            <div class="text-green-400">+---------------------------+-------+</div>
            <div class="text-gray-300">| Connections               | 847   |</div>
            <div class="text-gray-300">| Created_tmp_tables        | 23891 |</div>
            <div class="text-gray-300">| Handler_read_first        | 4567  |</div>
            <div class="text-gray-300">| Innodb_buffer_pool_reads  | <span class="text-red-400">98234</span> |</div>
            <div class="text-gray-300">| Innodb_data_reads         | <span class="text-red-400">45678</span> |</div>
            <div class="text-gray-300">| Questions                 | 23456 |</div>
            <div class="text-gray-300">| Slow_queries              | <span class="text-yellow-400">1247</span>  |</div>
            <div class="text-gray-300">| Threads_connected         | 156   |</div>
            <div class="text-gray-300">| Uptime                    | <span class="text-red-400">847</span>   |</div>
            <div class="text-green-400">+---------------------------+-------+</div>
            <div class="text-blue-400">9 rows in set (0.02 sec)</div>
            <div class="text-yellow-400">Warning: High buffer pool reads indicate potential corruption</div>
        `;
    }

    generateDescribeTableResult(tableName) {
        if (!tableName || !this.room.tablesStatus[tableName]) {
            return '<div class="text-red-400">ERROR 1146 (42S02): Table doesn\'t exist</div>';
        }

        const tableStructures = {
            'users': [
                ['id', 'int(11)', 'NO', 'PRI', 'NULL', 'auto_increment'],
                ['username', 'varchar(50)', 'NO', 'UNI', 'NULL', ''],
                ['email', 'varchar(100)', 'NO', '', 'NULL', ''],
                ['password_hash', 'varchar(255)', 'NO', '', 'NULL', ''],
                ['created_at', 'timestamp', 'NO', '', 'CURRENT_TIMESTAMP', '']
            ],
            'orders': [
                ['order_id', 'int(11)', 'NO', 'PRI', 'NULL', 'auto_increment'],
                ['user_id', 'int(11)', 'NO', 'MUL', 'NULL', ''],
                ['total_amount', 'decimal(10,2)', 'NO', '', 'NULL', ''],
                ['order_date', 'timestamp', 'NO', '', 'CURRENT_TIMESTAMP', ''],
                ['status', 'enum(\'pending\',\'shipped\',\'delivered\')', 'NO', '', 'pending', '']
            ],
            'products': [
                ['product_id', 'int(11)', 'NO', 'PRI', 'NULL', 'auto_increment'],
                ['name', 'varchar(100)', 'NO', '', 'NULL', ''],
                ['price', 'decimal(8,2)', 'NO', '', 'NULL', ''],
                ['stock', 'int(11)', 'NO', '', '0', '']
            ],
            'payments': [
                ['payment_id', 'int(11)', 'NO', 'PRI', 'NULL', 'auto_increment'],
                ['order_id', 'int(11)', 'NO', 'MUL', 'NULL', ''],
                ['amount', 'decimal(10,2)', 'NO', '', 'NULL', ''],
                ['payment_date', 'timestamp', 'NO', '', 'CURRENT_TIMESTAMP', '']
            ]
        };

        const structure = tableStructures[tableName] || [
            ['id', 'int(11)', 'NO', 'PRI', 'NULL', 'auto_increment'],
            ['data', 'text', 'YES', '', 'NULL', ''],
            ['created_at', 'timestamp', 'NO', '', 'CURRENT_TIMESTAMP', '']
        ];

        let result = `
            <div class="text-green-400">+-------------+-------------+------+-----+---------+----------------+</div>
            <div class="text-green-400">| Field       | Type        | Null | Key | Default | Extra          |</div>
            <div class="text-green-400">+-------------+-------------+------+-----+---------+----------------+</div>
        `;

        structure.forEach(([field, type, nullVal, key, defaultVal, extra]) => {
            result += `<div class="text-gray-300">| ${field.padEnd(11)} | ${type.padEnd(11)} | ${nullVal.padEnd(4)} | ${key.padEnd(3)} | ${defaultVal.padEnd(7)} | ${extra.padEnd(14)} |</div>`;
        });

        result += `
            <div class="text-green-400">+-------------+-------------+------+-----+---------+----------------+</div>
            <div class="text-blue-400">${structure.length} rows in set (0.01 sec)</div>
        `;

        return result;
    }

    generateSelectResult(command) {
        // Basic simulation of SELECT results
        if (command.includes('COUNT')) {
            return `
                <div class="text-green-400">+----------+</div>
                <div class="text-green-400">| COUNT(*) |</div>
                <div class="text-green-400">+----------+</div>
                <div class="text-gray-300">|    23891 |</div>
                <div class="text-green-400">+----------+</div>
                <div class="text-blue-400">1 row in set (0.15 sec)</div>
                <div class="text-yellow-400">Warning: Query execution time high due to table corruption</div>
            `;
        }
        return '<div class="text-red-400">ERROR 1030 (HY000): Got error 145 "Table was marked as crashed" from storage engine</div>';
    }

    generateRepairTableResult(tableName) {
        if (!tableName || !this.room.tablesStatus[tableName]) {
            return '<div class="text-red-400">ERROR 1146 (42S02): Table doesn\'t exist</div>';
        }

        const status = this.room.tablesStatus[tableName];
        
        if (status === 'corrupted') {
            // Start repair process
            this.room.tablesStatus[tableName] = 'repairing';
            
            // Simulate repair time with progress
            setTimeout(() => {
                this.room.tablesStatus[tableName] = 'recovered';
                this.room.recoveredTables++;
                this.room.corruptedTables--;
                this.room.dataIntegrity += 10;
                
                // Add completion message to terminal
                const terminalOutput = document.getElementById('terminal-output');
                if (terminalOutput) {
                    const completionDiv = document.createElement('div');
                    completionDiv.className = 'mb-2';
                    completionDiv.innerHTML = `
                        <div class="text-green-400">+----------+--------+----------+----------+</div>
                        <div class="text-green-400">| Table    | Op     | Msg_type | Msg_text |</div>
                        <div class="text-green-400">+----------+--------+----------+----------+</div>
                        <div class="text-gray-300">| ${tableName.padEnd(8)} | repair | status   | <span class="text-green-400">OK</span>       |</div>
                        <div class="text-green-400">+----------+--------+----------+----------+</div>
                        <div class="text-blue-400">1 row in set (3.47 sec)</div>
                    `;
                    terminalOutput.appendChild(completionDiv);
                    this.room.terminalManager.scrollTerminalToBottom();
                }
                
                // Check if ready for next step - require ALL 8 tables to be recovered
                if (this.room.recoveredTables >= 8) {
                    setTimeout(() => {
                        this.room.currentStep = 'verification';
                        this.room.render();
                    }, 1000);
                } else {
                    // Update the current display and show progress message
                    this.room.updateStatusDisplays();
                    
                    // Show progress message
                    const remainingTables = 8 - this.room.recoveredTables;
                    const progressMessage = document.createElement('div');
                    progressMessage.className = 'mb-2';
                    progressMessage.innerHTML = `
                        <div class="text-yellow-400">Progress: ${this.room.recoveredTables}/8 tables repaired. ${remainingTables} tables remaining.</div>
                        <div class="text-blue-400">Continue repairing remaining corrupted tables...</div>
                    `;
                    if (terminalOutput) {
                        terminalOutput.appendChild(progressMessage);
                        this.room.terminalManager.scrollTerminalToBottom();
                    }
                }
            }, 3000);

            return `
                <div class="text-green-400">+----------+--------+----------+----------+</div>
                <div class="text-green-400">| Table    | Op     | Msg_type | Msg_text |</div>
                <div class="text-green-400">+----------+--------+----------+----------+</div>
                <div class="text-gray-300">| ${tableName.padEnd(8)} | repair | status   | <span class="text-yellow-400">Running</span>  |</div>
                <div class="text-gray-300">| ${tableName.padEnd(8)} | repair | info     | <span class="text-blue-400">Repairing corrupted indexes...</span> |</div>
                <div class="text-green-400">+----------+--------+----------+----------+</div>
                <div class="text-blue-400">Repair operation in progress...</div>
            `;
        } else if (status === 'repairing') {
            return '<div class="text-yellow-400">Table repair already in progress. Please wait...</div>';
        } else if (status === 'recovered') {
            return `
                <div class="text-green-400">+----------+--------+----------+----------+</div>
                <div class="text-green-400">| Table    | Op     | Msg_type | Msg_text |</div>
                <div class="text-green-400">+----------+--------+----------+----------+</div>
                <div class="text-gray-300">| ${tableName.padEnd(8)} | repair | status   | <span class="text-green-400">OK</span>       |</div>
                <div class="text-gray-300">| ${tableName.padEnd(8)} | repair | info     | <span class="text-blue-400">Table is already repaired</span> |</div>
                <div class="text-green-400">+----------+--------+----------+----------+</div>
                <div class="text-blue-400">1 row in set (0.01 sec)</div>
            `;
        }
    }

    generateOptimizeTableResult(tableName) {
        if (!tableName || !this.room.tablesStatus[tableName]) {
            return '<div class="text-red-400">ERROR 1146 (42S02): Table doesn\'t exist</div>';
        }

        const status = this.room.tablesStatus[tableName];
        
        if (status === 'corrupted') {
            return `
                <div class="text-red-400">ERROR 1194 (HY000): Table '${tableName}' is marked as crashed and should be repaired</div>
                <div class="text-yellow-400">Use REPAIR TABLE ${tableName}; first</div>
            `;
        } else if (status === 'recovered') {
            // Optimize improves performance and integrity slightly
            this.room.dataIntegrity = Math.min(100, this.room.dataIntegrity + 5);
            
            setTimeout(() => {
                // Add completion message to terminal
                const terminalOutput = document.getElementById('terminal-output');
                if (terminalOutput) {
                    const completionDiv = document.createElement('div');
                    completionDiv.className = 'mb-2';
                    completionDiv.innerHTML = `
                        <div class="text-green-400">+----------+----------+----------+----------+</div>
                        <div class="text-green-400">| Table    | Op       | Msg_type | Msg_text |</div>
                        <div class="text-green-400">+----------+----------+----------+----------+</div>
                        <div class="text-gray-300">| ${tableName.padEnd(8)} | optimize | status   | <span class="text-green-400">OK</span>       |</div>
                        <div class="text-green-400">+----------+----------+----------+----------+</div>
                        <div class="text-blue-400">1 row in set (2.15 sec)</div>
                    `;
                    terminalOutput.appendChild(completionDiv);
                    this.room.terminalManager.scrollTerminalToBottom();
                }
                
                this.room.updateStatusDisplays();
            }, 2000);

            return `
                <div class="text-green-400">+----------+----------+----------+----------+</div>
                <div class="text-green-400">| Table    | Op       | Msg_type | Msg_text |</div>
                <div class="text-green-400">+----------+----------+----------+----------+</div>
                <div class="text-gray-300">| ${tableName.padEnd(8)} | optimize | status   | <span class="text-yellow-400">Running</span>  |</div>
                <div class="text-gray-300">| ${tableName.padEnd(8)} | optimize | info     | <span class="text-blue-400">Optimizing indexes and defragmenting...</span> |</div>
                <div class="text-green-400">+----------+----------+----------+----------+</div>
                <div class="text-blue-400">Optimization in progress...</div>
            `;
        }
    }

    generateAnalyzeTableResult(tableName) {
        if (!tableName || !this.room.tablesStatus[tableName]) {
            return '<div class="text-red-400">ERROR 1146 (42S02): Table doesn\'t exist</div>';
        }

        const status = this.room.tablesStatus[tableName];
        
        if (status === 'corrupted') {
            return `
                <div class="text-red-400">ERROR 1194 (HY000): Table '${tableName}' is marked as crashed and should be repaired</div>
                <div class="text-yellow-400">Use REPAIR TABLE ${tableName}; first</div>
            `;
        } else {
            // Analyze provides statistics and slightly improves performance
            this.room.dataIntegrity = Math.min(100, this.room.dataIntegrity + 2);
            
            setTimeout(() => {
                this.room.updateStatusDisplays();
            }, 1000);

            return `
                <div class="text-green-400">+----------+---------+----------+----------+</div>
                <div class="text-green-400">| Table    | Op      | Msg_type | Msg_text |</div>
                <div class="text-green-400">+----------+---------+----------+----------+</div>
                <div class="text-gray-300">| ${tableName.padEnd(8)} | analyze | status   | <span class="text-green-400">OK</span>       |</div>
                <div class="text-gray-300">| ${tableName.padEnd(8)} | analyze | info     | <span class="text-blue-400">Table statistics updated</span> |</div>
                <div class="text-green-400">+----------+---------+----------+----------+</div>
                <div class="text-blue-400">1 row in set (1.23 sec)</div>
            `;
        }
    }

    generateHelpResult() {
        return `
            <div class="text-cyan-400">Emergency Database Recovery Commands:</div>
            <div class="text-gray-300 mt-2">
                <div class="mb-1"><span class="text-green-400">SHOW TABLES;</span>                - List all tables in database</div>
                <div class="mb-1"><span class="text-green-400">CHECK TABLE tablename;</span>      - Check table for corruption</div>
                <div class="mb-1"><span class="text-green-400">REPAIR TABLE tablename;</span>     - Repair corrupted table</div>
                <div class="mb-1"><span class="text-green-400">OPTIMIZE TABLE tablename;</span>   - Optimize table performance</div>
                <div class="mb-1"><span class="text-green-400">ANALYZE TABLE tablename;</span>    - Update table statistics</div>
                <div class="mb-1"><span class="text-green-400">DESCRIBE tablename;</span>         - Show table structure</div>
                <div class="mb-1"><span class="text-green-400">SHOW STATUS;</span>                - Display server status variables</div>
                <div class="mb-1"><span class="text-green-400">SELECT COUNT(*) FROM table;</span> - Count rows (if accessible)</div>
                <div class="mb-1"><span class="text-green-400">CLEAR;</span>                      - Clear terminal history</div>
                <div class="mb-1"><span class="text-green-400">HISTORY;</span>                    - Show command history</div>
            </div>
            <div class="text-blue-400 mt-2">Use ↑↓ arrow keys to navigate command history</div>
            <div class="text-yellow-400 mt-1">Example: REPAIR TABLE users; OPTIMIZE TABLE users;</div>
        `;
    }

    generateHistoryResult() {
        if (this.room.commandHistory.length === 0) {
            return '<div class="text-gray-400">No commands in history</div>';
        }

        let result = `
            <div class="text-cyan-400">Command History (${this.room.commandHistory.length} commands):</div>
            <div class="text-gray-300 mt-2">
        `;
        
        this.room.commandHistory.forEach((cmd, index) => {
            result += `<div class="mb-1"><span class="text-yellow-400">${index + 1}:</span> <span class="text-gray-200">${cmd}</span></div>`;
        });

        result += `
            </div>
            <div class="text-blue-400 mt-2">Use ↑↓ keys to navigate history or 'CLEAR;' to reset</div>
        `;

        return result;
    }
}
