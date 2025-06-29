class Room2 {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.maxLevels = 5;
        this.completionScore = 0;
        this.isActive = false;
        this.selectedDevice = null;
        this.selectedCable = null;
        this.connectionStart = null;
        this.placedDevices = [];
        this.connections = [];
        this.deviceIdCounter = 1;
        
        // Network simulation state
        this.networkDevices = new Map();
        this.routingTables = new Map();
        this.pingResults = [];
        
        // Level scenarios with networking focus
        this.levelScenarios = {
            1: {
                name: "Power On: Topology Builder",
                story: "🏙️ The city's public information kiosks have gone dark! Citizens can't access emergency alerts or city services. You need to rebuild the basic network infrastructure from scratch.",
                objective: "Build a simple network layout with end devices and routers",
                character: "👨‍💻 Alex (Network Technician)",
                context: "Physical topology and cable connections",
                taskType: "topology-builder",
                instruction: "Place 2 PCs and 1 router, then connect them with straight-through cables",
                hint: "Drag devices from the toolkit, then use cables to connect PC ports to router ports",
                requiredDevices: [
                    { type: "pc", count: 2 },
                    { type: "router", count: 1 }
                ],
                requiredConnections: 2,
                successCriteria: {
                    devicesPlaced: 3,
                    connectionsValid: 2,
                    topologyCorrect: true
                }
            },
            2: {
                name: "IP Up: Address Assignment",
                story: "🌐 The devices are connected but they can't communicate! Each device needs a unique IP address on the same network segment to establish communication.",
                objective: "Assign IP addresses and confirm basic connectivity",
                character: "🔧 Sarah (Systems Admin)",
                context: "IP addressing and subnet configuration",
                taskType: "ip-assignment",
                instruction: "Configure IP addresses in the same subnet and test connectivity with ping",
                hint: "Use 192.168.1.0/24 network - assign .10, .11 to PCs and .1 to router",
                requiredSubnet: "192.168.1.0/24",
                deviceConfigs: [
                    { type: "pc", ip: "192.168.1.10", mask: "255.255.255.0" },
                    { type: "pc", ip: "192.168.1.11", mask: "255.255.255.0" },
                    { type: "router", ip: "192.168.1.1", mask: "255.255.255.0" }
                ],
                successCriteria: {
                    allConfigured: true,
                    pingSuccessful: true
                }
            },
            3: {
                name: "Switch It On!",
                story: "⚡ The police terminal and CCTV station are flooding the router with local traffic. You need to add a switch to handle local communication more efficiently.",
                objective: "Add a switch to improve local device communication",
                character: "👮‍♀️ Officer Kim (Security Tech)",
                context: "LAN switching and traffic optimization",
                taskType: "switch-optimization",
                instruction: "Add a switch and connect PCs to it for faster local communication",
                hint: "Connect PCs to switch first, then switch to router - observe improved local ping times",
                requiredDevices: [
                    { type: "pc", count: 2 },
                    { type: "switch", count: 1 },
                    { type: "router", count: 1 }
                ],
                successCriteria: {
                    switchAdded: true,
                    localTrafficOptimized: true,
                    pingImproved: true
                }
            },
            4: {
                name: "Route Me Right",
                story: "🏢 The city has expanded! East district and West district need separate networks, but emergency services must communicate across both zones during crisis situations.",
                objective: "Set static routes for inter-network communication",
                character: "🚨 Captain Rodriguez (Emergency Coordinator)",
                context: "Inter-network routing and static routes",
                taskType: "static-routing",
                instruction: "Configure static routes between two networks: 192.168.1.0/24 and 192.168.2.0/24",
                hint: "Set up routes on both routers: R1 needs route to 192.168.2.0/24 via R2, and vice versa",
                networks: [
                    { subnet: "192.168.1.0/24", router: "R1" },
                    { subnet: "192.168.2.0/24", router: "R2" }
                ],
                successCriteria: {
                    routesConfigured: true,
                    crossNetworkPing: true
                }
            },
            5: {
                name: "Command Central",
                story: "💻 City sensors are reporting critical data to command central, but the network is experiencing issues. You need to troubleshoot using command-line tools to diagnose and fix routing problems.",
                objective: "Use CLI commands to troubleshoot and configure network routes",
                character: "🎯 Commander Chen (Operations Chief)",
                context: "CLI troubleshooting and advanced routing",
                taskType: "cli-troubleshooting",
                instruction: "Use CLI commands to check routes, diagnose issues, and add missing static routes",
                hint: "Try 'show ip route', 'ping', and 'ip route add' commands to fix connectivity",
                cliCommands: [
                    "show ip route",
                    "ping 192.168.2.10",
                    "traceroute 192.168.2.10",
                    "ip route add 192.168.2.0/24 via 192.168.100.2"
                ],
                successCriteria: {
                    routesDiagnosed: true,
                    issuesFixed: true,
                    connectivityRestored: true
                }
            }
        };
    }    async init() {
        console.log('Room 2 (Network Nexus) initializing...');
        this.loadCurrentLevel();
        this.render();
        // Don't auto-start challenge - wait for start button
    }

    loadCurrentLevel() {
        // Ensure currentLevel is within valid bounds
        if (this.currentLevel < 1) {
            this.currentLevel = 1;
        } else if (this.currentLevel > this.maxLevels) {
            this.currentLevel = this.maxLevels;
        }

        this.currentLevelData = this.levelScenarios[this.currentLevel];
        
        if (!this.currentLevelData) {
            console.error(`Level data not found for level ${this.currentLevel}`);
            this.currentLevel = 1;
            this.currentLevelData = this.levelScenarios[1];
        }

        // Reset level-specific state
        this.selectedDevice = null;
        this.selectedCable = null;
        this.connectionStart = null;
        this.placedDevices = [];
        this.connections = [];
        this.completionScore = 0;
        this.isActive = false;
        this.networkDevices.clear();
        this.routingTables.clear();
        this.pingResults = [];
        
        console.log(`Loading Level ${this.currentLevel}/${this.maxLevels}: ${this.currentLevelData.name}`);
    }

    render() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-diagram-3 text-6xl text-blue-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-blue-400">NETWORK NEXUS – BUILD THE BACKBONE</h2>
                    <p class="text-gray-300 mt-2">Level ${this.currentLevel}: ${this.currentLevelData.name}</p>
                </div>
                
                <!-- Progress and Status -->
                <div class="status-panel grid grid-cols-3 gap-4 mb-6">
                    <div class="status-card bg-blue-900 p-4 rounded text-center">
                        <i class="bi bi-router text-blue-400 text-2xl"></i>
                        <p class="text-sm text-blue-200">Network Level</p>
                        <p id="network-level" class="text-2xl font-bold text-blue-100">${this.currentLevel}/${this.maxLevels}</p>
                        <p class="text-xs text-blue-300">${this.currentLevelData.name}</p>
                    </div>
                    <div class="status-card bg-green-900 p-4 rounded text-center">
                        <i class="bi bi-ethernet text-green-400 text-2xl"></i>
                        <p class="text-sm text-green-200">Devices Connected</p>
                        <p id="devices-connected" class="text-2xl font-bold text-green-100">${this.connections.length}</p>
                        <p class="text-xs text-green-300">Active Links</p>
                    </div>
                    <div class="status-card bg-purple-900 p-4 rounded text-center">
                        <i class="bi bi-check-circle text-purple-400 text-2xl"></i>
                        <p class="text-sm text-purple-200">Progress</p>
                        <p id="level-progress" class="text-2xl font-bold text-purple-100">${Math.round(this.completionScore)}%</p>
                        <p class="text-xs text-purple-300">Completed</p>
                    </div>
                </div>

                <!-- Scenario Information Panel -->
                <div class="scenario-panel bg-gray-700 p-4 rounded-lg mb-4">
                    <div class="flex items-start gap-4 mb-3">
                        <div class="scenario-info flex-1">
                            <h4 class="text-white font-bold mb-2 flex items-center">
                                🎭 <span class="ml-2">${this.currentLevelData.name}</span>
                            </h4>
                            <div class="scenario-context bg-gray-600 p-3 rounded mb-3">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-blue-400 font-bold">👤 Character:</span>
                                    <span class="text-blue-300">${this.currentLevelData.character}</span>
                                </div>
                                <div class="text-gray-300 text-sm">
                                    <span class="text-purple-400 font-bold">📖 Situation:</span>
                                    <p class="mt-1">${this.currentLevelData.story}</p>
                                </div>
                            </div>
                            <div class="task-instruction bg-blue-900 p-3 rounded">
                                <p class="text-blue-200 font-bold mb-1">🎯 Your Mission:</p>
                                <p class="text-gray-300 text-sm">${this.currentLevelData.instruction}</p>
                            </div>
                        </div>
                    </div>
                    <div class="hint-section bg-gray-600 p-3 rounded">
                        <span class="text-xs text-gray-400">💡 Hint: </span>
                        <span class="text-xs text-blue-300">${this.currentLevelData.hint}</span>
                    </div>
                </div>

                <!-- Main Challenge Area -->
                <div class="challenge-area bg-gray-800 rounded-lg p-4 mb-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-white">🌐 ${this.currentLevelData.name} Challenge</h3>
                        <div class="challenge-type">
                            <span class="text-gray-300">Type: </span>
                            <span class="font-bold text-blue-400">${this.currentLevelData.taskType.toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <div id="challenge-content" class="bg-black rounded border-2 border-blue-600 relative" 
                         style="min-height: 400px;">
                        ${this.renderChallengeContent()}
                    </div>
                </div>

                <!-- Control Panel -->
                <div class="controls-panel bg-gray-700 p-4 rounded-lg">
                    <div class="flex justify-between items-center">
                        <div class="control-buttons flex gap-2">                            <button id="start-challenge" class="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm transition-colors">
                                <i class="bi bi-play-fill"></i> ${this.isActive ? 'Challenge Active' : 'Start Network Build'}
                            </button>
                            <button id="reset-challenge" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-sm transition-colors">
                                <i class="bi bi-arrow-clockwise"></i> Reset Network
                            </button>
                            <button id="test-connectivity" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm transition-colors">
                                <i class="bi bi-wifi"></i> Test Connectivity
                            </button>
                        </div>
                        <div class="navigation-buttons flex gap-2">
                            <button id="get-hint" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-sm transition-colors">
                                <i class="bi bi-lightbulb"></i> Hint
                            </button>
                            <button id="complete-level" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm transition-colors" disabled>
                                <i class="bi bi-flag-fill"></i> Complete Level
                            </button>
                        </div>
                    </div>
                </div>
            </div>        `;

        this.setupEventListeners();
    }    setupEventListeners() {
        // Main control buttons
        const startBtn = document.getElementById('start-challenge');
        const resetBtn = document.getElementById('reset-challenge');
        const testBtn = document.getElementById('test-connectivity');
        const hintBtn = document.getElementById('get-hint');
        const completeBtn = document.getElementById('complete-level');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startChallenge());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (!this.isActive) {
                    this.showMessage('Please start the challenge first!', 'error');
                    return;
                }
                this.resetChallenge();
            });
        }
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                if (!this.isActive) {
                    this.showMessage('Please start the challenge first to test connectivity!', 'error');
                    return;
                }
                this.testConnectivity();
            });
        }
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                if (!this.isActive) {
                    this.showMessage('Please start the challenge first to get hints!', 'error');
                    return;
                }
                this.showHint();
            });
        }
        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                if (!this.isActive) {
                    this.showMessage('Please start the challenge first!', 'error');
                    return;
                }
                this.completeLevel();
            });
        }

        // Set up challenge-specific listeners
        this.setupChallengeSpecificListeners();
    }

    renderChallengeContent() {
        switch(this.currentLevelData.taskType) {
            case 'topology-builder':
                return this.renderTopologyBuilder();
            case 'ip-assignment':
                return this.renderIPAssignment();
            case 'switch-optimization':
                return this.renderSwitchOptimization();
            case 'static-routing':
                return this.renderStaticRouting();
            case 'cli-troubleshooting':
                return this.renderCLITroubleshooting();
            default:
                return '<div class="p-8 text-center text-gray-400">Challenge type not implemented</div>';
        }
    }

    renderTopologyBuilder() {
        return `
            <div class="topology-builder p-6">
                <h4 class="text-white font-bold mb-4 text-center">🔧 Network Topology Builder</h4>
                
                <div class="grid grid-cols-4 gap-4">
                    <!-- Device Toolkit -->
                    <div class="toolkit bg-gray-700 p-4 rounded">
                        <h5 class="text-white font-bold mb-3">🛠️ Device Toolkit</h5>
                        <div class="space-y-3">
                            <div class="device-option bg-blue-600 p-3 rounded cursor-pointer hover:bg-blue-500" 
                                 data-device="pc" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">💻</div>
                                    <div class="text-sm font-bold">PC</div>
                                    <div class="text-xs">End Device</div>
                                </div>
                            </div>
                            <div class="device-option bg-green-600 p-3 rounded cursor-pointer hover:bg-green-500" 
                                 data-device="router" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">🔀</div>
                                    <div class="text-sm font-bold">Router</div>
                                    <div class="text-xs">Layer 3</div>
                                </div>
                            </div>
                            <div class="device-option bg-purple-600 p-3 rounded cursor-pointer hover:bg-purple-500" 
                                 data-device="switch" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">🔗</div>
                                    <div class="text-sm font-bold">Switch</div>
                                    <div class="text-xs">Layer 2</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cable-options mt-4">
                            <h6 class="text-white font-bold mb-2">🔌 Cables</h6>
                            <div class="cable-option bg-yellow-600 p-2 rounded cursor-pointer hover:bg-yellow-500 text-center" 
                                 data-cable="ethernet">
                                <div class="text-sm">━━━</div>
                                <div class="text-xs">Ethernet</div>
                            </div>
                        </div>
                    </div>

                    <!-- Network Canvas -->
                    <div class="network-canvas col-span-3 bg-gray-900 rounded relative min-h-96 border-2 border-dashed border-gray-500" 
                         id="network-canvas">
                        <div class="absolute top-2 left-2 text-gray-400 text-sm">
                            Drop devices here and connect with cables
                        </div>
                        <svg id="connection-svg" class="absolute top-0 left-0 w-full h-full pointer-events-none" style="z-index: 1;">
                            <!-- Network connections will be drawn here -->
                        </svg>
                    </div>
                </div>

                <!-- Connection Status -->
                <div class="connection-status mt-4 p-4 bg-gray-900 rounded">
                    <h5 class="text-white font-bold mb-2">🔗 Network Status</h5>
                    <div id="network-status" class="text-sm text-gray-300">
                        <div>Devices Placed: <span id="device-count">0</span>/3</div>
                        <div>Connections: <span id="connection-count">0</span>/2</div>
                        <div>Network Status: <span id="topology-status" class="text-red-400">Incomplete</span></div>
                    </div>
                </div>

                <div id="topology-feedback" class="mt-4 text-center"></div>
            </div>
        `;
    }

    renderIPAssignment() {
        return `
            <div class="ip-assignment p-6">
                <h4 class="text-white font-bold mb-4 text-center">🌐 IP Address Configuration</h4>
                
                <div class="grid grid-cols-2 gap-6">
                    <!-- Device Configuration Panel -->
                    <div class="config-panel bg-gray-700 p-4 rounded">
                        <h5 class="text-white font-bold mb-3">⚙️ Device Configuration</h5>
                        
                        <div class="device-configs space-y-4">
                            <div class="device-config bg-blue-900 p-3 rounded">
                                <h6 class="text-blue-200 font-bold mb-2">💻 PC1 Configuration</h6>
                                <div class="space-y-2">
                                    <input type="text" id="pc1-ip" placeholder="IP Address (e.g., 192.168.1.10)" 
                                           class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600">
                                    <input type="text" id="pc1-mask" placeholder="Subnet Mask (e.g., 255.255.255.0)" 
                                           class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600">
                                    <input type="text" id="pc1-gateway" placeholder="Default Gateway" 
                                           class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600">
                                </div>
                                <button class="apply-config mt-2 bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm" 
                                        data-device="pc1">Apply Config</button>
                            </div>

                            <div class="device-config bg-blue-900 p-3 rounded">
                                <h6 class="text-blue-200 font-bold mb-2">💻 PC2 Configuration</h6>
                                <div class="space-y-2">
                                    <input type="text" id="pc2-ip" placeholder="IP Address (e.g., 192.168.1.11)" 
                                           class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600">
                                    <input type="text" id="pc2-mask" placeholder="Subnet Mask (e.g., 255.255.255.0)" 
                                           class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600">
                                    <input type="text" id="pc2-gateway" placeholder="Default Gateway" 
                                           class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600">
                                </div>
                                <button class="apply-config mt-2 bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm" 
                                        data-device="pc2">Apply Config</button>
                            </div>

                            <div class="device-config bg-green-900 p-3 rounded">
                                <h6 class="text-green-200 font-bold mb-2">🔀 Router Configuration</h6>
                                <div class="space-y-2">
                                    <input type="text" id="router-ip" placeholder="IP Address (e.g., 192.168.1.1)" 
                                           class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600">
                                    <input type="text" id="router-mask" placeholder="Subnet Mask (e.g., 255.255.255.0)" 
                                           class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600">
                                </div>
                                <button class="apply-config mt-2 bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm" 
                                        data-device="router">Apply Config</button>
                            </div>
                        </div>
                    </div>

                    <!-- Network Testing Panel -->
                    <div class="testing-panel bg-gray-700 p-4 rounded">
                        <h5 class="text-white font-bold mb-3">🧪 Connectivity Testing</h5>
                        
                        <div class="ping-section bg-gray-800 p-3 rounded mb-4">
                            <h6 class="text-yellow-300 font-bold mb-2">📡 Ping Test</h6>
                            <div class="flex gap-2 mb-2">
                                <input type="text" id="ping-source" placeholder="Source IP" 
                                       class="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600">
                                <input type="text" id="ping-destination" placeholder="Destination IP" 
                                       class="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600">
                                <button id="execute-ping" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded">
                                    Ping
                                </button>
                            </div>
                            <div id="ping-results" class="bg-black p-3 rounded text-green-400 font-mono text-sm min-h-16">
                                Ping results will appear here...
                            </div>
                        </div>

                        <div class="network-diagram bg-gray-800 p-3 rounded">
                            <h6 class="text-blue-300 font-bold mb-2">🗺️ Network Diagram</h6>
                            <div class="text-center text-gray-400 text-sm">
                                <div class="mb-2">Required Subnet: 192.168.1.0/24</div>
                                <div class="flex justify-center items-center space-x-4">
                                    <div class="device-icon bg-blue-600 p-2 rounded">💻 PC1</div>
                                    <div>━━━</div>
                                    <div class="device-icon bg-green-600 p-2 rounded">🔀 Router</div>
                                    <div>━━━</div>
                                    <div class="device-icon bg-blue-600 p-2 rounded">💻 PC2</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="ip-feedback" class="mt-4 text-center"></div>
            </div>
        `;
    }

    renderSwitchOptimization() {
        return `
            <div class="switch-optimization p-6">
                <h4 class="text-white font-bold mb-4 text-center">⚡ Switch Optimization Challenge</h4>
                
                <div class="grid grid-cols-4 gap-4">
                    <!-- Device Toolkit -->
                    <div class="toolkit bg-gray-700 p-4 rounded">
                        <h5 class="text-white font-bold mb-3">🛠️ Device Toolkit</h5>
                        <div class="space-y-3">
                            <div class="device-option bg-blue-600 p-3 rounded cursor-pointer hover:bg-blue-500" 
                                 data-device="pc" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">💻</div>
                                    <div class="text-sm font-bold">PC</div>
                                    <div class="text-xs">Police Terminal</div>
                                </div>
                            </div>
                            <div class="device-option bg-purple-600 p-3 rounded cursor-pointer hover:bg-purple-500" 
                                 data-device="switch" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">🔗</div>
                                    <div class="text-sm font-bold">Switch</div>
                                    <div class="text-xs">Layer 2 Device</div>
                                </div>
                            </div>
                            <div class="device-option bg-green-600 p-3 rounded cursor-pointer hover:bg-green-500" 
                                 data-device="router" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">🔀</div>
                                    <div class="text-sm font-bold">Router</div>
                                    <div class="text-xs">Gateway</div>
                                </div>
                            </div>
                            <div class="device-option bg-orange-600 p-3 rounded cursor-pointer hover:bg-orange-500" 
                                 data-device="cctv" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">📹</div>
                                    <div class="text-sm font-bold">CCTV</div>
                                    <div class="text-xs">Security Camera</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cable-options mt-4">
                            <h6 class="text-white font-bold mb-2">🔌 Cables</h6>
                            <div class="cable-option bg-yellow-600 p-2 rounded cursor-pointer hover:bg-yellow-500 text-center" 
                                 data-cable="ethernet">
                                <div class="text-sm">━━━</div>
                                <div class="text-xs">Ethernet</div>
                            </div>
                        </div>
                    </div>

                    <!-- Network Canvas -->
                    <div class="network-canvas col-span-3 bg-gray-900 rounded relative min-h-96 border-2 border-dashed border-gray-500" 
                         id="switch-network-canvas">
                        <div class="absolute top-2 left-2 text-gray-400 text-sm">
                            Build optimized network: PCs → Switch → Router
                        </div>
                        <svg id="switch-connection-svg" class="absolute top-0 left-0 w-full h-full pointer-events-none" style="z-index: 1;">
                            <!-- Network connections will be drawn here -->
                        </svg>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="performance-metrics mt-4 grid grid-cols-3 gap-4">
                    <div class="metric bg-gray-900 p-3 rounded text-center">
                        <div class="text-yellow-400 font-bold">Network Latency</div>
                        <div id="network-latency" class="text-2xl text-white">--</div>
                        <div class="text-xs text-gray-400">milliseconds</div>
                    </div>
                    <div class="metric bg-gray-900 p-3 rounded text-center">
                        <div class="text-green-400 font-bold">Switch Efficiency</div>
                        <div id="switch-efficiency" class="text-2xl text-white">0%</div>
                        <div class="text-xs text-gray-400">local traffic</div>
                    </div>
                    <div class="metric bg-gray-900 p-3 rounded text-center">
                        <div class="text-blue-400 font-bold">Topology Score</div>
                        <div id="topology-score" class="text-2xl text-white">0/100</div>
                        <div class="text-xs text-gray-400">optimization</div>
                    </div>
                </div>

                <div id="switch-feedback" class="mt-4 text-center"></div>
            </div>
        `;
    }

    renderStaticRouting() {
        return `
            <div class="static-routing p-6">
                <h4 class="text-white font-bold mb-4 text-center">🔀 Static Routing Configuration</h4>
                
                <div class="routing-scenario grid grid-cols-2 gap-6">
                    <!-- Network Topology -->
                    <div class="topology-panel bg-gray-700 p-4 rounded">
                        <h5 class="text-white font-bold mb-3">🗺️ Network Topology</h5>
                        <div class="network-diagram bg-black p-4 rounded text-center">
                            <div class="grid grid-cols-3 gap-4 items-center">
                                <!-- East District -->
                                <div class="district">
                                    <div class="bg-blue-900 p-3 rounded mb-2">
                                        <div class="text-blue-300 font-bold">East District</div>
                                        <div class="text-xs text-blue-400">192.168.1.0/24</div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="bg-blue-600 p-2 rounded text-xs">💻 Police HQ</div>
                                        <div class="bg-blue-600 p-2 rounded text-xs">🏥 Hospital</div>
                                    </div>
                                    <div class="bg-green-600 p-2 rounded mt-2 text-xs">🔀 Router R1</div>
                                </div>
                                
                                <!-- Connection -->
                                <div class="connection text-center">
                                    <div class="text-gray-400">━━━━━━</div>
                                    <div class="text-xs text-gray-500">WAN Link</div>
                                    <div class="text-xs text-gray-500">192.168.100.0/30</div>
                                </div>
                                
                                <!-- West District -->
                                <div class="district">
                                    <div class="bg-purple-900 p-3 rounded mb-2">
                                        <div class="text-purple-300 font-bold">West District</div>
                                        <div class="text-xs text-purple-400">192.168.2.0/24</div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="bg-purple-600 p-2 rounded text-xs">🚒 Fire Station</div>
                                        <div class="bg-purple-600 p-2 rounded text-xs">🏫 School</div>
                                    </div>
                                    <div class="bg-green-600 p-2 rounded mt-2 text-xs">🔀 Router R2</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Routing Configuration -->
                    <div class="config-panel bg-gray-700 p-4 rounded">
                        <h5 class="text-white font-bold mb-3">⚙️ Static Route Configuration</h5>
                        
                        <div class="router-config mb-4">
                            <h6 class="text-blue-300 font-bold mb-2">Router R1 (East District)</h6>
                            <div class="space-y-2">
                                <input type="text" id="r1-destination" placeholder="Destination Network (192.168.2.0/24)" 
                                       class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 text-sm">
                                <input type="text" id="r1-gateway" placeholder="Next Hop (192.168.100.2)" 
                                       class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 text-sm">
                                <button id="add-r1-route" class="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm w-full">
                                    Add Route to R1
                                </button>
                            </div>
                        </div>

                        <div class="router-config mb-4">
                            <h6 class="text-purple-300 font-bold mb-2">Router R2 (West District)</h6>
                            <div class="space-y-2">
                                <input type="text" id="r2-destination" placeholder="Destination Network (192.168.1.0/24)" 
                                       class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 text-sm">
                                <input type="text" id="r2-gateway" placeholder="Next Hop (192.168.100.1)" 
                                       class="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 text-sm">
                                <button id="add-r2-route" class="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm w-full">
                                    Add Route to R2
                                </button>
                            </div>
                        </div>

                        <div class="test-connectivity bg-gray-800 p-3 rounded">
                            <h6 class="text-green-300 font-bold mb-2">🧪 Test Inter-District Communication</h6>
                            <div class="flex gap-2 mb-2">
                                <button id="test-east-to-west" class="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-xs flex-1">
                                    Police → Fire Station
                                </button>
                                <button id="test-west-to-east" class="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-xs flex-1">
                                    School → Hospital
                                </button>
                            </div>
                            <div id="routing-test-results" class="bg-black p-2 rounded text-green-400 font-mono text-xs min-h-16">
                                Connectivity test results will appear here...
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Routing Table Status -->
                <div class="routing-status mt-4 bg-gray-900 p-4 rounded">
                    <h5 class="text-white font-bold mb-2">📋 Routing Table Status</h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h6 class="text-blue-300 font-bold">Router R1 Routes:</h6>
                            <div id="r1-routes" class="text-sm text-gray-300">No static routes configured</div>
                        </div>
                        <div>
                            <h6 class="text-purple-300 font-bold">Router R2 Routes:</h6>
                            <div id="r2-routes" class="text-sm text-gray-300">No static routes configured</div>
                        </div>
                    </div>
                </div>

                <div id="routing-feedback" class="mt-4 text-center"></div>
            </div>
        `;
    }

    renderCLITroubleshooting() {
        return `
            <div class="cli-troubleshooting p-6">
                <h4 class="text-white font-bold mb-4 text-center">💻 CLI Network Troubleshooting</h4>
                
                <div class="cli-environment grid grid-cols-2 gap-6">
                    <!-- Command Terminal -->
                    <div class="terminal-panel bg-gray-700 p-4 rounded">
                        <h5 class="text-white font-bold mb-3">🖥️ Command Terminal</h5>
                        
                        <div class="terminal bg-black p-3 rounded font-mono text-sm">
                            <div class="terminal-header text-green-400 mb-2">
                                command-central:~$ Connected to Router R1
                            </div>
                            <div id="terminal-output" class="terminal-output text-green-300 min-h-64 max-h-64 overflow-y-auto">
                                Welcome to Network Command Center<br>
                                Type 'help' for available commands<br>
                                <br>
                                R1>
                            </div>
                            <div class="terminal-input flex mt-2">
                                <span class="text-green-400">R1> </span>
                                <input type="text" id="cli-input" 
                                       class="flex-1 bg-transparent text-green-300 outline-none ml-1 font-mono"
                                       placeholder="Enter command..."
                                       autocomplete="off">
                            </div>
                        </div>
                        
                        <div class="quick-commands mt-3">
                            <h6 class="text-gray-300 font-bold mb-2">Quick Commands:</h6>
                            <div class="grid grid-cols-2 gap-2">
                                <button class="quick-cmd bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs" 
                                        data-cmd="show ip route">show ip route</button>
                                <button class="quick-cmd bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs" 
                                        data-cmd="ping 192.168.2.10">ping 192.168.2.10</button>
                                <button class="quick-cmd bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs" 
                                        data-cmd="traceroute 192.168.2.10">traceroute</button>
                                <button class="quick-cmd bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs" 
                                        data-cmd="help">help</button>
                            </div>
                        </div>
                    </div>

                    <!-- Network Status & Diagnostics -->
                    <div class="diagnostics-panel bg-gray-700 p-4 rounded">
                        <h5 class="text-white font-bold mb-3">🔍 Network Diagnostics</h5>
                        
                        <div class="network-status bg-gray-800 p-3 rounded mb-4">
                            <h6 class="text-red-400 font-bold mb-2">🚨 Reported Issues:</h6>
                            <div class="issues-list text-sm space-y-1">
                                <div class="text-red-300">• City sensors cannot reach command central</div>
                                <div class="text-red-300">• Emergency services communication down</div>
                                <div class="text-red-300">• Cross-district routing failure</div>
                            </div>
                        </div>

                        <div class="diagnostic-tools bg-gray-800 p-3 rounded mb-4">
                            <h6 class="text-yellow-400 font-bold mb-2">🛠️ Diagnostic Tools:</h6>
                            <div class="tools-grid space-y-2">
                                <button id="run-connectivity-test" class="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded text-sm w-full">
                                    Run Connectivity Test
                                </button>
                                <button id="check-routing-table" class="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded text-sm w-full">
                                    Check Routing Tables
                                </button>
                                <button id="analyze-network" class="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded text-sm w-full">
                                    Analyze Network Topology
                                </button>
                            </div>
                        </div>

                        <div class="fix-progress bg-gray-800 p-3 rounded">
                            <h6 class="text-green-400 font-bold mb-2">✅ Fix Progress:</h6>
                            <div class="progress-items text-sm space-y-1">
                                <div id="fix-diagnosis" class="text-gray-400">❌ Diagnose routing issues</div>
                                <div id="fix-routes" class="text-gray-400">❌ Configure missing routes</div>
                                <div id="fix-connectivity" class="text-gray-400">❌ Restore connectivity</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="cli-feedback" class="mt-4 text-center"></div>
            </div>
        `;
    }

    setupEventListeners() {
        // Main control buttons
        const startBtn = document.getElementById('start-challenge');
        const resetBtn = document.getElementById('reset-challenge');
        const testBtn = document.getElementById('test-connectivity');
        const hintBtn = document.getElementById('get-hint');
        const completeBtn = document.getElementById('complete-level');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startChallenge());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetChallenge());
        }
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testConnectivity());
        }
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.showHint());
        }
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeLevel());
        }

        // Set up challenge-specific listeners
        this.setupChallengeSpecificListeners();
    }

    setupChallengeSpecificListeners() {
        switch(this.currentLevelData.taskType) {
            case 'topology-builder':
                this.setupTopologyListeners();
                break;
            case 'ip-assignment':
                this.setupIPAssignmentListeners();
                break;
            case 'switch-optimization':
                this.setupSwitchOptimizationListeners();
                break;
            case 'static-routing':
                this.setupStaticRoutingListeners();
                break;
            case 'cli-troubleshooting':
                this.setupCLITroubleshootingListeners();
                break;
        }
    }    setupTopologyListeners() {
        // Set up drag and drop for devices
        const deviceOptions = document.querySelectorAll('.device-option');
        const networkCanvas = document.getElementById('network-canvas');

        deviceOptions.forEach(option => {
            option.addEventListener('dragstart', (e) => {
                if (!this.isActive) {
                    e.preventDefault();
                    this.showMessage('Please click "Start Network Build" to begin placing devices!', 'error');
                    return;
                }
                e.dataTransfer.setData('text/plain', option.dataset.device);
            });
        });

        if (networkCanvas) {
            networkCanvas.addEventListener('dragover', (e) => {
                if (!this.isActive) {
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
            });

            networkCanvas.addEventListener('drop', (e) => {
                if (!this.isActive) {
                    e.preventDefault();
                    this.showMessage('Please click "Start Network Build" to begin placing devices!', 'error');
                    return;
                }
                e.preventDefault();
                const deviceType = e.dataTransfer.getData('text/plain');
                const rect = networkCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.placeDevice(deviceType, x, y);
            });

            // Click to connect devices
            networkCanvas.addEventListener('click', (e) => {
                if (!this.isActive) {
                    this.showMessage('Please click "Start Network Build" to begin connecting devices!', 'error');
                    return;
                }
                if (this.selectedCable) {
                    this.handleDeviceConnection(e);
                }
            });
        }

        // Cable selection
        const cableOption = document.querySelector('.cable-option');
        if (cableOption) {
            cableOption.addEventListener('click', () => {
                if (!this.isActive) {
                    this.showMessage('Please click "Start Network Build" to begin selecting cables!', 'error');
                    return;
                }
                this.selectedCable = cableOption.dataset.cable;
                cableOption.classList.add('ring-2', 'ring-yellow-400');
                this.showMessage('Cable selected! Click two devices to connect them.', 'info');
            });
        }
    }    placeDevice(deviceType, x, y) {
        if (!this.isActive) {
            this.showMessage('Please click "Start Network Build" to begin placing devices!', 'error');
            return;
        }
        
        const deviceId = `${deviceType}_${this.deviceIdCounter++}`;
        const device = {
            id: deviceId,
            type: deviceType,
            x: x,
            y: y,
            connections: [],
            config: {}
        };

        this.placedDevices.push(device);
        this.createDeviceElement(device);
        this.updateNetworkStatus();
        this.checkTopologyCompletion();
    }

    createDeviceElement(device) {
        const networkCanvas = document.getElementById('network-canvas');
        const element = document.createElement('div');
        element.className = 'network-device absolute cursor-pointer transition-all duration-200 hover:scale-110';
        element.style.left = `${device.x - 25}px`;
        element.style.top = `${device.y - 25}px`;
        element.style.width = '50px';
        element.style.height = '50px';
        element.style.zIndex = '10';
        element.setAttribute('data-device-id', device.id);

        const deviceIcons = {
            'pc': { icon: '💻', color: '#3b82f6' },
            'router': { icon: '🔀', color: '#10b981' },
            'switch': { icon: '🔗', color: '#8b5cf6' }
        };

        const deviceInfo = deviceIcons[device.type] || deviceIcons['pc'];
        
        element.innerHTML = `
            <div class="device-visual bg-gray-800 border-2 rounded-lg p-2 text-center" 
                 style="border-color: ${deviceInfo.color}; background: linear-gradient(45deg, #1f2937, ${deviceInfo.color}20);">
                <div style="font-size: 24px;">${deviceInfo.icon}</div>
                <div style="font-size: 8px; color: white; margin-top: 2px;">${device.id}</div>
            </div>
        `;

        networkCanvas.appendChild(element);
        device.element = element;
    }    handleDeviceConnection(e) {
        if (!this.isActive) {
            this.showMessage('Please click "Start Network Build" to begin connecting devices!', 'error');
            return;
        }
        
        const target = e.target.closest('.network-device');
        if (!target) return;

        const deviceId = target.getAttribute('data-device-id');
        
        if (!this.connectionStart) {
            this.connectionStart = deviceId;
            target.classList.add('ring-2', 'ring-yellow-400');
            this.showMessage('First device selected. Click another device to connect.', 'info');
        } else if (this.connectionStart !== deviceId) {
            this.createConnection(this.connectionStart, deviceId);
            document.querySelector(`[data-device-id="${this.connectionStart}"]`).classList.remove('ring-2', 'ring-yellow-400');
            this.connectionStart = null;
            this.selectedCable = null;
            document.querySelector('.cable-option').classList.remove('ring-2', 'ring-yellow-400');
        }
    }

    createConnection(fromId, toId) {
        const connection = {
            id: `conn_${this.connections.length + 1}`,
            from: fromId,
            to: toId,
            type: this.selectedCable || 'ethernet'
        };

        this.connections.push(connection);
        this.drawConnection(connection);
        this.updateNetworkStatus();
        this.checkTopologyCompletion();
        this.showMessage(`Connected ${fromId} to ${toId}`, 'success');
    }

    drawConnection(connection) {
        const svg = document.getElementById('connection-svg');
        const fromDevice = this.placedDevices.find(d => d.id === connection.from);
        const toDevice = this.placedDevices.find(d => d.id === connection.to);

        if (!fromDevice || !toDevice) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromDevice.x);
        line.setAttribute('y1', fromDevice.y);
        line.setAttribute('x2', toDevice.x);
        line.setAttribute('y2', toDevice.y);
        line.setAttribute('stroke', '#60a5fa');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-dasharray', '5,5');
        line.classList.add('animate-pulse');

        svg.appendChild(line);
        connection.element = line;
    }

    updateNetworkStatus() {
        document.getElementById('device-count').textContent = this.placedDevices.length;
        document.getElementById('connection-count').textContent = this.connections.length;
        document.getElementById('devices-connected').textContent = this.connections.length;
    }

    checkTopologyCompletion() {
        const required = this.currentLevelData.requiredDevices || [];
        const requiredConnections = this.currentLevelData.requiredConnections || 0;

        let deviceCheck = true;
        required.forEach(req => {
            const count = this.placedDevices.filter(d => d.type === req.type).length;
            if (count < req.count) deviceCheck = false;
        });

        const connectionCheck = this.connections.length >= requiredConnections;
        
        if (deviceCheck && connectionCheck) {
            this.completionScore = 100;
            document.getElementById('topology-status').textContent = 'Complete';
            document.getElementById('topology-status').className = 'text-green-400';
            this.enableCompleteButton();
            this.showFeedback('Excellent! Network topology is correctly built!', 'success');
        } else {
            const status = !deviceCheck ? 'Missing devices' : 'Missing connections';
            document.getElementById('topology-status').textContent = status;
            document.getElementById('topology-status').className = 'text-red-400';
        }
        
        this.updateProgress();
    }    setupSwitchOptimizationListeners() {
        // Add listeners for switch optimization challenge
        // Similar to topology builder but with optimization metrics
        this.setupTopologyListeners(); // Reuse topology listeners
    }

    setupIPAssignmentListeners() {
        // Add listeners for apply config buttons
        document.querySelectorAll('.apply-config').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isActive) {
                    this.showMessage('Please click "Start Network Build" to begin configuring devices!', 'error');
                    return;
                }
                const deviceId = btn.dataset.device;
                this.applyDeviceConfig(deviceId);
            });
        });

        // Add listener for ping button
        document.getElementById('execute-ping')?.addEventListener('click', () => {
            if (!this.isActive) {
                this.showMessage('Please click "Start Network Build" to begin testing connectivity!', 'error');
                return;
            }
            this.executePing();
        });
    }    setupStaticRoutingListeners() {
        // Add route configuration buttons
        document.getElementById('add-r1-route')?.addEventListener('click', () => {
            if (!this.isActive) {
                this.showMessage('Please click "Start Network Build" to begin configuring routes!', 'error');
                return;
            }
            this.addStaticRoute('r1');
        });

        document.getElementById('add-r2-route')?.addEventListener('click', () => {
            if (!this.isActive) {
                this.showMessage('Please click "Start Network Build" to begin configuring routes!', 'error');
                return;
            }
            this.addStaticRoute('r2');
        });

        // Test connectivity buttons
        document.getElementById('test-east-to-west')?.addEventListener('click', () => {
            if (!this.isActive) {
                this.showMessage('Please click "Start Network Build" to begin testing connectivity!', 'error');
                return;
            }
            this.testInterDistrictConnectivity('east-to-west');
        });

        document.getElementById('test-west-to-east')?.addEventListener('click', () => {
            if (!this.isActive) {
                this.showMessage('Please click "Start Network Build" to begin testing connectivity!', 'error');
                return;
            }
            this.testInterDistrictConnectivity('west-to-east');
        });
    }

    addStaticRoute(router) {
        const destination = document.getElementById(`${router}-destination`).value;
        const gateway = document.getElementById(`${router}-gateway`).value;

        if (!destination || !gateway) {
            this.showMessage('Please enter destination network and next hop gateway', 'error');
            return;
        }

        // Store the route
        if (!this.routingTables.has(router)) {
            this.routingTables.set(router, []);
        }
        
        this.routingTables.get(router).push({
            destination: destination,
            gateway: gateway
        });

        this.showMessage(`Route added to ${router.toUpperCase()}: ${destination} via ${gateway}`, 'success');
        this.updateRoutingTableDisplay();
        this.checkStaticRoutingCompletion();
    }

    updateRoutingTableDisplay() {
        ['r1', 'r2'].forEach(router => {
            const element = document.getElementById(`${router}-routes`);
            if (element) {
                const routes = this.routingTables.get(router) || [];
                if (routes.length === 0) {
                    element.textContent = 'No static routes configured';
                } else {
                    element.innerHTML = routes.map(route => 
                        `${route.destination} via ${route.gateway}`
                    ).join('<br>');
                }
            }
        });
    }

    testInterDistrictConnectivity(direction) {
        const resultsDiv = document.getElementById('routing-test-results');
        const hasR1Route = this.routingTables.has('r1') && this.routingTables.get('r1').length > 0;
        const hasR2Route = this.routingTables.has('r2') && this.routingTables.get('r2').length > 0;

        if (hasR1Route && hasR2Route) {
            resultsDiv.innerHTML = `
                Testing ${direction} connectivity...<br>
                <span class="text-green-400">SUCCESS: Cross-district communication established</span><br>
                Routing working correctly between networks
            `;
            this.showMessage('Inter-district connectivity test passed!', 'success');
        } else {
            resultsDiv.innerHTML = `
                Testing ${direction} connectivity...<br>
                <span class="text-red-400">FAILED: No route to destination network</span><br>
                Configure static routes on both routers
            `;
            this.showMessage('Connectivity test failed - check routing configuration', 'error');
        }
    }

    checkStaticRoutingCompletion() {
        const hasR1Route = this.routingTables.has('r1') && this.routingTables.get('r1').length > 0;
        const hasR2Route = this.routingTables.has('r2') && this.routingTables.get('r2').length > 0;

        if (hasR1Route && hasR2Route) {
            this.completionScore = 100;
            this.enableCompleteButton();
            this.showFeedback('Excellent! Static routes configured correctly for inter-district communication!', 'success');
        }
        
        this.updateProgress();
    }    setupCLITroubleshootingListeners() {
        // CLI input handling
        const cliInput = document.getElementById('cli-input');
        if (cliInput) {
            cliInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (!this.isActive) {
                        this.showMessage('Please click "Start Network Build" to begin using CLI commands!', 'error');
                        return;
                    }
                    this.processCLICommand(cliInput.value);
                    cliInput.value = '';
                }
            });
        }

        // Quick command buttons
        document.querySelectorAll('.quick-cmd').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isActive) {
                    this.showMessage('Please click "Start Network Build" to begin using CLI commands!', 'error');
                    return;
                }
                const command = btn.dataset.cmd;
                this.processCLICommand(command);
            });
        });

        // Diagnostic tools
        document.getElementById('run-connectivity-test')?.addEventListener('click', () => {
            if (!this.isActive) {
                this.showMessage('Please click "Start Network Build" to begin network diagnostics!', 'error');
                return;
            }
            this.runConnectivityTest();
        });

        document.getElementById('check-routing-table')?.addEventListener('click', () => {
            if (!this.isActive) {
                this.showMessage('Please click "Start Network Build" to begin network diagnostics!', 'error');
                return;
            }
            this.processCLICommand('show ip route');
        });

        document.getElementById('analyze-network')?.addEventListener('click', () => {
            if (!this.isActive) {
                this.showMessage('Please click "Start Network Build" to begin network diagnostics!', 'error');
                return;
            }
            this.analyzeNetwork();
        });
    }

    processCLICommand(command) {
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput) return;

        // Add command to terminal
        terminalOutput.innerHTML += `R1> ${command}<br>`;

        // Process different commands
        switch(command.toLowerCase().trim()) {
            case 'help':
                terminalOutput.innerHTML += `Available commands:<br>
                - show ip route: Display routing table<br>
                - ping [ip]: Test connectivity<br>
                - traceroute [ip]: Trace route path<br>
                - ip route add [network] via [gateway]: Add static route<br><br>`;
                break;
                
            case 'show ip route':
                terminalOutput.innerHTML += `Routing Table:<br>
                C    192.168.1.0/24 is directly connected<br>
                C    192.168.100.0/30 is directly connected<br>
                Missing route to 192.168.2.0/24<br><br>`;
                this.updateFixProgress('diagnosis');
                break;
                
            case 'ping 192.168.2.10':
                terminalOutput.innerHTML += `<span class="text-red-400">Request timeout - no route to host</span><br><br>`;
                break;
                
            case 'traceroute 192.168.2.10':
                terminalOutput.innerHTML += `Tracing route to 192.168.2.10:<br>
                1. 192.168.100.1 - timeout<br>
                <span class="text-red-400">Route failed at hop 1</span><br><br>`;
                break;
                
            case 'ip route add 192.168.2.0/24 via 192.168.100.2':
                terminalOutput.innerHTML += `<span class="text-green-400">Route added successfully</span><br><br>`;
                this.updateFixProgress('routes');
                this.checkCLICompletion();
                break;
                
            default:
                terminalOutput.innerHTML += `<span class="text-red-400">Unknown command: ${command}</span><br><br>`;
        }

        // Auto-scroll to bottom
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    updateFixProgress(step) {
        const progressElements = {
            'diagnosis': 'fix-diagnosis',
            'routes': 'fix-routes',
            'connectivity': 'fix-connectivity'
        };

        const elementId = progressElements[step];
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = element.innerHTML.replace('❌', '✅').replace('text-gray-400', 'text-green-400');
        }
    }

    runConnectivityTest() {
        this.processCLICommand('ping 192.168.2.10');
    }

    analyzeNetwork() {
        this.processCLICommand('show ip route');
        setTimeout(() => {
            this.processCLICommand('traceroute 192.168.2.10');
        }, 1000);
    }

    checkCLICompletion() {
        // Check if all fix steps are completed
        const diagnosisFixed = document.getElementById('fix-diagnosis').classList.contains('text-green-400');
        const routesFixed = document.getElementById('fix-routes').classList.contains('text-green-400');

        if (diagnosisFixed && routesFixed) {
            this.updateFixProgress('connectivity');
            this.completionScore = 100;
            this.enableCompleteButton();
            this.showFeedback('Outstanding! Network troubleshooting completed successfully!', 'success');
        }
        
        this.updateProgress();
    }

    applyDeviceConfig(deviceId) {
        const ip = document.getElementById(`${deviceId}-ip`).value;
        const mask = document.getElementById(`${deviceId}-mask`).value;
        const gateway = document.getElementById(`${deviceId}-gateway`)?.value;

        if (!ip || !mask) {
            this.showMessage('Please enter IP address and subnet mask', 'error');
            return;
        }

        // Validate IP format
        if (!this.validateIP(ip) || !this.validateIP(mask)) {
            this.showMessage('Invalid IP address format', 'error');
            return;
        }

        // Store configuration
        this.networkDevices.set(deviceId, {
            ip: ip,
            mask: mask,
            gateway: gateway || '',
            configured: true
        });

        this.showMessage(`${deviceId.toUpperCase()} configured successfully`, 'success');
        this.checkIPAssignmentCompletion();
    }

    validateIP(ip) {
        const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!pattern.test(ip)) return false;
        
        const parts = ip.split('.');
        return parts.every(part => {
            const num = parseInt(part);
            return num >= 0 && num <= 255;
        });
    }

    executePing() {
        const source = document.getElementById('ping-source').value;
        const destination = document.getElementById('ping-destination').value;

        if (!source || !destination) {
            this.showMessage('Please enter source and destination IPs', 'error');
            return;
        }

        // Simulate ping
        const success = this.simulatePing(source, destination);
        const resultsDiv = document.getElementById('ping-results');
        
        if (success) {
            resultsDiv.innerHTML = `
                PING ${destination} from ${source}<br>
                64 bytes from ${destination}: icmp_seq=1 ttl=64 time=1.23 ms<br>
                64 bytes from ${destination}: icmp_seq=2 ttl=64 time=1.18 ms<br>
                64 bytes from ${destination}: icmp_seq=3 ttl=64 time=1.26 ms<br>
                <span class="text-green-400">--- ${destination} ping statistics ---<br>
                3 packets transmitted, 3 received, 0% packet loss</span>
            `;
            this.showMessage('Ping successful!', 'success');
        } else {
            resultsDiv.innerHTML = `
                PING ${destination} from ${source}<br>
                <span class="text-red-400">Request timeout for icmp_seq 1<br>
                Request timeout for icmp_seq 2<br>
                Request timeout for icmp_seq 3<br>
                --- ${destination} ping statistics ---<br>
                3 packets transmitted, 0 received, 100% packet loss</span>
            `;
            this.showMessage('Ping failed - check network configuration', 'error');
        }
        
        this.checkIPAssignmentCompletion();
    }

    simulatePing(source, destination) {
        // Simple simulation - check if both IPs are in same subnet
        const sourceConfig = Array.from(this.networkDevices.values()).find(d => d.ip === source);
        const destConfig = Array.from(this.networkDevices.values()).find(d => d.ip === destination);
        
        if (!sourceConfig || !destConfig) return false;
        
        // Check if in same subnet (simplified)
        const sourceNetwork = this.getNetworkAddress(source, sourceConfig.mask);
        const destNetwork = this.getNetworkAddress(destination, destConfig.mask);
        
        return sourceNetwork === destNetwork;
    }

    getNetworkAddress(ip, mask) {
        const ipParts = ip.split('.').map(p => parseInt(p));
        const maskParts = mask.split('.').map(p => parseInt(p));
        
        return ipParts.map((part, i) => part & maskParts[i]).join('.');
    }

    checkIPAssignmentCompletion() {
        const requiredDevices = ['pc1', 'pc2', 'router'];
        const allConfigured = requiredDevices.every(device => {
            const config = this.networkDevices.get(device);
            return config && config.configured;
        });

        if (allConfigured) {
            // Check if devices are in same subnet
            const configs = Array.from(this.networkDevices.values());
            const networks = configs.map(config => this.getNetworkAddress(config.ip, config.mask));
            const sameSubnet = networks.every(net => net === networks[0]);

            if (sameSubnet) {
                this.completionScore = 100;
                this.enableCompleteButton();
                this.showFeedback('Perfect! All devices configured in the same subnet and can communicate!', 'success');
            } else {
                this.showFeedback('Devices are not in the same subnet. Check IP addresses.', 'error');
            }
        }
        
        this.updateProgress();
    }

    startChallenge() {
        if (this.isActive) {
            this.showMessage('Challenge is already active!', 'info');
            return;
        }
        
        this.isActive = true;
        this.setupChallengeSpecificListeners();
        
        // Update start button text
        const startBtn = document.getElementById('start-challenge');
        if (startBtn) {
            startBtn.innerHTML = '<i class="bi bi-check-circle"></i> Challenge Active';
            startBtn.disabled = true;
            startBtn.classList.add('bg-green-700');
        }
        
        this.showMessage(`${this.currentLevelData.name} challenge started! Follow the instructions to complete the task.`, 'success');
        console.log(`Challenge started: ${this.currentLevelData.name}`);
    }

    resetChallenge() {
        if (!this.isActive) {
            this.showMessage('Please start the challenge first!', 'error');
            return;
        }
        
        // Reset challenge state
        this.placedDevices = [];
        this.connections = [];
        this.completionScore = 0;
        
        // Clear visual elements
        const challengeContent = document.getElementById('challenge-content');
        if (challengeContent) {
            const canvas = challengeContent.querySelector('.network-canvas, #network-canvas');
            if (canvas) {
                canvas.innerHTML = '<div class="absolute top-2 left-2 text-gray-400 text-sm">Drop devices here and connect with cables</div>';
            }
        }
        
        this.updateProgress();
        this.showMessage('Challenge reset successfully!', 'success');
    }

    testConnectivity() {
        if (!this.isActive) {
            this.showMessage('Please start the challenge first to test connectivity!', 'error');
            return;
        }
        
        this.showMessage('Testing network connectivity...', 'info');
        // Add actual connectivity testing logic here
    }

    showHint() {
        if (!this.isActive) {
            this.showMessage('Please start the challenge first to get hints!', 'error');
            return;
        }
        
        const hint = this.currentLevelData.hint;
        this.showMessage(hint, 'info');
    }

    completeLevel() {
        if (!this.isActive) {
            this.showMessage('Please start the challenge first!', 'error');
            return;
        }
        
        // Check if level is actually complete
        const isComplete = this.checkLevelCompletion();
        if (isComplete) {
            this.showLevelCompletionFeedback();
        } else {
            this.showMessage('Level not yet complete! Check the requirements.', 'error');
        }
    }

    checkLevelCompletion() {
        // Add completion checking logic based on current level
        const requiredDevices = this.currentLevelData.requiredDevices || [];
        const requiredConnections = this.currentLevelData.requiredConnections || 0;
        
        // Check device requirements
        for (const req of requiredDevices) {
            const placedCount = this.placedDevices.filter(d => d.type === req.type).length;
            if (placedCount < req.count) {
                return false;
            }
        }
        
        // Check connection requirements
        if (this.connections.length < requiredConnections) {
            return false;
        }
        
        return true;
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-20 right-4 p-3 rounded z-50 animate-pulse max-w-sm`;
        
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
            default:
                messageDiv.classList.add('bg-gray-800', 'text-gray-200', 'border', 'border-gray-500');
        }
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }    showLevelCompletionFeedback() {
        this.showMessage(`${this.currentLevelData.name} completed successfully!`, 'success');
        
        // Move to next level or complete room
        if (this.currentLevel < this.maxLevels) {
            setTimeout(() => {
                this.currentLevel++;
                this.loadCurrentLevel();
                this.isActive = false; // Require start button for next level
                
                // Reset start button
                const startBtn = document.getElementById('start-challenge');
                if (startBtn) {
                    startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start Network Build';
                    startBtn.disabled = false;
                    startBtn.classList.remove('bg-green-700');
                    startBtn.classList.add('bg-blue-600');
                }
                
                // Reset complete level button
                const completeBtn = document.getElementById('complete-level');
                if (completeBtn) {
                    completeBtn.disabled = true;
                    completeBtn.classList.remove('bg-green-600');
                    completeBtn.classList.add('bg-gray-600');
                }
                
                // Re-render the page with new level content
                this.render();
                
                this.showMessage(`Level ${this.currentLevel} unlocked!`, 'info');
            }, 2000);
        } else {
            // All levels completed
            setTimeout(() => {
                this.game.roomCompleted(`Network Nexus mastered! Completed all ${this.maxLevels} networking levels with ${Math.round(this.completionScore)}% efficiency.`);
            }, 2000);
        }
    }

    updateProgress() {
        // Update UI elements to show current progress
        const levelProgress = document.getElementById('level-progress');
        if (levelProgress) {
            const progress = Math.round((this.completionScore / 100) * 100);
            levelProgress.textContent = `${progress}%`;
        }
        
        const deviceCount = document.getElementById('device-count');
        if (deviceCount) {
            deviceCount.textContent = this.placedDevices.length;
        }
        
        const connectionCount = document.getElementById('connection-count');
        if (connectionCount) {
            connectionCount.textContent = this.connections.length;
        }
    }

    enableCompleteButton() {
        const completeBtn = document.getElementById('complete-level');
        if (completeBtn) {
            completeBtn.disabled = false;
            completeBtn.classList.remove('bg-gray-600');
            completeBtn.classList.add('bg-green-600');
        }
    }

    showFeedback(message, type) {
        const feedbackElements = [
            'topology-feedback',
            'ip-feedback', 
            'switch-feedback',
            'routing-feedback',
            'cli-feedback'
        ];
        
        feedbackElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `<div class="p-3 rounded ${type === 'success' ? 'bg-green-800 text-green-200' : type === 'error' ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'}">${message}</div>`;
            }
        });
    }
}

// Register globally and export
window.Room2 = Room2;
export { Room2 };

