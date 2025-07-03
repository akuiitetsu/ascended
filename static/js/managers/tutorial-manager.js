export class TutorialManager {
    constructor() {
        this.tutorialData = {
            1: {
                title: "🔄 FLOWCHART CONSTRUCTION LAB",
                subtitle: "Learn to Create Professional Flowcharts",
                description: "Master the fundamentals of flowchart design through hands-on practice with real business scenarios.",
                icon: "bi-diagram-3",
                color: "blue",
                objectives: [
                    "Learn flowchart symbols and their meanings",
                    "Practice connecting elements with proper flow",
                    "Complete 5 progressive business scenarios",
                    "Master start/end, process, decision, and I/O elements"
                ],
                controls: [
                    "Select tools from the right panel",
                    "Click on canvas to place flowchart elements",
                    "Use Arrow tool to connect elements",
                    "Use Delete tool to remove elements",
                    "Check Solution to validate your work"
                ],
                tips: [
                    "Every flowchart needs START and END points (ovals)",
                    "Use rectangles for process steps and actions",
                    "Use diamonds for decisions and branching",
                    "Use parallelograms for input/output operations",
                    "Always connect elements with arrows for proper flow"
                ],
                character: "👨‍💻 Tutorial Guide",
                scenario: "Progressive business flowchart challenges"
            },
            2: {
                title: "🌐 NETWORK NEXUS",
                subtitle: "Build the Network Backbone",
                description: "Master networking fundamentals through hands-on topology building, IP configuration, and CLI troubleshooting.",
                icon: "bi-router",
                color: "blue",
                objectives: [
                    "Build network topologies with devices and cables",
                    "Configure IP addresses and subnets",
                    "Optimize networks with switches and routers",
                    "Troubleshoot connectivity with CLI commands",
                    "Complete 5 networking scenarios"
                ],
                controls: [
                    "Drag devices from toolkit to canvas",
                    "Use cables to connect network devices",
                    "Configure IP addresses in forms",
                    "Test connectivity with ping commands",
                    "Use CLI terminal for advanced troubleshooting"
                ],
                tips: [
                    "Start with basic PC-to-router connections",
                    "Use same subnet for devices to communicate",
                    "Add switches to optimize local traffic",
                    "Configure static routes for inter-network communication",
                    "Use CLI commands: ping, traceroute, show ip route"
                ],
                character: "👨‍💻 Alex (Network Technician)",
                scenario: "City network infrastructure emergency"
            },
            3: {
                title: "🤖 AI TRAINING SYSTEM",
                subtitle: "Teach AI Ethics and Machine Learning",
                description: "Train an AI system through interactive card-based learning across 5 categories of machine learning and ethics.",
                icon: "bi-robot",
                color: "purple",
                objectives: [
                    "Train AI in ethical decision making",
                    "Teach supervised learning concepts",
                    "Practice reinforcement learning scenarios",
                    "Explore unsupervised learning patterns",
                    "Master deep learning neural networks"
                ],
                controls: [
                    "Swipe cards LEFT or RIGHT based on prompts",
                    "Use mouse to drag cards for decisions",
                    "Click buttons below cards for choices",
                    "Follow the AI's guidance for each category",
                    "Complete 5 scenarios per category"
                ],
                tips: [
                    "Read each scenario carefully before deciding",
                    "Consider ethical implications for AI decisions",
                    "Match correct examples for learning algorithms",
                    "Look for patterns in unsupervised learning",
                    "Identify neural network applications in deep learning"
                ],
                character: "🤖 AI SYSTEM",
                scenario: "AI consciousness development training"
            },
            4: {
                title: "💾 DATABASE EMERGENCY",
                subtitle: "Master SQL and Database Management",
                description: "Resolve critical database issues through SQL queries, data analysis, and database optimization techniques.",
                icon: "bi-database-x",
                color: "red",
                objectives: [
                    "Write SQL queries to retrieve critical data",
                    "Analyze database corruption and integrity issues",
                    "Optimize query performance and indexing",
                    "Handle data backup and recovery procedures",
                    "Complete emergency database scenarios"
                ],
                controls: [
                    "Write SQL queries in the code editor",
                    "Execute queries with the Run button",
                    "Analyze query results and error messages",
                    "Use database tools for optimization",
                    "Navigate through progressive challenges"
                ],
                tips: [
                    "Start with basic SELECT statements",
                    "Use WHERE clauses to filter data",
                    "JOIN tables to combine related data",
                    "Use GROUP BY for aggregation queries",
                    "Check syntax carefully before executing"
                ],
                character: "👨‍💻 Database Administrator",
                scenario: "Critical database system failure"
            },
            5: {
                title: "🐛 PROGRAMMING CRISIS",
                subtitle: "Debug Code and Navigate with Programming",
                description: "Use Python-like programming commands to navigate a grid world, debug code, and eliminate system bugs.",
                icon: "bi-bug",
                color: "pink",
                objectives: [
                    "Navigate grid world using code commands",
                    "Write loops and conditional statements",
                    "Debug and fix programming errors",
                    "Eliminate bugs through code execution",
                    "Master programming logic and syntax"
                ],
                controls: [
                    "Write Python-like code in the editor",
                    "Use move(), turn_left(), turn_right() commands",
                    "Execute code with the Run button",
                    "Debug errors and fix syntax issues",
                    "Complete programming challenges"
                ],
                tips: [
                    "Plan your path before writing code",
                    "Use loops to avoid repetitive commands",
                    "Add conditions to handle different scenarios",
                    "Debug step by step to find errors",
                    "Test code frequently during development"
                ],
                character: "👨‍💻 Commander Chen (Operations Chief)",
                scenario: "System debugging through code navigation"
            }
        };
        
        // Ensure all required methods are bound
        this.showTutorial = this.showTutorial.bind(this);
        this.closeTutorial = this.closeTutorial.bind(this);
        this.handleEscKey = this.handleEscKey.bind(this);
        
        console.log('TutorialManager initialized with data for rooms:', Object.keys(this.tutorialData));
    }

    showTutorial(roomNumber) {
        try {
            const tutorial = this.tutorialData[roomNumber];
            if (!tutorial) {
                console.warn(`No tutorial data found for room ${roomNumber}`);
                this.showFallbackTutorial(roomNumber);
                return;
            }

            // Close any existing tutorial modal
            const existingModal = document.getElementById('tutorial-modal');
            if (existingModal) {
                existingModal.remove();
            }

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
            modal.id = 'tutorial-modal';
            
            modal.innerHTML = `
                <div class="bg-gray-800 border-2 border-${tutorial.color}-500 rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
                    <div class="p-6">
                        <!-- Header -->
                        <div class="flex justify-between items-start mb-6">
                            <div class="flex items-center">
                                <i class="bi ${tutorial.icon} text-6xl text-${tutorial.color}-400 mr-4"></i>
                                <div>
                                    <h2 class="text-3xl font-bold text-${tutorial.color}-400">${tutorial.title}</h2>
                                    <p class="text-xl text-gray-300 mt-1">${tutorial.subtitle}</p>
                                    <p class="text-sm text-gray-400 mt-2">Room ${roomNumber} - Welcome Guide</p>
                                </div>
                            </div>
                            <button id="close-tutorial" class="text-gray-400 hover:text-white text-2xl">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </div>

                        <!-- Character & Scenario -->
                        <div class="bg-gray-700 rounded-lg p-4 mb-6">
                            <div class="flex items-center gap-4 mb-3">
                                <div class="text-3xl">${tutorial.character.split(' ')[0]}</div>
                                <div>
                                    <h3 class="text-lg font-bold text-${tutorial.color}-300">Character: ${tutorial.character}</h3>
                                    <p class="text-gray-300">Scenario: ${tutorial.scenario}</p>
                                </div>
                            </div>
                            <p class="text-gray-300 leading-relaxed">${tutorial.description}</p>
                        </div>

                        <!-- Main Content Grid -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <!-- Learning Objectives -->
                            <div class="bg-green-900 border border-green-600 rounded-lg p-4">
                                <h3 class="text-lg font-bold text-green-400 mb-3 flex items-center">
                                    <i class="bi bi-target mr-2"></i>Learning Objectives
                                </h3>
                                <ul class="space-y-2">
                                    ${tutorial.objectives.map(obj => `
                                        <li class="text-green-200 text-sm flex items-start">
                                            <i class="bi bi-check-circle text-green-400 mr-2 mt-1 flex-shrink-0"></i>
                                            <span>${obj}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>

                            <!-- Controls & Interaction -->
                            <div class="bg-blue-900 border border-blue-600 rounded-lg p-4">
                                <h3 class="text-lg font-bold text-blue-400 mb-3 flex items-center">
                                    <i class="bi bi-controller mr-2"></i>How to Play
                                </h3>
                                <ul class="space-y-2">
                                    ${tutorial.controls.map(control => `
                                        <li class="text-blue-200 text-sm flex items-start">
                                            <i class="bi bi-gear text-blue-400 mr-2 mt-1 flex-shrink-0"></i>
                                            <span>${control}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>

                            <!-- Tips & Strategy -->
                            <div class="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                                <h3 class="text-lg font-bold text-yellow-400 mb-3 flex items-center">
                                    <i class="bi bi-lightbulb mr-2"></i>Pro Tips
                                </h3>
                                <ul class="space-y-2">
                                    ${tutorial.tips.map(tip => `
                                        <li class="text-yellow-200 text-sm flex items-start">
                                            <i class="bi bi-star text-yellow-400 mr-2 mt-1 flex-shrink-0"></i>
                                            <span>${tip}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex justify-center gap-4 mt-8">
                            <button id="start-room" class="bg-${tutorial.color}-600 hover:bg-${tutorial.color}-500 px-8 py-3 rounded-lg font-bold text-lg transition-colors">
                                <i class="bi bi-play-fill mr-2"></i>Start Challenge
                            </button>
                            <button id="skip-tutorial" class="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-bold transition-colors">
                                <i class="bi bi-skip-forward mr-2"></i>Close Tutorial
                            </button>
                        </div>

                        <!-- Quick Reference -->
                        <div class="bg-gray-700 rounded-lg p-4 mt-6">
                            <h4 class="text-lg font-bold text-gray-300 mb-2 flex items-center">
                                <i class="bi bi-info-circle mr-2"></i>Quick Reference
                            </h4>
                            <div class="text-sm text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <strong class="text-gray-300">Room Type:</strong> ${this.getRoomType(roomNumber)}<br>
                                    <strong class="text-gray-300">Difficulty:</strong> ${this.getDifficulty(roomNumber)}<br>
                                    <strong class="text-gray-300">Estimated Time:</strong> ${this.getEstimatedTime(roomNumber)}
                                </div>
                                <div>
                                    <strong class="text-gray-300">Skills:</strong> ${this.getSkills(roomNumber)}<br>
                                    <strong class="text-gray-300">Prerequisites:</strong> ${this.getPrerequisites(roomNumber)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Set up event listeners with error handling
            this.setupTutorialEventListeners();

            console.log(`Tutorial shown for room ${roomNumber}: ${tutorial.title}`);
        } catch (error) {
            console.error('Error showing tutorial:', error);
            this.showFallbackTutorial(roomNumber);
        }
    }

    setupTutorialEventListeners() {
        try {
            // Event listeners
            const closeBtn = document.getElementById('close-tutorial');
            const startBtn = document.getElementById('start-room');
            const skipBtn = document.getElementById('skip-tutorial');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeTutorial());
            }

            if (startBtn) {
                startBtn.addEventListener('click', () => this.closeTutorial());
            }

            if (skipBtn) {
                skipBtn.addEventListener('click', () => this.closeTutorial());
            }

            // Close on ESC key
            document.addEventListener('keydown', this.handleEscKey);

            // Close on backdrop click
            const modal = document.getElementById('tutorial-modal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeTutorial();
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up tutorial event listeners:', error);
        }
    }

    showFallbackTutorial(roomNumber) {
        const fallbackModal = document.createElement('div');
        fallbackModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
        fallbackModal.id = 'tutorial-modal';
        
        fallbackModal.innerHTML = `
            <div class="bg-gray-800 border-2 border-blue-500 rounded-lg max-w-2xl w-full p-6">
                <div class="text-center">
                    <i class="bi bi-info-circle text-6xl text-blue-400 mb-4"></i>
                    <h2 class="text-2xl font-bold text-blue-400 mb-4">Room ${roomNumber} Tutorial</h2>
                    <p class="text-gray-300 mb-6">Welcome to Room ${roomNumber}! Tutorial data is loading...</p>
                    <button id="close-fallback-tutorial" class="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold">
                        Continue to Room
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(fallbackModal);
        
        document.getElementById('close-fallback-tutorial')?.addEventListener('click', () => {
            fallbackModal.remove();
        });
    }

    closeTutorial() {
        const modal = document.getElementById('tutorial-modal');
        if (modal) {
            modal.remove();
        }
        document.removeEventListener('keydown', this.handleEscKey);
    }

    handleEscKey(e) {
        if (e.key === 'Escape') {
            this.closeTutorial();
        }
    }

    getRoomType(roomNumber) {
        const types = {
            1: "Interactive Tutorial",
            2: "Network Simulation", 
            3: "AI Training Game",
            4: "Database Challenge",
            5: "Programming Puzzle"
        };
        return types[roomNumber] || "Challenge";
    }

    getDifficulty(roomNumber) {
        const difficulties = {
            1: "Beginner",
            2: "Intermediate",
            3: "Intermediate", 
            4: "Advanced",
            5: "Advanced"
        };
        return difficulties[roomNumber] || "Intermediate";
    }

    getEstimatedTime(roomNumber) {
        const times = {
            1: "10-15 minutes",
            2: "15-20 minutes",
            3: "10-15 minutes",
            4: "20-25 minutes", 
            5: "15-20 minutes"
        };
        return times[roomNumber] || "15 minutes";
    }

    getSkills(roomNumber) {
        const skills = {
            1: "Flowchart Design, Process Mapping",
            2: "Networking, IP Configuration, CLI",
            3: "AI Ethics, Machine Learning",
            4: "SQL, Database Management",
            5: "Programming, Debugging, Logic"
        };
        return skills[roomNumber] || "Technical Skills";
    }

    getPrerequisites(roomNumber) {
        const prereqs = {
            1: "None",
            2: "Basic networking concepts",
            3: "Basic AI/ML awareness",
            4: "Basic SQL knowledge",
            5: "Basic programming concepts"
        };
        return prereqs[roomNumber] || "None";
    }
}
