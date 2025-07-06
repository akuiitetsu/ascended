class RoomNavigation {
    constructor() {
        this.currentRoom = null;
        this.levels = {};
        
        this.init();
    }

    async init() {
        // Wait for progress tracker
        await this.waitForProgressTracker();
        
        // Load current room or default to 1
        this.currentRoom = window.progressTracker.currentRoom || 1;
        
        // Setup UI
        this.setupRoomDisplay();
        this.setupLevelGrid();
        this.setupEventListeners();
        
        console.log('Room navigation initialized');
    }

    async waitForProgressTracker() {
        while (!window.progressTracker || !window.progressTracker.userProgress) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    setupRoomDisplay() {
        const roomElements = document.querySelectorAll('[data-room]');
        roomElements.forEach(element => {
            element.addEventListener('click', (e) => {
                const roomId = parseInt(e.currentTarget.dataset.room);
                this.switchToRoom(roomId);
            });
        });
        
        // Update current room display
        this.updateRoomDisplay();
    }

    setupLevelGrid() {
        this.updateLevelGrid();
    }

    setupEventListeners() {
        // Listen for progress updates
        window.addEventListener('progressUpdate', () => {
            this.updateRoomDisplay();
            this.updateLevelGrid();
        });

        window.addEventListener('levelProgressUpdate', () => {
            this.updateLevelGrid();
        });
    }

    switchToRoom(roomId) {
        this.currentRoom = roomId;
        window.progressTracker.setCurrentRoom(roomId);
        
        this.updateRoomDisplay();
        this.updateLevelGrid();
    }

    updateRoomDisplay() {
        // Update active room indicator
        document.querySelectorAll('[data-room]').forEach(element => {
            element.classList.toggle('active', 
                parseInt(element.dataset.room) === this.currentRoom);
        });
        
        // Update room title
        const roomTitle = document.getElementById('current-room-title');
        if (roomTitle) {
            roomTitle.textContent = this.getRoomName(this.currentRoom);
        }
        
        // Update room progress
        this.updateRoomProgress();
    }

    getRoomName(roomId) {
        const roomNames = {
            1: 'Flowchart Lab',
            2: 'Network Nexus',
            3: 'AI Systems',
            4: 'Database Crisis',
            5: 'Programming Crisis'
        };
        return roomNames[roomId] || `Room ${roomId}`;
    }

    getTotalLevelsForRoom(roomId) {
        // Use the same level counts as progress tracker
        const levelCounts = {
            1: 5, // Flowchart Lab
            2: 5, // Network Nexus
            3: 5, // AI Systems
            4: 5, // Database Crisis
            5: 5  // Programming Crisis
        };
        return levelCounts[roomId] || 5;
    }

    createLevelElement(levelId) {
        const isCompleted = window.progressTracker.isLevelCompleted(this.currentRoom, levelId);
        const isUnlocked = window.progressTracker.isLevelUnlocked(this.currentRoom, levelId);
        const isCurrent = window.progressTracker.currentLevel === levelId && 
                         window.progressTracker.currentRoom === this.currentRoom;
        
        const levelElement = document.createElement('div');
        levelElement.className = `level-card p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            isCompleted ? 'bg-green-900 border-green-600 hover:border-green-500' :
            isCurrent ? 'bg-blue-900 border-blue-600 hover:border-blue-500' :
            isUnlocked ? 'bg-gray-700 border-gray-600 hover:border-gray-500' :
            'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
        }`;
        
        const levelProgress = window.progressTracker.getLevelProgress(this.currentRoom, levelId);
        
        levelElement.innerHTML = `
            <div class="text-center">
                <div class="text-3xl mb-3">
                    ${isCompleted ? '✅' : isCurrent ? '🎯' : isUnlocked ? '🎮' : '🔒'}
                </div>
                <div class="font-bold text-white text-lg mb-1">Level ${levelId}</div>
                <div class="text-sm mb-2 ${
                    isCompleted ? 'text-green-300' : 
                    isCurrent ? 'text-blue-300' :
                    isUnlocked ? 'text-gray-300' : 'text-gray-500'
                }">
                    ${isCompleted ? 'Completed' : 
                      isCurrent ? 'Current' :
                      isUnlocked ? 'Available' : 'Locked'}
                </div>
                ${this.getLevelProgress(levelId, levelProgress)}
                ${this.getLevelActions(levelId, isUnlocked, isCompleted, isCurrent)}
            </div>
        `;
        
        if (isUnlocked) {
            levelElement.addEventListener('click', () => {
                this.navigateToLevel(levelId);
            });
        }
        
        return levelElement;
    }

    getLevelProgress(levelId, progress) {
        if (!progress) return '';
        
        let progressInfo = '';
        if (progress.score !== undefined) {
            progressInfo += `<div class="text-xs text-yellow-400 mb-1">Score: ${progress.score}%</div>`;
        }
        if (progress.timeSpent) {
            const timeStr = this.formatTime(progress.timeSpent);
            progressInfo += `<div class="text-xs text-gray-400 mb-1">Time: ${timeStr}</div>`;
        }
        if (progress.attempts) {
            progressInfo += `<div class="text-xs text-gray-400">Attempts: ${progress.attempts}</div>`;
        }
        
        return progressInfo;
    }

    getLevelActions(levelId, isUnlocked, isCompleted, isCurrent) {
        if (!isUnlocked) {
            return '<div class="mt-2 text-xs text-gray-500">Complete previous level</div>';
        }
        
        return `
            <div class="mt-3">
                <button class="level-action-btn w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                    isCompleted ? 'bg-green-600 hover:bg-green-500 text-white' :
                    isCurrent ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                    'bg-gray-600 hover:bg-gray-500 text-white'
                }" onclick="event.stopPropagation(); levelNavigation.navigateToLevel(${levelId})">
                    ${isCompleted ? 'Review' : isCurrent ? 'Continue' : 'Start'}
                </button>
            </div>
        `;
    }

    navigateToLevel(levelId) {
        // Update progress tracker
        window.progressTracker.setCurrentRoom(this.currentRoom);
        window.progressTracker.setCurrentLevel(levelId);
        
        // Navigate to the level
        window.location.href = `/room/${this.currentRoom}/level/${levelId}`;
    }

    updateRoomProgress() {
        const progressElement = document.getElementById('room-progress');
        if (!progressElement) return;
        
        const completedCount = window.progressTracker.getCompletedLevelsCount(this.currentRoom);
        const totalLevels = this.getTotalLevelsForRoom(this.currentRoom);
        const progressPercent = totalLevels > 0 ? (completedCount / totalLevels) * 100 : 0;
        
        progressElement.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-400">Room Progress</span>
                <span class="text-sm text-green-400">${completedCount}/${totalLevels}</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-3">
                <div class="bg-green-600 h-3 rounded-full transition-all duration-300" 
                     style="width: ${progressPercent}%"></div>
            </div>
            <div class="mt-2 text-xs text-gray-500 text-center">
                ${Math.round(progressPercent)}% Complete
            </div>
        `;
    }
}

// Initialize if we're on a room navigation page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('level-grid') || document.querySelector('[data-room]')) {
        window.roomNavigation = new RoomNavigation();
    }
});
