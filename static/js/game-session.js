class GameSession {
    constructor() {
        this.isInitialized = false;
        this.currentRoom = null;
        this.currentLevel = null;
        this.levelStartTime = null;
        this.sessionData = {};
        
        this.init();
    }

    async init() {
        // Wait for progress tracker to be ready
        if (window.progressTracker) {
            await this.restoreSession();
        } else {
            // Wait a bit for progress tracker to initialize
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.isInitialized = true;
        this.setupEventListeners();
        console.log('Game session initialized');
    }

    async restoreSession() {
        const savedPosition = window.progressTracker.restoreUserPosition();
        
        this.currentRoom = savedPosition.room;
        this.currentLevel = savedPosition.level;
        
        console.log(`Restored session: Room ${this.currentRoom}, Level ${this.currentLevel}`);
        
        // Redirect user to their current position if they're not already there
        this.redirectToCurrentPosition();
    }

    redirectToCurrentPosition() {
        const currentPath = window.location.pathname;
        const expectedPath = `/room/${this.currentRoom}/level/${this.currentLevel}`;
        
        // Only redirect if we're on a game page and not already at the right level
        if (currentPath.includes('/room/') && currentPath !== expectedPath) {
            console.log(`Redirecting to current position: ${expectedPath}`);
            window.location.href = expectedPath;
        }
    }

    setupEventListeners() {
        // Listen for progress updates
        window.addEventListener('progressUpdate', (event) => {
            const { room, level } = event.detail;
            this.currentRoom = room;
            this.currentLevel = level;
        });

        // Listen for level completion
        window.addEventListener('levelCompleted', (event) => {
            this.handleLevelCompletion(event.detail);
        });

        // Track level start time
        window.addEventListener('levelStarted', (event) => {
            this.levelStartTime = Date.now();
            this.sessionData.levelAttempts = (this.sessionData.levelAttempts || 0) + 1;
        });
    }

    startLevel(roomId, levelId) {
        this.currentRoom = parseInt(roomId);
        this.currentLevel = parseInt(levelId);
        this.levelStartTime = Date.now();
        this.sessionData = {
            attempts: 1,
            hintsUsed: 0,
            mistakes: 0
        };
        
        // Update progress tracker
        window.progressTracker.setCurrentRoom(roomId);
        window.progressTracker.setCurrentLevel(levelId);
        
        // Trigger event for other components
        window.dispatchEvent(new CustomEvent('levelStarted', {
            detail: { room: roomId, level: levelId, startTime: this.levelStartTime }
        }));
        
        console.log(`Started level ${levelId} in room ${roomId}`);
    }

    handleLevelCompletion(completionData) {
        const timeSpent = this.levelStartTime ? Date.now() - this.levelStartTime : 0;
        
        const fullCompletionData = {
            ...completionData,
            timeSpent: timeSpent,
            attempts: this.sessionData.attempts || 1,
            hintsUsed: this.sessionData.hintsUsed || 0,
            mistakes: this.sessionData.mistakes || 0,
            completedAt: Date.now()
        };
        
        // Mark level as completed in progress tracker
        window.progressTracker.markLevelCompleted(
            this.currentRoom, 
            this.currentLevel, 
            fullCompletionData
        );
        
        console.log(`Completed level ${this.currentLevel} in room ${this.currentRoom}`, fullCompletionData);
        
        // Show completion feedback
        this.showCompletionFeedback(fullCompletionData);
    }

    // Method to check if user can access a specific level
    canAccessLevel(roomId, levelId) {
        return window.progressTracker.isLevelUnlocked(roomId, levelId);
    }

    // Method to navigate to user dashboard
    goToDashboard() {
        window.location.href = '/dashboard';
    }

    // Method to get current progress summary for display
    getProgressSummary() {
        if (window.progressTracker) {
            return window.progressTracker.getProgressSummary();
        }
        return null;
    }

    // Method to add dashboard button to any page
    addDashboardButton(containerId = 'command-center-nav') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Container for dashboard button not found:', containerId);
            return;
        }

        // Check if button already exists
        if (container.querySelector('#dashboard-btn')) {
            return;
        }

        const dashboardBtn = document.createElement('button');
        dashboardBtn.id = 'dashboard-btn';
        dashboardBtn.className = 'bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded transition-colors flex items-center space-x-2';
        dashboardBtn.innerHTML = `
            <i class="bi bi-speedometer2"></i>
            <span class="hidden sm:inline">Dashboard</span>
        `;
        
        dashboardBtn.addEventListener('click', () => {
            this.goToDashboard();
        });

        // Add to container (prepend to put it first)
        container.insertBefore(dashboardBtn, container.firstChild);
    }

    // Enhanced completion feedback with dashboard option
    showCompletionFeedback(completionData) {
        // Create completion modal or notification
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-md mx-4 text-white">
                <div class="text-center">
                    <div class="text-4xl mb-4">🎉</div>
                    <h3 class="text-xl font-bold mb-2">Level Completed!</h3>
                    <div class="space-y-2 text-sm text-gray-300">
                        <p>Time: ${this.formatTime(completionData.timeSpent)}</p>
                        <p>Attempts: ${completionData.attempts}</p>
                        ${completionData.score ? `<p>Score: ${completionData.score}</p>` : ''}
                    </div>
                    <div class="mt-6 space-y-3">
                        <div class="flex space-x-3">
                            <button id="next-level-btn" class="flex-1 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition-colors">
                                Next Level
                            </button>
                            <button id="room-select-btn" class="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition-colors">
                                Room Select
                            </button>
                        </div>
                        <button id="dashboard-modal-btn" class="w-full bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded transition-colors">
                            <i class="bi bi-speedometer2 mr-2"></i>
                            View Progress Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle button clicks
        modal.querySelector('#next-level-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.goToNextLevel();
        });
        
        modal.querySelector('#room-select-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            window.location.href = '/rooms';
        });

        modal.querySelector('#dashboard-modal-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.goToDashboard();
        });
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                document.body.removeChild(modal);
                this.goToNextLevel();
            }
        }, 10000);
    }

    trackHintUsed() {
        this.sessionData.hintsUsed = (this.sessionData.hintsUsed || 0) + 1;
    }

    trackMistake() {
        this.sessionData.mistakes = (this.sessionData.mistakes || 0) + 1;
    }

    trackAttempt() {
        this.sessionData.attempts = (this.sessionData.attempts || 0) + 1;
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }

    getCurrentPosition() {
        return {
            room: this.currentRoom,
            level: this.currentLevel
        };
    }
}

// Initialize global game session
window.gameSession = new GameSession();

// Auto-add dashboard button when page loads if there's a command center
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.gameSession) {
            window.gameSession.addDashboardButton();
        }
    }, 1000); // Wait a bit for other components to load
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameSession;
}
