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
    }

    async init() {
        console.log('Room 2 (Network Nexus) initializing...');
        this.loadCurrentLevel();
        this.render();
        this.setupEventListeners();
    }

    loadCurrentLevel() {
        // Get current level from progress tracker if available
        if (window.progressTracker && window.progressTracker.currentRoom === 2) {
            const suggestedLevel = window.progressTracker.currentLevel;
            if (suggestedLevel >= 1 && suggestedLevel <= this.maxLevels) {
                this.currentLevel = suggestedLevel;
            }
        }

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
                        <div class="control-buttons flex gap-2">
                            <button id="start-challenge" class="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm transition-colors">
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
            </div>
        `;

        this.setupEventListeners();
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
                                    <div class="text-2xl mb-1"><img src="static/img/pc.png" id="pc-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"></div>
                                    <div class="text-sm font-bold">PC</div>
                                    <div class="text-xs">End Device</div>
                                </div>
                            </div>
                            <div class="device-option bg-green-600 p-3 rounded cursor-pointer hover:bg-green-500" 
                                 data-device="router" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1"><img src="static/img/router.png" id="router-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"></div>
                                    <div class="text-sm font-bold">Router</div>
                                    <div class="text-xs">Layer 3</div>
                                </div>
                            </div>
                            <div class="device-option bg-purple-600 p-3 rounded cursor-pointer hover:bg-purple-500" 
                                 data-device="switch" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1"><img src="static/img/switch.png" id="switch-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"></div>
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
                    <h5 class="text-white font-bold mb-2">🌐 Network Status</h5>
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
                                <h6 class="text-blue-200 font-bold mb-2"><img src="static/img/pc.png" id="pc-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"> PC1 Configuration</h6>
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
                                <h6 class="text-blue-200 font-bold mb-2"><img src="static/img/pc.png" id="pc-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"> PC2 Configuration</h6>
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
                                <h6 class="text-green-200 font-bold mb-2"><img src="static/img/router.png" id="router-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"> Router Configuration</h6>
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
                                    <div class="device-icon bg-blue-600 p-2 rounded"><img src="static/img/pc.png" id="pc-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"> PC1</div>
                                    <div>━━━</div>
                                    <div class="device-icon bg-green-600 p-2 rounded"><img src="static/img/router.png" id="router-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"> Router</div>
                                    <div>━━━</div>
                                    <div class="device-icon bg-blue-600 p-2 rounded"><img src="static/img/pc.png" id="pc-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"> PC2</div>
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
                                    <div class="text-2xl mb-1"><img src="static/img/pc.png" id="pc-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"></div>
                                    <div class="text-sm font-bold">PC</div>
                                    <div class="text-xs">Police Terminal</div>
                                </div>
                            </div>
                            <div class="device-option bg-purple-600 p-3 rounded cursor-pointer hover:bg-purple-500" 
                                 data-device="switch" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1"><img src="static/img/switch.png" id="switch-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"></div>
                                    <div class="text-sm font-bold">Switch</div>
                                    <div class="text-xs">Layer 2 Device</div>
                                </div>
                            </div>
                            <div class="device-option bg-green-600 p-3 rounded cursor-pointer hover:bg-green-500" 
                                 data-device="router" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1"><img src="static/img/router.png" id="router-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"></div>
                                    <div class="text-sm font-bold">Router</div>
                                    <div class="text-xs">Gateway</div>
                                </div>
                            </div>
                            <div class="device-option bg-orange-600 p-3 rounded cursor-pointer hover:bg-orange-500" 
                                 data-device="cctv" draggable="true">
                                <div class="text-center">
                                    <div class="text-2xl mb-1"><img src="static/img/cctv.png" id="cctv-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"></div>
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
                                    <div class="bg-green-600 p-2 rounded mt-2 text-xs"><img src="static/img/router.png" id="router-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"> Router R1</div>
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
                                    <div class="bg-green-600 p-2 rounded mt-2 text-xs"><img src="static/img/router.png" id="router-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;"> Router R2</div>
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
    }

    setupTopologyListeners() {
        // Set up drag and drop for devices
        const deviceOptions = document.querySelectorAll('.device-option');
        const networkCanvas = document.getElementById('network-canvas');

        deviceOptions.forEach(option => {
            option.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', option.dataset.device);
            });
        });

        if (networkCanvas) {
            networkCanvas.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            networkCanvas.addEventListener('drop', (e) => {
                e.preventDefault();
                const deviceType = e.dataTransfer.getData('text/plain');
                const rect = networkCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.placeDevice(deviceType, x, y);
            });

            // Click to connect devices
            networkCanvas.addEventListener('click', (e) => {
                if (this.selectedCable) {
                    this.handleDeviceConnection(e);
                }
            });
        }

        // Cable selection
        const cableOption = document.querySelector('.cable-option');
        if (cableOption) {
            cableOption.addEventListener('click', () => {
                this.selectedCable = cableOption.dataset.cable;
                cableOption.classList.add('ring-2', 'ring-yellow-400');
                this.showMessage('Cable selected! Click two devices to connect them.', 'info');
            });
        }
    }

    placeDevice(deviceType, x, y) {
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
            'pc': { icon: '<img src="static/img/pc.png" id="pc-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;">', color: '#3b82f6' },
            'router': { icon: '<img src="static/img/router.png" id="router-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;">', color: '#10b981' },
            'switch': { icon: '<img src="static/img/switch.png" id="switch-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;">', color: '#8b5cf6' }
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
    }

    handleDeviceConnection(e) {
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
    }

    setupIPAssignmentListeners() {
        // Apply configuration buttons
        document.querySelectorAll('.apply-config').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const deviceId = e.target.dataset.device;
                this.applyDeviceConfig(deviceId);
            });
        });

        // Ping test button
        document.getElementById('execute-ping')?.addEventListener('click', () => {
            this.executePing();
        });
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
        this.isActive = true;
        const startBtn = document.getElementById('start-challenge');
        if (startBtn) {
            startBtn.textContent = '🌐 Network Building Active';
            startBtn.classList.add('animate-pulse');
        }
        this.showMessage(`${this.currentLevelData.character} says: "Let's build this network!"`, 'info');
    }

    resetChallenge() {
        this.placedDevices = [];
        this.connections = [];
        this.completionScore = 0;
        this.networkDevices.clear();
        this.connectionStart = null;
        this.selectedCable = null;
        
        // Clear canvas
        const canvas = document.getElementById('network-canvas');
        if (canvas) {
            canvas.querySelectorAll('.network-device').forEach(el => el.remove());
            const svg = document.getElementById('connection-svg');
            if (svg) svg.innerHTML = '';
        }
        
        this.updateNetworkStatus();
        this.showMessage('Network reset successfully', 'info');
    }

    testConnectivity() {
        // Implement connectivity testing based on current level
        switch(this.currentLevelData.taskType) {
            case 'topology-builder':
                this.checkTopologyCompletion();
                break;
            case 'ip-assignment':
                if (this.networkDevices.size > 0) {
                    this.checkIPAssignmentCompletion();
                } else {
                    this.showMessage('Configure device IPs first', 'info');
                }
                break;
            default:
                this.showMessage('Connectivity test completed', 'info');
        }
    }

    showHint() {
        const hints = [
            this.currentLevelData.hint,
            `${this.currentLevelData.character} suggests: Follow the step-by-step instructions carefully`,
            "Remember: Physical connections come first, then logical configuration",
            "Check that all required devices are placed and connected properly",
            "Use the toolkit on the left to add devices to your network"
        ];
        
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        this.showMessage(randomHint, 'info');
    }

    updateProgress() {
        const progressElement = document.getElementById('level-progress');
        if (progressElement) {
            progressElement.textContent = `${Math.round(this.completionScore)}%`;
        }
    }

    enableCompleteButton() {
        const completeBtn = document.getElementById('complete-level');
        if (completeBtn) {
            completeBtn.disabled = false;
            completeBtn.classList.add('animate-pulse');
        }
    }

    completeLevel() {
        if (this.completionScore < 100) {
            this.showMessage('Complete all network tasks before advancing!', 'error');
            return;
        }

        this.showLevelCompletionFeedback();

        // Mark level as completed in progress tracker
        if (window.progressTracker) {
            window.progressTracker.markLevelCompleted(2, this.currentLevel, {
                score: this.completionScore,
                timeSpent: Date.now() - this.levelStartTime,
                attempts: this.sessionData?.attempts || 1
            });
        }

        if (this.currentLevel >= this.maxLevels) {
            setTimeout(() => {
                this.game.roomCompleted(`Network Nexus mastered! All ${this.maxLevels} networking challenges completed with expertise in topology, IP addressing, switching, routing, and CLI operations.`, {
                    score: this.completionScore,
                    levelsCompleted: this.maxLevels,
                    roomId: 2
                });
            }, 2000);
            return;
        }

        const nextLevel = this.currentLevel + 1;
        this.showMessage(`Level ${this.currentLevel} completed! Advancing to Level ${nextLevel}...`, 'success');
        
        // Update progress tracker
        if (window.progressTracker) {
            window.progressTracker.setCurrentLevel(nextLevel);
        }
        
        setTimeout(() => {
            this.currentLevel = nextLevel;
            this.loadCurrentLevel();
            this.render();
        }, 2000);
    }

    showLevelCompletionFeedback() {
        const completionMessages = {
            1: `🎯 Topology Built! ${this.currentLevelData.character} says: "Great work! The physical network is properly connected."`,
            2: `🌐 IPs Configured! ${this.currentLevelData.character} says: "Perfect! All devices can now communicate on the network."`,
            3: `⚡ Switch Optimized! ${this.currentLevelData.character} says: "Excellent! Local traffic is now much more efficient."`,
            4: `🔀 Routing Configured! ${this.currentLevelData.character} says: "Outstanding! Cross-network communication is working perfectly."`,
            5: `💻 CLI Mastered! ${this.currentLevelData.character} says: "Brilliant! You've mastered network troubleshooting and configuration."`
        };

        const message = completionMessages[this.currentLevel] || `Level ${this.currentLevel} completed successfully!`;
        this.showFeedback(message, 'success');
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
        }
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 3000);
    }

    showFeedback(message, type) {
        const feedbackSelectors = ['#topology-feedback', '#ip-feedback', '#switch-feedback', '#routing-feedback', '#cli-feedback'];
        
        feedbackSelectors.forEach(selector => {
            const feedbackDiv = document.querySelector(selector);
            if (feedbackDiv) {
                feedbackDiv.innerHTML = `<div class="p-3 rounded ${type === 'success' ? 'bg-green-800 text-green-200' : 'bg-blue-800 text-blue-200'}">${message}</div>`;
            }
        });
    }    cleanup() {
        this.isActive = false;
        this.placedDevices = [];
        this.connections = [];
        this.networkDevices.clear();
        console.log('Room 2 (Network Nexus) cleaned up');
    }

    setupSwitchOptimizationListeners() {
        // Set up drag and drop for switch optimization level
        const deviceOptions = document.querySelectorAll('.device-option');
        const networkCanvas = document.getElementById('switch-network-canvas');

        if (!networkCanvas) {
            console.error('Switch network canvas not found');
            return;
        }

        // Initialize switch optimization specific state
        this.switchDevices = [];
        this.switchConnections = [];
        this.deviceIdCounter = 1;

        deviceOptions.forEach(option => {
            option.addEventListener('dragstart', (e) => {
                const deviceType = option.dataset.device;
                e.dataTransfer.setData('text/plain', deviceType);
                option.style.opacity = '0.5';
                console.log(`Drag started: ${deviceType}`);
            });

            option.addEventListener('dragend', (e) => {
                option.style.opacity = '1';
            });
        });

        networkCanvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            networkCanvas.style.backgroundColor = 'rgba(75, 85, 99, 0.5)';
        });

        networkCanvas.addEventListener('dragleave', (e) => {
            networkCanvas.style.backgroundColor = '';
        });

        networkCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            networkCanvas.style.backgroundColor = '';
            
            const deviceType = e.dataTransfer.getData('text/plain');
            const rect = networkCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            console.log(`Dropping ${deviceType} at (${x}, ${y})`);
            this.placeSwitchDevice(deviceType, x, y);
        });

        // Set up cable selection for switch level
        const cableOption = document.querySelector('.cable-option');
        if (cableOption) {
            cableOption.addEventListener('click', () => {
                this.selectedCable = cableOption.dataset.cable;
                cableOption.classList.add('ring-2', 'ring-yellow-400');
                this.showMessage('Cable selected! Click two devices to connect them.', 'info');
            });
        }

        // Handle device connections
        networkCanvas.addEventListener('click', (e) => {
            if (this.selectedCable) {
                this.handleSwitchDeviceConnection(e);
            }
        });
    }

    placeSwitchDevice(deviceType, x, y) {
        const deviceId = `${deviceType}_${this.deviceIdCounter++}`;
        const device = {
            id: deviceId,
            type: deviceType,
            x: x,
            y: y,
            connections: [],
            config: {}
        };

        this.switchDevices.push(device);
        this.createSwitchDeviceElement(device);
        this.updateSwitchMetrics();
        this.checkSwitchOptimizationCompletion();
        
        this.showMessage(`${deviceType.toUpperCase()} placed successfully`, 'success');
    }

    createSwitchDeviceElement(device) {
        const networkCanvas = document.getElementById('switch-network-canvas');
        const element = document.createElement('div');
        element.className = 'network-device absolute cursor-pointer transition-all duration-200 hover:scale-110';
        element.style.left = `${device.x - 30}px`;
        element.style.top = `${device.y - 30}px`;
        element.style.width = '60px';
        element.style.height = '60px';
        element.style.zIndex = '10';
        element.setAttribute('data-device-id', device.id);

        const deviceIcons = {
            'pc': { icon: '<img src="static/img/pc.png" id="pc-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;">', color: '#3b82f6', name: 'PC' },
            'router': { icon: '<img src="static/img/router.png" id="router-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;">', color: '#10b981', name: 'Router' },
            'switch': { icon: '<img src="static/img/switch.png" id="switch-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;">', color: '#8b5cf6', name: 'Switch' },
            'cctv': { icon: '<img src="static/img/cctv.png" id="cctv-icon" style="width: 40px; height: 40px; margin-right: auto; margin-left: auto;">', color: '#f59e0b', name: 'CCTV' }
        };

        const deviceInfo = deviceIcons[device.type] || deviceIcons['pc'];
        
        element.innerHTML = `
            <div class="device-visual bg-gray-800 border-2 rounded-lg p-2 text-center hover:bg-gray-700" 
                 style="border-color: ${deviceInfo.color}; background: linear-gradient(45deg, #1f2937, ${deviceInfo.color}20);">
                <div style="font-size: 28px;">${deviceInfo.icon}</div>
                <div style="font-size: 9px; color: white; margin-top: 2px; font-weight: bold;">${deviceInfo.name}</div>
                <div style="font-size: 7px; color: #9ca3af;">${device.id}</div>
            </div>
        `;

        networkCanvas.appendChild(element);
        device.element = element;
    }

    handleSwitchDeviceConnection(e) {
        const target = e.target.closest('.network-device');
        if (!target) return;

        const deviceId = target.getAttribute('data-device-id');
        
        if (!this.connectionStart) {
            this.connectionStart = deviceId;
            target.classList.add('ring-4', 'ring-yellow-400');
            this.showMessage('First device selected. Click another device to connect.', 'info');
        } else if (this.connectionStart !== deviceId) {
            this.createSwitchConnection(this.connectionStart, deviceId);
            document.querySelector(`[data-device-id="${this.connectionStart}"]`).classList.remove('ring-4', 'ring-yellow-400');
            this.connectionStart = null;
            this.selectedCable = null;
            document.querySelector('.cable-option').classList.remove('ring-2', 'ring-yellow-400');
        }
    }

    createSwitchConnection(fromId, toId) {
        // Check if connection already exists
        const existingConnection = this.switchConnections.find(conn => 
            (conn.from === fromId && conn.to === toId) || 
            (conn.from === toId && conn.to === fromId)
        );

        if (existingConnection) {
            this.showMessage('Devices are already connected!', 'info');
            return;
        }

        const connection = {
            id: `conn_${this.switchConnections.length + 1}`,
            from: fromId,
            to: toId,
            type: this.selectedCable || 'ethernet'
        };

        this.switchConnections.push(connection);
        this.drawSwitchConnection(connection);
        this.updateSwitchMetrics();
        this.checkSwitchOptimizationCompletion();
        
        const fromDevice = this.switchDevices.find(d => d.id === fromId);
        const toDevice = this.switchDevices.find(d => d.id === toId);
        this.showMessage(`Connected ${fromDevice?.type || fromId} to ${toDevice?.type || toId}`, 'success');
    }

    drawSwitchConnection(connection) {
        const svg = document.getElementById('switch-connection-svg');
        const fromDevice = this.switchDevices.find(d => d.id === connection.from);
        const toDevice = this.switchDevices.find(d => d.id === connection.to);

        if (!fromDevice || !toDevice || !svg) return;

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

    updateSwitchMetrics() {
        const deviceCount = this.switchDevices.length;
        const connectionCount = this.switchConnections.length;
        
        // Calculate network latency (simulated)
        const latency = this.calculateNetworkLatency();
        document.getElementById('network-latency').textContent = `${latency}ms`;
        
        // Calculate switch efficiency
        const efficiency = this.calculateSwitchEfficiency();
        document.getElementById('switch-efficiency').textContent = `${efficiency}%`;
        
        // Calculate topology score
        const topologyScore = this.calculateTopologyScore();
        document.getElementById('topology-score').textContent = `${topologyScore}/100`;
        
        // Update progress
        this.completionScore = topologyScore;
        this.updateProgress();
    }

    calculateNetworkLatency() {
        const switches = this.switchDevices.filter(d => d.type === 'switch');
        const pcs = this.switchDevices.filter(d => d.type === 'pc' || d.type === 'cctv');
        
        if (switches.length > 0 && pcs.length > 1) {
            // With switch: lower latency
            return Math.round(1.2 + Math.random() * 0.8);
        } else {
            // Without switch: higher latency
            return Math.round(8.5 + Math.random() * 3.5);
        }
    }

    calculateSwitchEfficiency() {
        const switches = this.switchDevices.filter(d => d.type === 'switch');
        const pcs = this.switchDevices.filter(d => d.type === 'pc' || d.type === 'cctv');
        
        if (switches.length === 0) return 0;
        
        // Check if PCs are connected to switch
        const pcToSwitchConnections = this.switchConnections.filter(conn => {
            const fromDevice = this.switchDevices.find(d => d.id === conn.from);
            const toDevice = this.switchDevices.find(d => d.id === conn.to);
            
            return (fromDevice?.type === 'switch' && (toDevice?.type === 'pc' || toDevice?.type === 'cctv')) ||
                   ((fromDevice?.type === 'pc' || fromDevice?.type === 'cctv') && toDevice?.type === 'switch');
        });
        
        const efficiency = Math.min(100, (pcToSwitchConnections.length / Math.max(pcs.length, 1)) * 100);
        return Math.round(efficiency);
    }

    calculateTopologyScore() {
        const required = this.currentLevelData.requiredDevices || [];
        const switches = this.switchDevices.filter(d => d.type === 'switch');
        const pcs = this.switchDevices.filter(d => d.type === 'pc');
        const routers = this.switchDevices.filter(d => d.type === 'router');
        
        let score = 0;
        
        // Check required devices are placed
        if (switches.length >= 1) score += 25;
        if (pcs.length >= 2) score += 25;
        if (routers.length >= 1) score += 25;
        
        // Check optimal connections (PCs to switch, switch to router)
        const pcToSwitchConnections = this.switchConnections.filter(conn => {
            const fromDevice = this.switchDevices.find(d => d.id === conn.from);
            const toDevice = this.switchDevices.find(d => d.id === conn.to);
            
            return (fromDevice?.type === 'switch' && (toDevice?.type === 'pc' || toDevice?.type === 'cctv')) ||
                   ((fromDevice?.type === 'pc' || fromDevice?.type === 'cctv') && toDevice?.type === 'switch');
        });
        
        const switchToRouterConnections = this.switchConnections.filter(conn => {
            const fromDevice = this.switchDevices.find(d => d.id === conn.from);
            const toDevice = this.switchDevices.find(d => d.id === conn.to);
            
            return (fromDevice?.type === 'switch' && toDevice?.type === 'router') ||
                   (fromDevice?.type === 'router' && toDevice?.type === 'switch');
        });
        
        if (pcToSwitchConnections.length >= 2) score += 15;
        if (switchToRouterConnections.length >= 1) score += 10;
        
        return Math.min(100, score);
    }

    checkSwitchOptimizationCompletion() {
        const topologyScore = this.calculateTopologyScore();
        
        if (topologyScore >= 100) {
            this.completionScore = 100;
            this.enableCompleteButton();
            this.showFeedback('Perfect! Switch optimization complete. Local traffic is now efficiently handled!', 'success');
        } else if (topologyScore >= 75) {
            this.showFeedback('Good progress! Add more connections to optimize the network further.', 'info');
        } else {
            this.showFeedback('Keep building! You need a switch connected between PCs and router.', 'info');
        }
        
        this.updateProgress();
    }

    setupStaticRoutingListeners() {
        // Initialize routing state if not already done
        this.routingTables = this.routingTables || new Map();
        this.routingTables.set('R1', []);
        this.routingTables.set('R2', []);

        // Add route to R1 button
        const addR1RouteBtn = document.getElementById('add-r1-route');
        if (addR1RouteBtn) {
            addR1RouteBtn.addEventListener('click', () => {
                this.addStaticRoute('R1');
            });
        }

        // Add route to R2 button
        const addR2RouteBtn = document.getElementById('add-r2-route');
        if (addR2RouteBtn) {
            addR2RouteBtn.addEventListener('click', () => {
                this.addStaticRoute('R2');
            });
        }

        // Test connectivity buttons
        const testEastToWestBtn = document.getElementById('test-east-to-west');
        const testWestToEastBtn = document.getElementById('test-west-to-east');

        if (testEastToWestBtn) {
            testEastToWestBtn.addEventListener('click', () => {
                this.testInterDistrictConnectivity('east-to-west');
            });
        }

        if (testWestToEastBtn) {
            testWestToEastBtn.addEventListener('click', () => {
                this.testInterDistrictConnectivity('west-to-east');
            });
        }

        console.log('Static routing listeners set up successfully');
    }

    addStaticRoute(routerName) {
        const destinationInput = document.getElementById(`${routerName.toLowerCase()}-destination`);
        const gatewayInput = document.getElementById(`${routerName.toLowerCase()}-gateway`);

        if (!destinationInput || !gatewayInput) {
            this.showMessage('Input fields not found', 'error');
            return;
        }

        const destination = destinationInput.value.trim();
        const gateway = gatewayInput.value.trim();

        if (!destination || !gateway) {
            this.showMessage('Please enter both destination network and next hop gateway', 'error');
            return;
        }

        // Validate the input format
        if (!this.validateNetworkInput(destination, gateway, routerName)) {
            return;
        }

        // Add route to routing table
        const routes = this.routingTables.get(routerName) || [];
        
        // Check if route already exists
        const existingRoute = routes.find(route => route.destination === destination);
        if (existingRoute) {
            this.showMessage(`Route to ${destination} already exists on ${routerName}`, 'info');
            return;
        }

        const newRoute = {
            destination: destination,
            gateway: gateway,
            metric: 1
        };

        routes.push(newRoute);
        this.routingTables.set(routerName, routes);

        // Clear input fields
        destinationInput.value = '';
        gatewayInput.value = '';

        // Update routing table display
        this.updateRoutingTableDisplay();
        
        // Check completion
        this.checkStaticRoutingCompletion();

        this.showMessage(`Route added to ${routerName}: ${destination} via ${gateway}`, 'success');
    }

    validateNetworkInput(destination, gateway, routerName) {
        // Expected values for validation
        const expectedRoutes = {
            'R1': {
                destination: '192.168.2.0/24',
                gateway: '192.168.100.2'
            },
            'R2': {
                destination: '192.168.1.0/24',
                gateway: '192.168.100.1'
            }
        };

        const expected = expectedRoutes[routerName];
        
        // Improved validation for destination network format
        const networkPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
        const networkMatch = destination.match(networkPattern);
        
        if (!networkMatch) {
            this.showMessage('Invalid destination network format. Use format: 192.168.x.0/24', 'error');
            return false;
        }

        // Validate each octet is within valid range (0-255)
        const octets = [
            parseInt(networkMatch[1]),
            parseInt(networkMatch[2]),
            parseInt(networkMatch[3]),
            parseInt(networkMatch[4])
        ];
        const subnet = parseInt(networkMatch[5]);

        // Check if octets are valid (0-255)
        if (!octets.every(octet => octet >= 0 && octet <= 255)) {
            this.showMessage('Invalid IP address in network. Each part must be 0-255.', 'error');
            return false;
        }

        // Check if subnet mask is valid (0-32)
        if (subnet < 0 || subnet > 32) {
            this.showMessage('Invalid subnet mask. Must be between /0 and /32.', 'error');
            return false;
        }

        // Validate gateway IP format (improved validation)
        const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const gatewayMatch = gateway.match(ipPattern);
        
        if (!gatewayMatch) {
            this.showMessage('Invalid gateway IP address format', 'error');
            return false;
        }

        // Validate gateway IP octets
        const gatewayOctets = [
            parseInt(gatewayMatch[1]),
            parseInt(gatewayMatch[2]),
            parseInt(gatewayMatch[3]),
            parseInt(gatewayMatch[4])
        ];

        if (!gatewayOctets.every(octet => octet >= 0 && octet <= 255)) {
            this.showMessage('Invalid gateway IP address. Each part must be 0-255.', 'error');
            return false;
        }

        // Provide helpful feedback if not the expected route (but still allow it)
        if (destination !== expected.destination) {
            this.showMessage(`Hint: ${routerName} needs a route to ${expected.destination}`, 'info');
        }

        if (gateway !== expected.gateway) {
            this.showMessage(`Hint: Next hop for ${routerName} should be ${expected.gateway}`, 'info');
        }

        return true;
    }

    updateRoutingTableDisplay() {
        // Update R1 routing table display
        const r1Routes = this.routingTables.get('R1') || [];
        const r1Display = document.getElementById('r1-routes');
        if (r1Display) {
            if (r1Routes.length === 0) {
                r1Display.textContent = 'No static routes configured';
                r1Display.className = 'text-sm text-gray-300';
            } else {
                r1Display.innerHTML = r1Routes.map(route => 
                    `<div class="text-green-400 text-sm">→ ${route.destination} via ${route.gateway}</div>`
                ).join('');
            }
        }

        // Update R2 routing table display
        const r2Routes = this.routingTables.get('R2') || [];
        const r2Display = document.getElementById('r2-routes');
        if (r2Display) {
            if (r2Routes.length === 0) {
                r2Display.textContent = 'No static routes configured';
                r2Display.className = 'text-sm text-gray-300';
            } else {
                r2Display.innerHTML = r2Routes.map(route => 
                    `<div class="text-green-400 text-sm">→ ${route.destination} via ${route.gateway}</div>`
                ).join('');
            }
        }
    }

    testInterDistrictConnectivity(direction) {
        const resultsDiv = document.getElementById('routing-test-results');
        if (!resultsDiv) return;

        const r1Routes = this.routingTables.get('R1') || [];
        const r2Routes = this.routingTables.get('R2') || [];

        let testSuccess = false;
        let testMessage = '';

        if (direction === 'east-to-west') {
            // Test Police HQ (192.168.1.10) to Fire Station (192.168.2.10)
            const r1HasRoute = r1Routes.some(route => 
                route.destination === '192.168.2.0/24' && route.gateway === '192.168.100.2'
            );
            
            if (r1HasRoute) {
                testSuccess = true;
                testMessage = `
                    PING 192.168.2.10 from 192.168.1.10<br>
                    <span class="text-green-400">64 bytes from 192.168.2.10: icmp_seq=1 ttl=62 time=2.1 ms<br>
                    64 bytes from 192.168.2.10: icmp_seq=2 ttl=62 time=2.3 ms<br>
                    64 bytes from 192.168.2.10: icmp_seq=3 ttl=62 time=2.0 ms<br>
                    --- Police HQ to Fire Station connectivity: SUCCESS ---</span>
                `;
            } else {
                testMessage = `
                    PING 192.168.2.10 from 192.168.1.10<br>
                    <span class="text-red-400">Request timeout for icmp_seq 1<br>
                    Request timeout for icmp_seq 2<br>
                    Request timeout for icmp_seq 3<br>
                    --- Police HQ to Fire Station connectivity: FAILED ---<br>
                    Router R1 missing route to 192.168.2.0/24</span>
                `;
            }
        } else {
            // Test School (192.168.2.11) to Hospital (192.168.1.11)
            const r2HasRoute = r2Routes.some(route => 
                route.destination === '192.168.1.0/24' && route.gateway === '192.168.100.1'
            );
            
            if (r2HasRoute) {
                testSuccess = true;
                testMessage = `
                    PING 192.168.1.11 from 192.168.2.11<br>
                    <span class="text-green-400">64 bytes from 192.168.1.11: icmp_seq=1 ttl=62 time=2.4 ms<br>
                    64 bytes from 192.168.1.11: icmp_seq=2 ttl=62 time=2.1 ms<br>
                    64 bytes from 192.168.1.11: icmp_seq=3 ttl=62 time=2.3 ms<br>
                    --- School to Hospital connectivity: SUCCESS ---</span>
                `;
            } else {
                testMessage = `
                    PING 192.168.1.11 from 192.168.2.11<br>
                    <span class="text-red-400">Request timeout for icmp_seq 1<br>
                    Request timeout for icmp_seq 2<br>
                    Request timeout for icmp_seq 3<br>
                    --- School to Hospital connectivity: FAILED ---<br>
                    Router R2 missing route to 192.168.1.0/24</span>
                `;
            }
        }

        resultsDiv.innerHTML = testMessage;
        
        if (testSuccess) {
            this.showMessage('Inter-district communication test successful!', 'success');
        } else {
            this.showMessage('Communication test failed - check routing configuration', 'error');
        }

        this.checkStaticRoutingCompletion();
    }

    checkStaticRoutingCompletion() {
        const r1Routes = this.routingTables.get('R1') || [];
        const r2Routes = this.routingTables.get('R2') || [];

        // Check if both required routes are configured
        const r1HasCorrectRoute = r1Routes.some(route => 
            route.destination === '192.168.2.0/24' && route.gateway === '192.168.100.2'
        );
        
        const r2HasCorrectRoute = r2Routes.some(route => 
            route.destination === '192.168.1.0/24' && route.gateway === '192.168.100.1'
        );

        if (r1HasCorrectRoute && r2HasCorrectRoute) {
            this.completionScore = 100;
            this.enableCompleteButton();
            this.showFeedback('Perfect! Static routes configured on both routers. Inter-district communication is now possible!', 'success');
        } else {
            let progress = 0;
            if (r1HasCorrectRoute) progress += 50;
            if (r2HasCorrectRoute) progress += 50;
            
            this.completionScore = progress;
            
            if (progress > 0) {
                this.showFeedback(`Good progress! ${progress}% complete. Configure routes on both routers.`, 'info');
            } else {
                this.showFeedback('Configure static routes on both R1 and R2 routers to enable cross-district communication.', 'info');
            }
        }

        this.updateProgress();
    }

    setupCLITroubleshootingListeners() {
        // Initialize CLI state
        this.cliHistory = [];
        this.issuesFixed = {
            diagnosis: false,
            routes: false,
            connectivity: false
        };
        
        this.cliCommands = {
            'help': () => this.showCLIHelp(),
            'show ip route': () => this.showIPRoute(),
            'ping 192.168.2.10': () => this.pingCommand('192.168.2.10'),
            'traceroute 192.168.2.10': () => this.tracerouteCommand('192.168.2.10'),
            'ip route add 192.168.2.0/24 via 192.168.100.2': () => this.addCLIRoute(),
            'clear': () => this.clearTerminal(),
            'exit': () => this.exitCLI(),
            'show interfaces': () => this.showInterfaces(),
            'show version': () => this.showVersion()
        };

        // CLI input handling
        const cliInput = document.getElementById('cli-input');
        if (cliInput) {
            cliInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const command = cliInput.value.trim();
                    if (command) {
                        this.executeCLICommand(command);
                        this.cliHistory.push(command);
                    }
                    cliInput.value = '';
                }
            });

            // Command history navigation
            let historyIndex = -1;
            cliInput.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (historyIndex < this.cliHistory.length - 1) {
                        historyIndex++;
                        cliInput.value = this.cliHistory[this.cliHistory.length - 1 - historyIndex];
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (historyIndex > 0) {
                        historyIndex--;
                        cliInput.value = this.cliHistory[this.cliHistory.length - 1 - historyIndex];
                    } else if (historyIndex === 0) {
                        historyIndex = -1;
                        cliInput.value = '';
                    }
                }
            });
        }

        // Quick command buttons
        document.querySelectorAll('.quick-cmd').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.cmd;
                this.executeCLICommand(command);
                if (cliInput) cliInput.focus();
            });
        });

        // Diagnostic tool buttons
        document.getElementById('run-connectivity-test')?.addEventListener('click', () => {
            this.executeCLICommand('ping 192.168.2.10');
        });

        document.getElementById('check-routing-table')?.addEventListener('click', () => {
            this.executeCLICommand('show ip route');
        });

        document.getElementById('analyze-network')?.addEventListener('click', () => {
            this.executeCLICommand('show interfaces');
            setTimeout(() => this.executeCLICommand('show ip route'), 1000);
        });

        console.log('CLI troubleshooting listeners set up successfully');
    }

    executeCLICommand(command) {
        const output = document.getElementById('terminal-output');
        if (!output) return;
        
        // Add command to output with timestamp
        const timestamp = new Date().toLocaleTimeString();
        output.innerHTML += `<span class="text-blue-300">R1> ${command}</span><br>`;
        
        // Execute command
        let result = '';
        if (this.cliCommands[command]) {
            result = this.cliCommands[command]();
        } else if (command.startsWith('ping ')) {
            const ip = command.split(' ')[1];
            result = this.pingCommand(ip);
        } else if (command.startsWith('traceroute ')) {
            const ip = command.split(' ')[1];
            result = this.tracerouteCommand(ip);
        } else if (command.startsWith('ip route add ')) {
            result = this.handleRouteAdd(command);
        } else {
            result = `<span class="text-red-400">% Unknown command: ${command}</span><br>Type 'help' for available commands`;
        }
        
        output.innerHTML += result + '<br>';
        
        // Scroll to bottom
        output.scrollTop = output.scrollHeight;
        
        // Update progress
        this.updateCLIProgress();
        this.checkCLICompletion();
    }

    showCLIHelp() {
        return `<span class="text-yellow-400">Available commands:</span>
  show ip route       - Display routing table
  ping [IP]          - Test connectivity to IP address  
  traceroute [IP]    - Trace route to destination
  ip route add [route] - Add static route
  show interfaces    - Display interface status
  show version       - Show router information
  clear             - Clear terminal screen
  help              - Show this help message
  exit              - Exit CLI session

<span class="text-cyan-400">Example:</span>
  ip route add 192.168.2.0/24 via 192.168.100.2`;
    }

    showIPRoute() {
        this.issuesFixed.diagnosis = true;
        this.updateFixProgress();
        
        return `<span class="text-green-400">Kernel IP routing table</span>
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.1.1     0.0.0.0         UG    0      0        0 eth0
192.168.1.0     0.0.0.0         255.255.255.0   U     0      0        0 eth0
192.168.100.0   0.0.0.0         255.255.255.252 U     0      0        0 eth1

<span class="text-yellow-400">⚠️  Analysis: Missing route to 192.168.2.0/24 network!</span>
<span class="text-cyan-400">💡 Hint: Use 'ip route add 192.168.2.0/24 via 192.168.100.2'</span>`;
    }

    pingCommand(ip) {
        if (!ip || !this.validateIP(ip)) {
            return `<span class="text-red-400">% Invalid IP address format</span>`;
        }

        if (!this.issuesFixed.routes) {
            return `<span class="text-yellow-400">PING ${ip}:</span>
<span class="text-red-400">From 192.168.1.1 icmp_seq=1 Destination Net Unreachable
From 192.168.1.1 icmp_seq=2 Destination Net Unreachable  
From 192.168.1.1 icmp_seq=3 Destination Net Unreachable

--- ${ip} ping statistics ---
3 packets transmitted, 0 received, +3 errors, 100% packet loss

❌ Network unreachable - missing static route to 192.168.2.0/24</span>`;
        } else {
            this.issuesFixed.connectivity = true;
            this.updateFixProgress();
            return `<span class="text-yellow-400">PING ${ip}:</span>
<span class="text-green-400">64 bytes from ${ip}: icmp_seq=1 ttl=62 time=4.2 ms
64 bytes from ${ip}: icmp_seq=2 ttl=62 time=4.1 ms  
64 bytes from ${ip}: icmp_seq=3 ttl=62 time=4.3 ms

--- ${ip} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss
round-trip min/avg/max = 4.1/4.2/4.3 ms

✅ Connectivity restored! Emergency services can now communicate.</span>`;
        }
    }

    tracerouteCommand(ip) {
        if (!ip || !this.validateIP(ip)) {
            return `<span class="text-red-400">% Invalid IP address format</span>`;
        }

        if (!this.issuesFixed.routes) {
            return `<span class="text-yellow-400">traceroute to ${ip}, 30 hops max, 60 byte packets</span>
 1  192.168.1.1 (192.168.1.1)  0.124 ms  0.089 ms  0.082 ms
 2  * * *
 3  * * *
<span class="text-red-400">❌ Route to ${ip} not found - packets dropped at router</span>
<span class="text-cyan-400">💡 Configure static route to reach destination network</span>`;
        } else {
            return `<span class="text-yellow-400">traceroute to ${ip}, 30 hops max, 60 byte packets</span>
<span class="text-green-400"> 1  192.168.1.1 (192.168.1.1)      0.124 ms  0.089 ms  0.082 ms
 2  192.168.100.2 (192.168.100.2)  2.341 ms  2.298 ms  2.287 ms  
 3  ${ip} (${ip})  4.123 ms  4.098 ms  4.156 ms

✅ Route is working correctly - 3 hops to destination</span>`;
        }
    }

    addCLIRoute() {
        this.issuesFixed.routes = true;
        this.updateFixProgress();
        
        return `<span class="text-green-400">✅ Static route added successfully:</span>
<span class="text-cyan-400">Destination: 192.168.2.0/24
Gateway: 192.168.100.2  
Interface: eth1
Metric: 1</span>

<span class="text-yellow-400">Route table updated. Testing connectivity...</span>
<span class="text-green-400">Emergency services communication link established!</span>`;
    }

    handleRouteAdd(command) {
        // Parse the route add command
        const parts = command.split(' ');
        if (parts.length < 6) {
            return `<span class="text-red-400">% Incomplete command. Usage:</span>
ip route add &lt;network&gt;/&lt;prefix&gt; via &lt;gateway&gt;
<span class="text-cyan-400">Example: ip route add 192.168.2.0/24 via 192.168.100.2</span>`;
        }

        const network = parts[3];
        const gateway = parts[5];

        if (network === '192.168.2.0/24' && gateway === '192.168.100.2') {
            return this.addCLIRoute();
        } else {
            return `<span class="text-yellow-400">Route added: ${network} via ${gateway}</span>
<span class="text-orange-400">⚠️  Note: For this scenario, you need route to 192.168.2.0/24 via 192.168.100.2</span>`;
        }
    }

    showInterfaces() {
        return `<span class="text-green-400">Interface Status:</span>

eth0    Link encap:Ethernet  HWaddr 00:0c:29:3f:47:a1
        inet addr:192.168.1.1  Bcast:192.168.1.255  Mask:255.255.255.0
        UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
        RX packets:2847 errors:0 dropped:0 overruns:0 frame:0
        TX packets:1923 errors:0 dropped:0 overruns:0 carrier:0

eth1    Link encap:Ethernet  HWaddr 00:0c:29:3f:47:b2  
        inet addr:192.168.100.1  Bcast:192.168.100.3  Mask:255.255.255.252
        UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
        RX packets:1245 errors:0 dropped:0 overruns:0 frame:0
        TX packets:987 errors:0 dropped:0 overruns:0 carrier:0

<span class="text-green-400">✅ All interfaces operational</span>`;
    }

    showVersion() {
        return `<span class="text-cyan-400">Router R1 - Emergency Services Network</span>
Cisco IOS Software, Version 15.4(3)M2
Hardware: Cisco 2901 Integrated Services Router
Uptime: 2 days, 14 hours, 23 minutes
System image file: "c2900-universalk9-mz.SPA.154-3.M2.bin"

<span class="text-green-400">Router Status: OPERATIONAL</span>
<span class="text-yellow-400">Mission: Restore emergency communications</span>`;
    }

    clearTerminal() {
        const output = document.getElementById('terminal-output');
        if (output) {
            output.innerHTML = `Welcome to Network Command Center<br>
Type 'help' for available commands<br>
<br>`;
        }
        return '';
    }

    exitCLI() {
        return `<span class="text-yellow-400">CLI session terminated.</span>
<span class="text-cyan-400">Use 'help' to see available commands</span>`;
    }

    updateCLIProgress() {
        this.updateFixProgress();
        
        // Calculate completion percentage
        const completedTasks = Object.values(this.issuesFixed).filter(fixed => fixed).length;
        const totalTasks = Object.keys(this.issuesFixed).length;
        const progress = (completedTasks / totalTasks) * 100;
        
        this.completionScore = progress;
        this.updateProgress();
    }

    updateFixProgress() {
        const fixes = {
            'fix-diagnosis': this.issuesFixed.diagnosis,
            'fix-routes': this.issuesFixed.routes,
            'fix-connectivity': this.issuesFixed.connectivity
        };

        Object.entries(fixes).forEach(([id, fixed]) => {
            const element = document.getElementById(id);
            if (element) {
                if (fixed) {
                    element.className = 'text-green-400';
                    element.textContent = element.textContent.replace('❌', '✅');
                } else {
                    element.className = 'text-gray-400';
                }
            }
        });
    }

    checkCLICompletion() {
        const allFixed = Object.values(this.issuesFixed).every(fixed => fixed);
        
        if (allFixed) {
            this.completionScore = 100;
            this.enableCompleteButton();
            this.showFeedback('Outstanding! All network issues diagnosed and resolved. Command central is back online!', 'success');
            
            // Show completion message in terminal
            setTimeout(() => {
                const output = document.getElementById('terminal-output');
                if (output) {
                    output.innerHTML += `<br><span class="text-green-400 animate-pulse">🎉 MISSION ACCOMPLISHED! 🎉</span><br>
<span class="text-cyan-400">Emergency services communication restored</span><br>
<span class="text-yellow-400">All city districts can now communicate</span><br>
<span class="text-green-400">Network troubleshooting complete!</span><br><br>`;
                    output.scrollTop = output.scrollHeight;
                }
            }, 1000);
        } else {
            const remaining = Object.entries(this.issuesFixed)
                .filter(([key, fixed]) => !fixed)
                .map(([key, fixed]) => key);
            
            this.showFeedback(`Continue troubleshooting. Remaining: ${remaining.join(', ')}`, 'info');
        }
        
        this.updateProgress();
    }
}

// Register globally and export
window.Room2 = Room2;
export { Room2 };

