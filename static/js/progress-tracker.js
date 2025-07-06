class ProgressTracker {
    constructor() {
        this.currentRoom = null;
        this.currentLevel = null;
        this.userProgress = {};
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    async init() {
        try {
            // Load progress from localStorage first for immediate availability
            this.loadProgressFromLocalStorage();
            
            // Then try to load from server and merge
            if (this.isOnline) {
                await this.loadProgressFromServer();
            }
            
            // Set up periodic syncing only if we have server connectivity
            if (this.isOnline) {
                this.startPeriodicSync();
            }
            
            // Set up event listeners
            this.setupUnloadHandlers();
            this.setupNetworkListeners();
            
            console.log('Progress tracker initialized', {
                room: this.currentRoom,
                level: this.currentLevel,
                totalLevels: Object.keys(this.userProgress).length
            });
        } catch (error) {
            console.error('Failed to initialize progress tracker:', error);
            // Fallback to localStorage only
            this.loadProgressFromLocalStorage();
        }
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Connection restored, attempting to sync progress...');
            this.syncProgress();
            if (!this.syncInterval) {
                this.startPeriodicSync();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Connection lost, using localStorage only');
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        });
    }

    async loadProgressFromServer() {
        if (!this.isOnline) {
            console.log('Offline mode: skipping server progress load');
            return false;
        }

        try {
            const response = await fetch('/api/user/progress', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data.status === 'success' && data.progress) {
                        // Merge server progress with local progress
                        this.mergeProgress(data.progress);
                        this.currentRoom = data.current_room || this.currentRoom || 1;
                        this.currentLevel = data.current_level || this.currentLevel || 1;
                        
                        console.log('Loaded progress from server');
                        return true;
                    }
                } else {
                    console.warn('Server returned non-JSON response for progress');
                }
            } else if (response.status === 404) {
                console.info('Progress API not available, using localStorage only');
            } else {
                console.warn(`Server returned ${response.status} for progress request`);
            }
        } catch (error) {
            console.warn('Could not load progress from server:', error.message);
        }
        return false;
    }

    loadProgressFromLocalStorage() {
        try {
            const savedProgress = localStorage.getItem('ascended_progress');
            const savedRoom = localStorage.getItem('ascended_current_room');
            const savedLevel = localStorage.getItem('ascended_current_level');
            
            if (savedProgress) {
                this.userProgress = JSON.parse(savedProgress);
            }
            
            this.currentRoom = savedRoom ? parseInt(savedRoom) : 1;
            this.currentLevel = savedLevel ? parseInt(savedLevel) : 1;
            
            console.log('Loaded progress from localStorage', {
                room: this.currentRoom,
                level: this.currentLevel,
                progressKeys: Object.keys(this.userProgress)
            });
        } catch (error) {
            console.warn('Could not load progress from localStorage:', error);
            // Initialize with defaults
            this.userProgress = {};
            this.currentRoom = 1;
            this.currentLevel = 1;
        }
    }

    mergeProgress(serverProgress) {
        for (const roomId in serverProgress) {
            if (!this.userProgress[roomId]) {
                this.userProgress[roomId] = {};
            }
            
            for (const levelId in serverProgress[roomId]) {
                const serverLevel = serverProgress[roomId][levelId];
                const localLevel = this.userProgress[roomId][levelId];
                
                // Use server data if local doesn't exist or server is newer
                if (!localLevel || 
                    (serverLevel.lastUpdated && 
                     (!localLevel.lastUpdated || serverLevel.lastUpdated > localLevel.lastUpdated))) {
                    this.userProgress[roomId][levelId] = serverLevel;
                }
            }
        }
    }

    saveProgressToLocalStorage() {
        try {
            localStorage.setItem('ascended_progress', JSON.stringify(this.userProgress));
            localStorage.setItem('ascended_current_room', this.currentRoom.toString());
            localStorage.setItem('ascended_current_level', this.currentLevel.toString());
            localStorage.setItem('ascended_last_save', Date.now().toString());
        } catch (error) {
            console.warn('Could not save progress to localStorage:', error);
        }
    }

    async saveProgressToServer() {
        if (!this.isOnline) {
            console.debug('Offline mode: skipping server sync');
            return false;
        }

        try {
            const response = await fetch('/api/user/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    progress: this.userProgress,
                    current_room: this.currentRoom,
                    current_level: this.currentLevel,
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        this.lastSyncTime = Date.now();
                        console.log('Progress synced to server');
                        return true;
                    }
                } else {
                    // Server returned HTML (likely an error page)
                    const text = await response.text();
                    if (text.includes('<!doctype') || text.includes('<html')) {
                        console.warn('Server returned HTML page instead of JSON API response');
                    }
                }
            } else if (response.status === 405) {
                console.warn('Progress sync endpoint not implemented (405 Method Not Allowed)');
            } else if (response.status === 404) {
                console.warn('Progress sync endpoint not found (404)');
            } else {
                console.warn(`Server returned ${response.status} for progress sync`);
            }
        } catch (error) {
            console.warn('Could not sync progress to server:', error.message);
        }
        return false;
    }

    async syncProgress() {
        // Always save to localStorage immediately
        this.saveProgressToLocalStorage();
        
        // Try to save to server only if online
        if (this.isOnline) {
            try {
                await this.saveProgressToServer();
            } catch (error) {
                console.debug('Server sync failed, continuing with localStorage:', error.message);
            }
        }
    }

    startPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Sync every 30 seconds, but only if online
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.syncProgress();
            }
        }, 30000);
    }

    setupUnloadHandlers() {
        // Save progress when page is being unloaded
        window.addEventListener('beforeunload', () => {
            this.saveProgressToLocalStorage();
        });

        // Save progress when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveProgressToLocalStorage();
            }
        });

        // Save progress on user activity
        let activityTimer;
        const resetActivityTimer = () => {
            clearTimeout(activityTimer);
            activityTimer = setTimeout(() => {
                this.syncProgress();
            }, 5000);
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetActivityTimer, { passive: true });
        });
    }

    setCurrentRoom(roomId) {
        this.currentRoom = parseInt(roomId);
        this.syncProgress();
        
        window.dispatchEvent(new CustomEvent('progressUpdate', {
            detail: { room: this.currentRoom, level: this.currentLevel }
        }));
    }

    setCurrentLevel(levelId) {
        this.currentLevel = parseInt(levelId);
        this.syncProgress();
        
        window.dispatchEvent(new CustomEvent('progressUpdate', {
            detail: { room: this.currentRoom, level: this.currentLevel }
        }));
    }

    setLevelProgress(roomId, levelId, progressData) {
        roomId = parseInt(roomId);
        levelId = parseInt(levelId);
        
        if (!this.userProgress[roomId]) {
            this.userProgress[roomId] = {};
        }
        
        this.userProgress[roomId][levelId] = {
            ...progressData,
            lastUpdated: Date.now()
        };
        
        this.syncProgress();
        
        window.dispatchEvent(new CustomEvent('levelProgressUpdate', {
            detail: { room: roomId, level: levelId, progress: progressData }
        }));
    }

    getLevelProgress(roomId, levelId) {
        roomId = parseInt(roomId);
        levelId = parseInt(levelId);
        
        return this.userProgress[roomId]?.[levelId] || null;
    }

    isLevelCompleted(roomId, levelId) {
        const progress = this.getLevelProgress(roomId, levelId);
        return progress?.completed === true;
    }

    isLevelUnlocked(roomId, levelId) {
        roomId = parseInt(roomId);
        levelId = parseInt(levelId);
        
        // Level 1 is always unlocked
        if (levelId === 1) return true;
        
        // Check if previous level is completed
        return this.isLevelCompleted(roomId, levelId - 1);
    }

    getCompletedLevelsCount(roomId) {
        roomId = parseInt(roomId);
        const roomProgress = this.userProgress[roomId] || {};
        
        return Object.values(roomProgress).filter(level => level.completed === true).length;
    }

    getRoomProgress(roomId) {
        roomId = parseInt(roomId);
        return this.userProgress[roomId] || {};
    }

    markLevelCompleted(roomId, levelId, completionData = {}) {
        this.setLevelProgress(roomId, levelId, {
            completed: true,
            completedAt: Date.now(),
            score: completionData.score || 0,
            attempts: completionData.attempts || 1,
            timeSpent: completionData.timeSpent || 0,
            ...completionData
        });
        
        // Auto-advance to next level if current
        const nextLevel = parseInt(levelId) + 1;
        if (this.currentRoom === roomId && this.currentLevel === levelId) {
            this.setCurrentLevel(nextLevel);
        }
    }

    restoreUserPosition() {
        return {
            room: this.currentRoom || 1,
            level: this.currentLevel || 1
        };
    }

    getProgressSummary() {
        const summary = {
            totalLevelsCompleted: 0,
            roomsProgress: {},
            currentPosition: {
                room: this.currentRoom || 1,
                level: this.currentLevel || 1
            }
        };
        
        for (const roomId in this.userProgress) {
            const completedCount = this.getCompletedLevelsCount(roomId);
            summary.totalLevelsCompleted += completedCount;
            summary.roomsProgress[roomId] = {
                completed: completedCount
            };
        }
        
        return summary;
    }

    resetProgress() {
        this.userProgress = {};
        this.currentRoom = 1;
        this.currentLevel = 1;
        
        localStorage.removeItem('ascended_progress');
        localStorage.removeItem('ascended_current_room');
        localStorage.removeItem('ascended_current_level');
        localStorage.removeItem('ascended_last_save');
        
        this.syncProgress();
        console.log('Progress reset');
    }

    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
}

// Initialize global progress tracker
window.progressTracker = new ProgressTracker();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressTracker;
}
