export class TutorialModal {
    constructor() {
        this.currentRoom = null;
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'tutorial-modal';
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 hidden flex items-center justify-center';
        
        modalOverlay.innerHTML = `
            <div class="bg-gray-800 border-2 border-blue-500 rounded-lg p-6 max-w-4xl max-h-screen overflow-y-auto m-4 shadow-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h2 id="tutorial-title" class="text-2xl font-bold text-blue-400">Room Tutorial</h2>
                    <button id="close-tutorial" class="text-gray-400 hover:text-white text-2xl">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
                
                <div id="tutorial-content" class="text-gray-300">
                    <!-- Content will be dynamically inserted here -->
                </div>
                
                <div class="flex justify-between items-center mt-6">
                    <label class="flex items-center text-sm text-gray-400">
                        <input type="checkbox" id="dont-show-again" class="mr-2">
                        Don't show this tutorial again for this room
                    </label>
                    <div class="space-x-2">
                        <button id="skip-tutorial" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition-colors">
                            Skip Tutorial
                        </button>
                        <button id="start-room" class="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded transition-colors">
                            Start Room
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
    }

    setupEventListeners() {
        const modal = document.getElementById('tutorial-modal');
        const closeBtn = document.getElementById('close-tutorial');
        const skipBtn = document.getElementById('skip-tutorial');
        const startBtn = document.getElementById('start-room');
        const dontShowAgain = document.getElementById('dont-show-again');

        // Close modal handlers
        [closeBtn, skipBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Start room handler
        startBtn.addEventListener('click', () => {
            if (dontShowAgain.checked) {
                this.setTutorialSeen(this.currentRoom);
            }
            this.closeModal();
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    showTutorial(roomNumber) {
        this.currentRoom = roomNumber;
        
        // Check if user has seen this tutorial before
        if (this.hasTutorialBeenSeen(roomNumber)) {
            return;
        }

        const modal = document.getElementById('tutorial-modal');
        const title = document.getElementById('tutorial-title');
        const content = document.getElementById('tutorial-content');

        const tutorialData = this.getTutorialData(roomNumber);
        
        title.textContent = tutorialData.title;
        content.innerHTML = tutorialData.content;

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Add entrance animation
        const modalContent = modal.querySelector('.bg-gray-800');
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            modalContent.style.transition = 'all 0.3s ease-out';
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
        }, 10);
    }

    closeModal() {
        const modal = document.getElementById('tutorial-modal');
        const modalContent = modal.querySelector('.bg-gray-800');
        
        // Add exit animation
        modalContent.style.transition = 'all 0.2s ease-in';
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            // Reset don't show again checkbox
            document.getElementById('dont-show-again').checked = false;
        }, 200);
    }

    getTutorialData(roomNumber) {
        const tutorials = {
            1: {
                title: "🔄 FLOWCHART CONSTRUCTION LAB",
                content: `
                    <div class="space-y-4">
                        <div class="bg-blue-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-blue-300 mb-2">🎯 Your Mission</h3>
                            <p>Learn to create professional flowcharts step by step! Master the building blocks of process visualization used in business, programming, and problem-solving.</p>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-yellow-300 mb-2">🛠️ How to Play</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <p><strong>1. Select Tools:</strong> Use the toolbar on the right to select flowchart elements</p>
                                    <p><strong>2. Place Shapes:</strong> Click on the canvas to place selected elements</p>
                                    <p><strong>3. Connect Elements:</strong> Use the arrow tool to connect shapes in logical order</p>
                                    <p><strong>4. Check Solution:</strong> Validate your flowchart meets the requirements</p>
                                </div>
                                <div class="bg-gray-800 p-3 rounded">
                                    <h4 class="font-bold text-green-300 mb-2">Flowchart Symbols:</h4>
                                    <div class="text-sm space-y-1">
                                        <p>⭕ <strong>Oval:</strong> Start/End points</p>
                                        <p>⬜ <strong>Rectangle:</strong> Process steps</p>
                                        <p>♦️ <strong>Diamond:</strong> Decision points</p>
                                        <p>▱ <strong>Parallelogram:</strong> Input/Output</p>
                                        <p>➡️ <strong>Arrow:</strong> Flow direction</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-green-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-green-300 mb-2">⚠️ Important Notes</h3>
                            <ul class="space-y-1 text-sm">
                                <li>• <strong>Connections are required!</strong> Use arrows to connect all elements</li>
                                <li>• Each level has specific requirements - read the instructions carefully</li>
                                <li>• Follow real-world scenarios to learn practical flowchart design</li>
                                <li>• Use hints if you get stuck on any level</li>
                            </ul>
                        </div>
                    </div>
                `
            },
            2: {
                title: "🌐 NETWORK NEXUS - BUILD THE BACKBONE",
                content: `
                    <div class="space-y-4">
                        <div class="bg-blue-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-blue-300 mb-2">🎯 Your Mission</h3>
                            <p>Build and configure network infrastructure from scratch! Master networking fundamentals including topology design, IP addressing, switching, routing, and network troubleshooting.</p>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-yellow-300 mb-2">🛠️ How to Play</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <p><strong>1. Drag & Drop:</strong> Place network devices on the canvas</p>
                                    <p><strong>2. Cable Connections:</strong> Select cables and connect devices</p>
                                    <p><strong>3. Configure IPs:</strong> Assign IP addresses to devices</p>
                                    <p><strong>4. Test Network:</strong> Use ping and connectivity tests</p>
                                    <p><strong>5. CLI Commands:</strong> Use command-line tools for advanced levels</p>
                                </div>
                                <div class="bg-gray-800 p-3 rounded">
                                    <h4 class="font-bold text-green-300 mb-2">Network Devices:</h4>
                                    <div class="text-sm space-y-1">
                                        <p>💻 <strong>PC:</strong> End user devices</p>
                                        <p>🔀 <strong>Router:</strong> Layer 3 routing</p>
                                        <p>🔄 <strong>Switch:</strong> Layer 2 switching</p>
                                        <p>📹 <strong>CCTV:</strong> Security devices</p>
                                        <p>━━ <strong>Ethernet:</strong> Cable connections</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-purple-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-purple-300 mb-2">📚 Learning Progression</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p><strong>Level 1:</strong> Basic topology building</p>
                                    <p><strong>Level 2:</strong> IP address configuration</p>
                                    <p><strong>Level 3:</strong> Switch optimization</p>
                                </div>
                                <div>
                                    <p><strong>Level 4:</strong> Static routing setup</p>
                                    <p><strong>Level 5:</strong> CLI troubleshooting</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-green-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-green-300 mb-2">💡 Pro Tips</h3>
                            <ul class="space-y-1 text-sm">
                                <li>• Read each scenario carefully - you're solving real network problems!</li>
                                <li>• Physical connections must be made before logical configuration</li>
                                <li>• Use the same subnet for devices that need to communicate</li>
                                <li>• Test connectivity frequently to verify your configurations</li>
                            </ul>
                        </div>
                    </div>
                `
            },
            3: {
                title: "🤖 AI SYSTEMS - MACHINE LEARNING LAB",
                content: `
                    <div class="space-y-4">
                        <div class="bg-blue-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-blue-300 mb-2">🎯 Your Mission</h3>
                            <p>Master artificial intelligence concepts through interactive card-based learning! Explore AI ethics, supervised learning, reinforcement learning, unsupervised learning, and deep learning.</p>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-yellow-300 mb-2">🃏 How to Play</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <p><strong>1. Read Cards:</strong> Each card presents an AI concept or scenario</p>
                                    <p><strong>2. Swipe Decision:</strong> Swipe left or right based on your answer</p>
                                    <p><strong>3. Learn Feedback:</strong> Get immediate explanations for your choices</p>
                                    <p><strong>4. Progress:</strong> Unlock new topics as you master concepts</p>
                                </div>
                                <div class="bg-gray-800 p-3 rounded">
                                    <h4 class="font-bold text-green-300 mb-2">Card Controls:</h4>
                                    <div class="text-sm space-y-1">
                                        <p>👈 <strong>Swipe Left:</strong> Disagree/No/False</p>
                                        <p>👉 <strong>Swipe Right:</strong> Agree/Yes/True</p>
                                        <p>🎯 <strong>Click Buttons:</strong> Alternative to swiping</p>
                                        <p>📖 <strong>Read Carefully:</strong> Each scenario is unique</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-purple-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-purple-300 mb-2">🧠 Learning Topics</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p><strong>AI Ethics:</strong> Moral implications and responsible AI</p>
                                    <p><strong>Supervised Learning:</strong> Learning from labeled data</p>
                                    <p><strong>Reinforcement Learning:</strong> Learning through rewards</p>
                                </div>
                                <div>
                                    <p><strong>Unsupervised Learning:</strong> Finding patterns in unlabeled data</p>
                                    <p><strong>Deep Learning:</strong> Neural networks and complex patterns</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-green-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-green-300 mb-2">🎓 Learning Strategy</h3>
                            <ul class="space-y-1 text-sm">
                                <li>• Think about real-world applications of each AI concept</li>
                                <li>• Consider ethical implications in AI decision-making</li>
                                <li>• Progress is saved - take your time to understand each topic</li>
                                <li>• Review feedback carefully to reinforce learning</li>
                            </ul>
                        </div>
                    </div>
                `
            },
            4: {
                title: "🗃️ DATABASE CRISIS - SQL RESCUE MISSION",
                content: `
                    <div class="space-y-4">
                        <div class="bg-blue-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-blue-300 mb-2">🎯 Your Mission</h3>
                            <p>The city's database systems are in chaos! Use your SQL skills to query, analyze, and rescue critical data. Master database fundamentals through real-world emergency scenarios.</p>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-yellow-300 mb-2">💻 How to Play</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <p><strong>1. Read Scenario:</strong> Understand the database emergency</p>
                                    <p><strong>2. Write SQL:</strong> Use the query editor to write SQL commands</p>
                                    <p><strong>3. Execute Query:</strong> Run your SQL to see results</p>
                                    <p><strong>4. Validate Solution:</strong> Check if your query solves the problem</p>
                                </div>
                                <div class="bg-gray-800 p-3 rounded">
                                    <h4 class="font-bold text-green-300 mb-2">SQL Commands:</h4>
                                    <div class="text-sm space-y-1">
                                        <p><code>SELECT</code> - Retrieve data</p>
                                        <p><code>WHERE</code> - Filter conditions</p>
                                        <p><code>JOIN</code> - Combine tables</p>
                                        <p><code>GROUP BY</code> - Aggregate data</p>
                                        <p><code>ORDER BY</code> - Sort results</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-red-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-red-300 mb-2">🚨 Crisis Scenarios</h3>
                            <div class="text-sm space-y-2">
                                <p><strong>Emergency Response:</strong> Find critical information quickly</p>
                                <p><strong>Data Recovery:</strong> Locate missing or corrupted records</p>
                                <p><strong>System Analysis:</strong> Generate reports for decision-making</p>
                                <p><strong>Data Integrity:</strong> Identify and fix data inconsistencies</p>
                            </div>
                        </div>
                        
                        <div class="bg-green-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-green-300 mb-2">📝 SQL Tips</h3>
                            <ul class="space-y-1 text-sm">
                                <li>• Start with simple SELECT statements and build complexity</li>
                                <li>• Use table schemas to understand data relationships</li>
                                <li>• Test queries incrementally to avoid errors</li>
                                <li>• Pay attention to case sensitivity and syntax</li>
                                <li>• Use LIMIT to test queries with large datasets</li>
                            </ul>
                        </div>
                    </div>
                `
            },
            5: {
                title: "🐛 PROGRAMMING CRISIS - CODE DEBUG MISSION",
                content: `
                    <div class="space-y-4">
                        <div class="bg-blue-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-blue-300 mb-2">🎯 Your Mission</h3>
                            <p>Critical systems are failing due to buggy code! Debug, fix, and optimize programs to restore functionality. Master programming fundamentals through hands-on problem-solving.</p>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-yellow-300 mb-2">⌨️ How to Play</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <p><strong>1. Analyze Code:</strong> Read the broken code carefully</p>
                                    <p><strong>2. Identify Bugs:</strong> Find syntax, logic, and runtime errors</p>
                                    <p><strong>3. Fix Issues:</strong> Edit the code to resolve problems</p>
                                    <p><strong>4. Test Solution:</strong> Run the code to verify it works</p>
                                </div>
                                <div class="bg-gray-800 p-3 rounded">
                                    <h4 class="font-bold text-green-300 mb-2">Languages Supported:</h4>
                                    <div class="text-sm space-y-1">
                                        <p>🐍 <strong>Python:</strong> General programming</p>
                                        <p>☕ <strong>JavaScript:</strong> Web development</p>
                                        <p>🚀 <strong>Java:</strong> Object-oriented programming</p>
                                        <p>💎 <strong>C++:</strong> System programming</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-red-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-red-300 mb-2">🐛 Common Bug Types</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p><strong>Syntax Errors:</strong> Missing semicolons, brackets</p>
                                    <p><strong>Logic Errors:</strong> Incorrect algorithms</p>
                                    <p><strong>Runtime Errors:</strong> Division by zero, null references</p>
                                </div>
                                <div>
                                    <p><strong>Type Errors:</strong> Mismatched data types</p>
                                    <p><strong>Scope Issues:</strong> Variable accessibility</p>
                                    <p><strong>Performance:</strong> Inefficient algorithms</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-green-900 p-4 rounded-lg">
                            <h3 class="text-lg font-bold text-green-300 mb-2">🔧 Debugging Strategy</h3>
                            <ul class="space-y-1 text-sm">
                                <li>• Read error messages carefully - they provide valuable clues</li>
                                <li>• Check syntax first - look for missing brackets, quotes, semicolons</li>
                                <li>• Trace through the code logic step by step</li>
                                <li>• Test with simple inputs to isolate problems</li>
                                <li>• Use print statements to check variable values</li>
                            </ul>
                        </div>
                    </div>
                `
            }
        };

        return tutorials[roomNumber] || {
            title: "Room Tutorial",
            content: "<p>Welcome to this room! Follow the on-screen instructions to complete the challenges.</p>"
        };
    }

    hasTutorialBeenSeen(roomNumber) {
        const seenTutorials = JSON.parse(localStorage.getItem('seenTutorials') || '[]');
        return seenTutorials.includes(roomNumber);
    }

    setTutorialSeen(roomNumber) {
        const seenTutorials = JSON.parse(localStorage.getItem('seenTutorials') || '[]');
        if (!seenTutorials.includes(roomNumber)) {
            seenTutorials.push(roomNumber);
            localStorage.setItem('seenTutorials', JSON.stringify(seenTutorials));
        }
    }

    // Method to reset all tutorials (for testing or user preference)
    resetAllTutorials() {
        localStorage.removeItem('seenTutorials');
    }

    // Method to show tutorial even if seen before (for help button)
    forceShowTutorial(roomNumber) {
        this.currentRoom = roomNumber;
        const modal = document.getElementById('tutorial-modal');
        const title = document.getElementById('tutorial-title');
        const content = document.getElementById('tutorial-content');

        const tutorialData = this.getTutorialData(roomNumber);
        
        title.textContent = tutorialData.title;
        content.innerHTML = tutorialData.content;

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Hide the "don't show again" option when forcing tutorial
        const dontShowAgain = document.getElementById('dont-show-again').parentElement;
        dontShowAgain.style.display = 'none';

        // Add entrance animation
        const modalContent = modal.querySelector('.bg-gray-800');
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            modalContent.style.transition = 'all 0.3s ease-out';
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
        }, 10);
    }
}

// Initialize tutorial modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tutorialModal = new TutorialModal();
});
