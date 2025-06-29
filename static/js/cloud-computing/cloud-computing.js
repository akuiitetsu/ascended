// Import all modules using ES6 imports
import { TrafficManager } from './traffic-manager.js';
import { NodeManager } from './node-manager.js';
import { ConnectionManager } from './connection-manager.js';
import { InputHandler } from './input-handler.js';

class Room2 {
    constructor(game) {
        this.game = game;
        this.nodes = [];
        this.connections = [];
        this.budget = 500;
        this.currentTraffic = 500;
        this.totalCapacity = 0;
        this.uptime = 100;
        this.gameTime = 0;
        // Remove maxGameTime property - no time limit
        this.isRunning = false;
        this.selectedNode = null;
        this.connectionMode = false;
        this.gameArea = null;
        this.trafficParticles = [];
        this.internetNode = null; // Special internet node
        
        // Game state
        this.uptimeThreshold = 95; // Minimum uptime required
        this.downtimeSeconds = 0;
        this.maxDowntime = 30; // Max seconds of downtime before failure
        
        // Victory conditions - based on performance, not time
        this.targetCapacity = 5000; // Target capacity to achieve victory
        this.targetUptime = 98; // Target uptime percentage
        
        // Stable value tracking
        this.smoothedTraffic = 500;
        this.smoothedUptime = 100;
        this.smoothingFactor = 0.1; // Lower = more smoothing
        
        // Node dragging
        this.isDragging = false;
        this.dragNode = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Budget income system
        this.budgetIncomeRate = 5; // $5 per second
        this.lastIncomeTime = 0;

        // Initialize managers
        this.trafficManager = new TrafficManager(this);
        this.nodeManager = new NodeManager(this);
        this.connectionManager = new ConnectionManager(this);
        this.inputHandler = new InputHandler(this);
    }

    async init() {
        const response = await fetch('data/cloud-computing.json');
        this.data = await response.json();
        this.render();
        this.setupGameArea();
        this.startGame();
    }

    render() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-cloud-arrow-up text-6xl text-blue-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-blue-400">VIRAL TRAFFIC SURGE</h2>
                    <p class="text-gray-300 mt-2">Scale your infrastructure to handle explosive traffic growth!</p>
                </div>
                
                <div class="status-panel grid grid-cols-4 gap-3 mb-4">
                    <div class="status-card bg-green-900 p-3 rounded text-center">
                        <i class="bi bi-speedometer2 text-green-400 text-xl"></i>
                        <p class="text-xs text-green-200">Uptime</p>
                        <p id="uptime-display" class="text-lg font-bold text-green-100">${this.uptime.toFixed(1)}%</p>
                    </div>
                    <div class="status-card bg-blue-900 p-3 rounded text-center">
                        <i class="bi bi-graph-up text-blue-400 text-xl"></i>
                        <p class="text-xs text-blue-200">Traffic</p>
                        <p id="traffic-display" class="text-lg font-bold text-blue-100">${this.currentTraffic}/s</p>
                    </div>
                    <div class="status-card bg-purple-900 p-3 rounded text-center">
                        <i class="bi bi-hdd text-purple-400 text-xl"></i>
                        <p class="text-xs text-purple-200">Capacity</p>
                        <p id="capacity-display" class="text-lg font-bold text-purple-100">${this.totalCapacity}/s</p>
                    </div>
                    <div class="status-card bg-yellow-900 p-3 rounded text-center">
                        <i class="bi bi-currency-dollar text-yellow-400 text-xl"></i>
                        <p class="text-xs text-yellow-200">Budget (+$${this.budgetIncomeRate}/s)</p>
                        <p id="budget-display" class="text-lg font-bold text-yellow-100">$${this.budget}</p>
                    </div>
                </div>

                <div class="game-container bg-gray-800 rounded-lg p-4 mb-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-white">🌐 Infrastructure Management</h3>
                        <div class="mode-indicator">
                            <span class="text-gray-300">Mode: </span>
                            <span id="mode-display" class="font-bold ${this.connectionMode ? 'text-blue-400' : 'text-green-400'}">
                                ${this.connectionMode ? 'CONNECTING' : 'BUILDING'}
                            </span>
                        </div>
                    </div>
                    
                    <div id="infrastructure-canvas" class="bg-black rounded border-2 border-gray-600 relative overflow-hidden" 
                         style="width: 100%; height: 400px;">
                        <!-- Traffic visualization and nodes will be rendered here -->
                        <div class="absolute top-2 left-2 text-white text-sm">
                            <div>Click to build | Right-click to connect | Drag to move | Middle-click to upgrade</div>
                        </div>
                        <div class="absolute top-2 right-2 text-white text-sm">
                            <div id="load-indicator" class="font-bold">Load: <span id="load-percentage">0</span>%</div>
                        </div>
                    </div>
                </div>

                <div class="controls-panel grid grid-cols-2 gap-4">
                    <div class="node-shop bg-gray-700 p-4 rounded">
                        <h4 class="font-bold text-white mb-3">🏪 Infrastructure Shop</h4>
                        <div class="grid grid-cols-1 gap-2">
                            ${this.data.node_types.map(node => `
                                <button class="shop-item p-2 rounded border transition-colors ${this.budget >= node.cost ? 'border-gray-500 hover:border-gray-300 bg-gray-600' : 'border-red-500 bg-red-900 opacity-50'}"
                                        data-node-type="${node.id}" ${this.budget < node.cost ? 'disabled' : ''}>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <span class="text-2xl mr-2">${node.icon}</span>
                                            <div class="text-left">
                                                <div class="font-bold text-sm">${node.name}</div>
                                                <div class="text-xs text-gray-300">${node.capacity}/s capacity</div>
                                            </div>
                                        </div>
                                        <div class="text-yellow-400 font-bold">$${node.cost}</div>
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="control-center bg-gray-700 p-4 rounded">
                        <h4 class="font-bold text-white mb-3">🎛️ Control Center</h4>
                        <div class="space-y-2">
                            <button id="toggle-connection-mode" class="w-full p-2 rounded transition-colors ${this.connectionMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}">
                                <i class="bi bi-diagram-3"></i> ${this.connectionMode ? 'Exit Connect Mode' : 'Connect Nodes'}
                            </button>
                            <button id="auto-scale" class="w-full p-2 rounded bg-green-600 hover:bg-green-500 transition-colors">
                                <i class="bi bi-gear"></i> Auto-Scale ($200)
                            </button>
                            <button id="emergency-maintenance" class="w-full p-2 rounded bg-yellow-600 hover:bg-yellow-500 transition-colors">
                                <i class="bi bi-tools"></i> Emergency Maintenance
                            </button>
                            <button id="abandon-infrastructure" class="w-full p-2 rounded bg-red-600 hover:bg-red-500 transition-colors">
                                <i class="bi bi-power"></i> Abandon Infrastructure
                            </button>
                        </div>
                        
                        <div class="traffic-info mt-4 p-3 bg-gray-800 rounded">
                            <h5 class="font-bold text-blue-400 mb-2">📊 Traffic Analysis</h5>
                            <div class="text-sm text-gray-300">
                                <div>Current Load: <span id="current-load" class="font-bold">${Math.round((this.currentTraffic / Math.max(this.totalCapacity, 1)) * 100)}%</span></div>
                                <div>Status: <span id="system-status" class="font-bold ${this.uptime >= this.uptimeThreshold ? 'text-green-400' : 'text-red-400'}">${this.uptime >= this.uptimeThreshold ? 'STABLE' : 'CRITICAL'}</span></div>
                                <div>Downtime: <span id="downtime-counter" class="font-bold text-orange-400">${this.downtimeSeconds}s</span></div>
                                <div>Revenue: <span class="font-bold text-green-400">+$${this.budgetIncomeRate}/s</span></div>
                                <div>Target: <span class="font-bold text-blue-400">${this.targetCapacity}/s capacity, ${this.targetUptime}% uptime</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.inputHandler.setupEventListeners();
    }

    setupGameArea() {
        this.gameArea = document.getElementById('infrastructure-canvas');
        
        // Set up event listeners through input handler
        this.inputHandler.setupCanvasEventListeners();

        // Create the internet node (fixed position, cannot be moved)
        this.nodeManager.createInternetNode();
        
        // Start with a basic web server connected to internet
        this.nodeManager.addNode('web-server', 200, 200, true);
        
        // Auto-connect first web server to internet
        if (this.nodes.length > 0) {
            this.connectionManager.createConnection(this.internetNode, this.nodes[0]);
        }
    }

    updateBudget() {
        const now = Date.now();
        
        // Initialize last income time if not set
        if (this.lastIncomeTime === 0) {
            this.lastIncomeTime = now;
            return;
        }
        
        // Calculate time since last income
        const timeDiff = (now - this.lastIncomeTime) / 1000; // Convert to seconds
        
        // Add income based on time passed
        if (timeDiff >= 1) { // Update every second
            const incomeAmount = Math.floor(timeDiff) * this.budgetIncomeRate;
            this.budget += incomeAmount;
            this.lastIncomeTime = now;
            
            // Show income notification occasionally
            if (Math.floor(timeDiff) >= 10) { // Every 10 seconds
                this.showMessage(`Revenue: +$${incomeAmount}`, 'info');
            }
        }
    }

    updateUptime() {
        const loadPercentage = (this.currentTraffic / Math.max(this.totalCapacity, 1)) * 100;
        
        let targetUptime = this.uptime;
        
        if (loadPercentage > 100) {
            targetUptime = Math.max(0, this.uptime - 1.5);
            this.downtimeSeconds += 0.5;
            this.playSound('server_overload');
        } else if (loadPercentage > 90) {
            targetUptime = Math.max(0, this.uptime - 0.3);
        } else if (loadPercentage < 80) {
            targetUptime = Math.min(100, this.uptime + 0.2);
            if (this.downtimeSeconds > 0) {
                this.downtimeSeconds = Math.max(0, this.downtimeSeconds - 0.2);
            }
        }
        
        // Smooth uptime changes
        this.smoothedUptime += (targetUptime - this.smoothedUptime) * this.smoothingFactor;
        this.uptime = this.smoothedUptime;
    }

    startGame() {
        this.isRunning = true;
        this.lastIncomeTime = Date.now(); // Initialize income timer
    }

    updateDisplay() {
        const loadPercentage = Math.round((this.currentTraffic / Math.max(this.totalCapacity, 1)) * 100);
        
        // Use smoothed/rounded values for stable display
        document.getElementById('uptime-display').textContent = `${this.uptime.toFixed(1)}%`;
        document.getElementById('traffic-display').textContent = `${Math.round(this.currentTraffic)}/s`;
        document.getElementById('capacity-display').textContent = `${this.totalCapacity}/s`;
        document.getElementById('budget-display').textContent = `$${this.budget}`;
        // Remove time display
        document.getElementById('load-percentage').textContent = loadPercentage;
        document.getElementById('current-load').textContent = `${loadPercentage}%`;
        document.getElementById('system-status').textContent = this.uptime >= this.uptimeThreshold ? 'STABLE' : 'CRITICAL';
        document.getElementById('downtime-counter').textContent = `${Math.round(this.downtimeSeconds)}s`;
        
        // Update load indicator color
        const loadIndicator = document.getElementById('load-indicator');
        if (loadPercentage > 100) {
            loadIndicator.style.color = '#ef4444';
        } else if (loadPercentage > 80) {
            loadIndicator.style.color = '#f59e0b';
        } else {
            loadIndicator.style.color = '#10b981';
        }
        
        // Update shop items availability
        document.querySelectorAll('.shop-item').forEach(item => {
            const nodeType = item.dataset.nodeType;
            const nodeData = this.data.node_types.find(n => n.id === nodeType);
            
            if (this.budget >= nodeData.cost) {
                item.disabled = false;
                item.classList.remove('opacity-50', 'bg-red-900', 'border-red-500');
                item.classList.add('bg-gray-600', 'border-gray-500');
            } else {
                item.disabled = true;
                item.classList.add('opacity-50', 'bg-red-900', 'border-red-500');
                item.classList.remove('bg-gray-600', 'border-gray-500');
            }
        });
    }

    autoScale() {
        if (this.budget >= 200) {
            this.budget -= 200;
            
            // Add optimal nodes based on current load
            const loadPercentage = (this.currentTraffic / this.totalCapacity) * 100;
            
            if (loadPercentage > 80) {
                // Add load balancer and web servers
                const x1 = 100 + Math.random() * 600;
                const y1 = 100 + Math.random() * 200;
                const x2 = 100 + Math.random() * 600;
                const y2 = 100 + Math.random() * 200;
                
                this.nodeManager.addNode('load-balancer', x1, y1, true);
                this.nodeManager.addNode('web-server', x2, y2, true);
                
                this.playSound('upgrade_complete');
                this.showMessage('Auto-scaling completed!', 'success');
            }
            
            this.updateDisplay();
        } else {
            this.showMessage('Insufficient budget for auto-scaling!', 'error');
        }
    }

    emergencyMaintenance() {
        // Temporarily boost uptime
        this.uptime = Math.min(100, this.uptime + 10);
        this.downtimeSeconds = Math.max(0, this.downtimeSeconds - 5);
        this.showMessage('Emergency maintenance completed!', 'success');
        this.updateDisplay();
    }

    victoryCondition() {
        // Remove clearInterval calls
        this.isRunning = false;
        
        const avgUptime = this.uptime;
        const finalCapacity = this.totalCapacity;
        const nodesBuilt = this.nodes.length;
        
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="infrastructure-success text-center p-8">
                <i class="bi bi-cloud-check text-8xl text-green-400 mb-4 animate-bounce"></i>
                <h2 class="text-3xl font-bold text-green-400 mb-4">INFRASTRUCTURE SCALED!</h2>
                
                <div class="final-stats grid grid-cols-4 gap-4 mb-6">
                    <div class="bg-green-800 p-3 rounded">
                        <p class="text-green-200">Final Uptime</p>
                        <p class="text-xl font-bold text-green-400">${avgUptime.toFixed(1)}%</p>
                        <p class="text-xs text-green-300">✓ Service Maintained</p>
                    </div>
                    <div class="bg-blue-800 p-3 rounded">
                        <p class="text-blue-200">Total Capacity</p>
                        <p class="text-xl font-bold text-blue-400">${finalCapacity}/s</p>
                        <p class="text-xs text-blue-300">✓ Traffic Handled</p>
                    </div>
                    <div class="bg-purple-800 p-3 rounded">
                        <p class="text-purple-200">Nodes Deployed</p>
                        <p class="text-xl font-bold text-purple-400">${nodesBuilt}</p>
                        <p class="text-xs text-purple-300">✓ Infrastructure</p>
                    </div>
                    <div class="bg-yellow-800 p-3 rounded">
                        <p class="text-yellow-200">Budget Remaining</p>
                        <p class="text-xl font-bold text-yellow-400">$${this.budget}</p>
                        <p class="text-xs text-yellow-300">✓ Cost Effective</p>
                    </div>
                </div>
                
                <div class="success-report bg-gray-800 p-4 rounded mb-4">
                    <h4 class="font-bold text-gray-200 mb-2">🌐 Infrastructure Scaling Report</h4>
                    <div class="text-left text-sm text-gray-300">
                        <p>✅ Viral traffic surge successfully handled</p>
                        <p>✅ Website maintained ${avgUptime.toFixed(1)}% uptime during crisis</p>
                        <p>✅ Infrastructure scaled to ${finalCapacity} requests/second capacity</p>
                        <p>✅ ${nodesBuilt} nodes deployed with optimal connections</p>
                        <p>✅ Revenue preserved - $0 lost to downtime</p>
                        <p>✅ Customer satisfaction maintained at maximum levels</p>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            this.game.roomCompleted(`Infrastructure crisis averted! Website scaling successful with ${avgUptime.toFixed(1)}% uptime maintained during viral traffic surge.`);
        }, 3000);
    }

    infrastructureCollapse() {
        // Remove clearInterval calls
        this.isRunning = false;
        this.playSound('infrastructure_collapse');
        
        this.game.gameOver('Infrastructure collapsed! Website overwhelmed by traffic - Service unavailable, revenue lost, customers frustrated.');
    }

    abandonInfrastructure() {
        this.game.gameOver('Infrastructure abandoned! Website taken offline - Business operations halted.');
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
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    playSound(soundType) {
        // Placeholder for audio implementation
        console.log(`Playing sound: ${soundType}`);
        
        // Future implementation:
        // const audio = new Audio(this.data.audio_cues[soundType]);
        // audio.volume = 0.3;
        // audio.play().catch(e => console.log('Audio play failed:', e));
    }

    cleanup() {
        // Remove timer cleanup
        this.isRunning = false;
    }
}

// Register the class globally
window.Room2 = Room2;

// Also export for potential module use
export { Room2 };