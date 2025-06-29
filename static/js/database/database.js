import { DatabaseConnection } from './database-connection.js';

class Room4 {
    constructor(game) {
        this.game = game;
        this.completionScore = 0;
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.isActive = false;
        this.queryTime = 250;
        this.indexCount = 5;
        this.dataSize = 1000000;
        
        // Database connection
        this.dbConnection = new DatabaseConnection();
        this.connectionStatus = 'disconnected';
        this.tableStatus = {};
    }

    async init() {
        console.log('Room 4 (Database) initializing...');
        this.render();
        this.setupGame();
        
        // Try to connect to database
        await this.connectToDatabase();
    }

    async connectToDatabase() {
        try {
            const result = await this.dbConnection.connect();
            if (result.success) {
                this.connectionStatus = 'connected';
                this.showMessage('Database connected successfully!', 'success');
                
                // Get initial table status
                const statusResult = await this.dbConnection.getTableStatus();
                if (statusResult.success) {
                    this.tableStatus = statusResult.tables;
                }
            } else {
                this.connectionStatus = 'error';
                this.showMessage('Database connection failed!', 'error');
            }
        } catch (error) {
            this.connectionStatus = 'error';
            this.showMessage(`Connection error: ${error.message}`, 'error');
        }
        
        this.updateConnectionDisplay();
    }

    render() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-database text-6xl text-red-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-red-400">DATABASE OPTIMIZATION</h2>
                    <p class="text-gray-300 mt-2">Optimize queries and manage database performance!</p>
                </div>
                
                <div class="connection-status mb-4 p-3 rounded" id="connection-status">
                    <div class="flex items-center">
                        <div id="connection-indicator" class="w-3 h-3 rounded-full mr-2 bg-gray-500"></div>
                        <span id="connection-text">Connecting to database...</span>
                    </div>
                </div>
                
                <div class="status-grid grid grid-cols-3 gap-4 mb-6">
                    <div class="status-card bg-red-900 p-4 rounded text-center">
                        <i class="bi bi-stopwatch text-red-400 text-2xl"></i>
                        <p class="text-sm text-red-200">Query Time</p>
                        <p id="query-time" class="text-2xl font-bold text-red-100">${this.queryTime}ms</p>
                        <p class="text-xs text-red-300">Response</p>
                    </div>
                    <div class="status-card bg-yellow-900 p-4 rounded text-center">
                        <i class="bi bi-list-ol text-yellow-400 text-2xl"></i>
                        <p class="text-sm text-yellow-200">Indexes</p>
                        <p id="index-count" class="text-2xl font-bold text-yellow-100">${this.indexCount}</p>
                        <p class="text-xs text-yellow-300">Optimized</p>
                    </div>
                    <div class="status-card bg-green-900 p-4 rounded text-center">
                        <i class="bi bi-speedometer text-green-400 text-2xl"></i>
                        <p class="text-sm text-green-200">Performance</p>
                        <p id="db-performance" class="text-2xl font-bold text-green-100">${Math.round(this.completionScore)}%</p>
                        <p class="text-xs text-green-300">Efficiency</p>
                    </div>
                </div>

                <div class="game-area bg-gray-800 p-6 rounded-lg">
                    <div id="database-game" class="relative bg-gray-900 rounded" style="height: 400px; border: 2px solid #ef4444;">
                        <div class="text-center text-white p-8">
                            <h3 class="text-xl mb-4">Database Management Console</h3>
                            <p class="mb-4">Click "Start Optimization" to begin tuning your database!</p>
                            
                            <div id="table-status" class="mt-4">
                                <!-- Table status will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="controls mt-4 text-center">
                        <button id="start-optimization" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-play-fill"></i> Start Optimization
                        </button>
                        <button id="test-connection" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-plug"></i> Test Connection
                        </button>
                        <button id="add-index" class="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-plus-circle"></i> Add Index
                        </button>
                        <button id="optimize-query" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-lightning"></i> Optimize Query
                        </button>
                        <button id="complete-room" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-check-circle"></i> Complete
                        </button>
                        <button id="exit-room" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded">
                            <i class="bi bi-x-circle"></i> Exit
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const startBtn = document.getElementById('start-optimization');
        const indexBtn = document.getElementById('add-index');
        const optimizeBtn = document.getElementById('optimize-query');
        const completeBtn = document.getElementById('complete-room');
        const exitBtn = document.getElementById('exit-room');
        const testConnectionBtn = document.getElementById('test-connection');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startOptimization());
        }
        if (indexBtn) {
            indexBtn.addEventListener('click', () => this.addIndex());
        }
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => this.optimizeQuery());
        }
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeRoom());
        }
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exitRoom());
        }
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testConnection());
        }
    }

    async testConnection() {
        await this.connectToDatabase();
    }

    setupGame() {
        console.log('Database optimization game setup complete');
    }

    startOptimization() {
        this.isActive = true;
        this.updateDisplay();
        console.log('Database optimization started');
    }

    addIndex() {
        if (this.isActive) {
            this.indexCount++;
            this.queryTime = Math.max(50, this.queryTime - 20);
            this.completionScore += 10;
            this.updateDisplay();
        }
    }

    optimizeQuery() {
        if (this.isActive) {
            this.queryTime = Math.max(30, this.queryTime - Math.random() * 50);
            this.completionScore += 15;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const queryElement = document.getElementById('query-time');
        const indexElement = document.getElementById('index-count');
        const performanceElement = document.getElementById('db-performance');

        if (queryElement) {
            queryElement.textContent = `${Math.round(this.queryTime)}ms`;
        }
        if (indexElement) {
            indexElement.textContent = this.indexCount.toString();
        }
        if (performanceElement) {
            performanceElement.textContent = `${Math.round(this.completionScore)}%`;
        }
    }

    completeRoom() {
        this.isActive = false;
        const message = `Database optimized successfully! Query time: ${Math.round(this.queryTime)}ms`;
        this.game.roomCompleted(message);
    }

    exitRoom() {
        this.cleanup();
        this.game.gameOver('Database optimization session ended.');
    }

    cleanup() {
        this.isActive = false;
        if (this.dbConnection) {
            this.dbConnection.disconnect();
        }
        console.log('Room 4 cleaned up');
    }

    updateConnectionDisplay() {
        const indicator = document.getElementById('connection-indicator');
        const text = document.getElementById('connection-text');
        const status = document.getElementById('connection-status');
        
        if (indicator && text && status) {
            switch (this.connectionStatus) {
                case 'connected':
                    indicator.className = 'w-3 h-3 rounded-full mr-2 bg-green-500';
                    text.textContent = 'Database connected successfully';
                    status.className = 'connection-status mb-4 p-3 rounded bg-green-900 border border-green-500';
                    break;
                case 'error':
                    indicator.className = 'w-3 h-3 rounded-full mr-2 bg-red-500';
                    text.textContent = 'Database connection failed';
                    status.className = 'connection-status mb-4 p-3 rounded bg-red-900 border border-red-500';
                    break;
                default:
                    indicator.className = 'w-3 h-3 rounded-full mr-2 bg-yellow-500';
                    text.textContent = 'Connecting to database...';
                    status.className = 'connection-status mb-4 p-3 rounded bg-yellow-900 border border-yellow-500';
            }
        }
        
        this.updateTableStatusDisplay();
    }

    updateTableStatusDisplay() {
        const tableStatusDiv = document.getElementById('table-status');
        if (tableStatusDiv && Object.keys(this.tableStatus).length > 0) {
            const statusHtml = Object.entries(this.tableStatus).map(([table, status]) => `
                <div class="table-status-item inline-block m-1 px-2 py-1 rounded text-xs ${
                    status.status === 'healthy' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
                }">
                    ${table}: ${status.status}
                </div>
            `).join('');
            
            tableStatusDiv.innerHTML = `
                <h4 class="text-sm font-bold mb-2">Table Status:</h4>
                ${statusHtml}
            `;
        }
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-20 right-4 p-3 rounded z-50 animate-pulse`;
        
        switch(type) {
            case 'success':
                messageDiv.classList.add('bg-green-800', 'text-green-200', 'border', 'border-green-500');
                break;
            case 'error':
                messageDiv.classList.add('bg-red-800', 'text-red-200', 'border', 'border-red-500');
                break;
            case 'info':
                messageDiv.classList.add('bg-blue-800', 'text-blue-200', 'border', 'border-blue-500');
                break;
        }
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 3000);
    }
}

// Register globally and export
window.Room4 = Room4;
export { Room4 as Room1 };
