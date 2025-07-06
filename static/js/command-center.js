class CommandCenter {
    constructor() {
        this.isVisible = false;
        this.currentRoom = null;
        this.currentLevel = null;
        
        this.init();
    }

    init() {
        this.createCommandCenter();
        this.bindEvents();
        this.updateFromProgressTracker();
    }

    createCommandCenter() {
        // Check if command center already exists
        if (document.getElementById('command-center')) {
            return;
        }

        const commandCenter = document.createElement('div');
        commandCenter.id = 'command-center';
        commandCenter.className = 'fixed top-4 right-4 z-40';
        
        commandCenter.innerHTML = `
            <!-- Command Center Toggle Button -->
            <button id="command-center-toggle" class="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 border border-gray-600">
                <i class="bi bi-command text-xl"></i>
            </button>

            <!-- Command Center Panel -->
            <div id="command-center-panel" class="hidden absolute top-16 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 min-w-80">
                <div class="mb-4">
                    <h3 class="text-lg font-bold text-white flex items-center">
                        <i class="bi bi-command mr-2"></i>
                        Command Center
                    </h3>
                    <p class="text-sm text-gray-400">Quick navigation and progress</p>
                </div>

                <!-- Current Position -->
                <div class="mb-4 p-3 bg-gray-700 rounded-lg">
                    <h4 class="text-sm font-semibold text-blue-400 mb-2">Current Position</h4>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-300">Room <span id="cc-current-room">1</span>, Level <span id="cc-current-level">1</span></span>
                        <div class="flex items-center text-green-400">
                            <i class="bi bi-geo-alt mr-1"></i>
                            <span id="cc-room-name">Flowchart Lab</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="mb-4 p-3 bg-gray-700 rounded-lg">
                    <h4 class="text-sm font-semibold text-yellow-400 mb-2">Quick Stats</h4>
                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="text-center">
                            <div class="text-lg font-bold text-green-300" id="cc-completed-levels">0</div>
                            <div class="text-gray-400">Completed</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-bold text-blue-300" id="cc-current-room-progress">0%</div>
                            <div class="text-gray-400">Room Progress</div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Buttons -->
                <div id="command-center-nav" class="space-y-2">
                    <button id="cc-dashboard-btn" class="w-full bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded transition-colors flex items-center justify-center space-x-2">
                        <i class="bi bi-speedometer2"></i>
                        <span>View Progress Dashboard</span>
                    </button>
                    
                    <div class="grid grid-cols-2 gap-2">
                        <button id="cc-rooms-btn" class="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded transition-colors flex items-center justify-center space-x-1 text-sm">
                            <i class="bi bi-grid-3x3-gap"></i>
                            <span>Rooms</span>
                        </button>
                        
                        <button id="cc-restart-btn" class="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded transition-colors flex items-center justify-center space-x-1 text-sm">
                            <i class="bi bi-arrow-clockwise"></i>
                            <span>Restart</span>
                        </button>
                    </div>

                    <button id="cc-help-btn" class="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition-colors flex items-center justify-center space-x-2 text-sm">
                        <i class="bi bi-question-circle"></i>
                        <span>Help & Controls</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(commandCenter);
    }

    bindEvents() {
        // Toggle command center visibility
        document.getElementById('command-center-toggle')?.addEventListener('click', () => {
            this.togglePanel();
        });

        // Dashboard button
        document.getElementById('cc-dashboard-btn')?.addEventListener('click', () => {
            window.location.href = '/dashboard';
        });

        // Rooms button  
        document.getElementById('cc-rooms-btn')?.addEventListener('click', () => {
            window.location.href = '/rooms';
        });

        // Restart button
        document.getElementById('cc-restart-btn')?.addEventListener('click', () => {
            if (confirm('Restart the current level? Your progress will be lost.')) {
                window.location.reload();
            }
        });

        // Help button
        document.getElementById('cc-help-btn')?.addEventListener('click', () => {
            this.showHelpModal();
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const commandCenter = document.getElementById('command-center');
            const panel = document.getElementById('command-center-panel');
            
            if (this.isVisible && commandCenter && !commandCenter.contains(e.target)) {
                this.hidePanel();
            }
        });

        // Listen for progress updates
        window.addEventListener('progressUpdate', () => {
            this.updateFromProgressTracker();
        });

        window.addEventListener('levelProgressUpdate', () => {
            this.updateFromProgressTracker();
        });
    }

    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        const panel = document.getElementById('command-center-panel');
        if (panel) {
            panel.classList.remove('hidden');
            this.isVisible = true;
            this.updateFromProgressTracker(); // Refresh data when showing
        }
    }

    hidePanel() {
        const panel = document.getElementById('command-center-panel');
        if (panel) {
            panel.classList.add('hidden');
            this.isVisible = false;
        }
    }

    updateFromProgressTracker() {
        if (!window.progressTracker) return;

        const summary = window.progressTracker.getProgressSummary();
        
        // Update current position
        const currentRoom = summary.currentPosition.room;
        const currentLevel = summary.currentPosition.level;
        
        document.getElementById('cc-current-room').textContent = currentRoom;
        document.getElementById('cc-current-level').textContent = currentLevel;
        document.getElementById('cc-completed-levels').textContent = summary.totalLevelsCompleted;

        // Update room name
        const roomNames = {
            1: 'Flowchart Lab',
            2: 'Network Nexus', 
            3: 'AI Systems',
            4: 'Database Crisis',
            5: 'Programming Crisis'
        };
        document.getElementById('cc-room-name').textContent = roomNames[currentRoom] || `Room ${currentRoom}`;

        // Update room progress
        const roomLevels = { 1: 10, 2: 8, 3: 12, 4: 6, 5: 15 };
        const completedInRoom = window.progressTracker.getCompletedLevelsCount(currentRoom);
        const totalInRoom = roomLevels[currentRoom] || 10;
        const roomProgress = Math.round((completedInRoom / totalInRoom) * 100);
        
        document.getElementById('cc-current-room-progress').textContent = `${roomProgress}%`;
    }

    showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-md mx-4 text-white">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold">Help & Controls</h3>
                    <button class="close-help text-gray-400 hover:text-white">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="space-y-4 text-sm">
                    <div>
                        <h4 class="font-semibold text-blue-400 mb-2">Navigation</h4>
                        <ul class="space-y-1 text-gray-300">
                            <li>• Use the Command Center (⌘) for quick access</li>
                            <li>• Click Dashboard to view your overall progress</li>
                            <li>• Use Rooms to jump between different challenges</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-yellow-400 mb-2">Keyboard Shortcuts</h4>
                        <ul class="space-y-1 text-gray-300">
                            <li>• <kbd class="bg-gray-600 px-1 rounded">Esc</kbd> - Open/Close Command Center</li>
                            <li>• <kbd class="bg-gray-600 px-1 rounded">R</kbd> - Restart Level</li>
                            <li>• <kbd class="bg-gray-600 px-1 rounded">H</kbd> - Show Hint</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-green-400 mb-2">Progress Tracking</h4>
                        <p class="text-gray-300">Your progress is automatically saved and synced across devices. You can always return to where you left off!</p>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end">
                    <button class="close-help bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition-colors">
                        Got it!
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind close events
        modal.querySelectorAll('.close-help').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const commandCenter = window.commandCenter;
        if (commandCenter) {
            commandCenter.togglePanel();
        }
    } else if (e.key === 'r' || e.key === 'R') {
        if (e.ctrlKey || e.metaKey) return; // Don't interfere with browser refresh
        if (confirm('Restart the current level?')) {
            window.location.reload();
        }
    } else if (e.key === 'h' || e.key === 'H') {
        // Trigger hint if available
        const hintBtn = document.querySelector('[data-action="hint"], .hint-button, #hint-btn');
        if (hintBtn) {
            hintBtn.click();
        }
    }
});

// Initialize command center
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other components to load
    setTimeout(() => {
        window.commandCenter = new CommandCenter();
    }, 500);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommandCenter;
}
