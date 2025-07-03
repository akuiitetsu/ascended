export class ProgressManager {
    constructor(game) {
        this.game = game;
        this.sessionId = null;
        this.sessionStartTime = Date.now();
        this.actionsCount = 0;
        this.visitedRooms = new Set();
        this.localProgress = this.loadLocalProgress();
        this.syncInProgress = false;
        this.autoSaveInterval = null;
        this.userId = null; // Track current user
        this.lastSyncTime = 0;
        
        // Initialize user-specific tracking
        this.initializeUserTracking();
        
        // Start session tracking
        this.startSession();
        
        // Auto-save progress every 30 seconds
        this.startAutoSave();
        
        // Sync on page load after short delay
        setTimeout(() => this.syncProgress(), 2000);
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.endSession();
            this.saveLocalProgress();
        });
    }

    async initializeUserTracking() {
        try {
            // Get current user info from server
            const response = await fetch('/api/auth/user');
            const result = await response.json();
            
            if (result.status === 'success') {
                this.userId = result.user.username; // Use username as stable identifier
                this.userEmail = result.user.email;
                
                // Load user-specific local progress
                this.localProgress = this.loadUserSpecificProgress();
                
                console.log(`Progress tracking initialized for user: ${this.userId}`);
            } else {
                console.warn('User not authenticated, using guest progress tracking');
                this.userId = 'guest_' + this.getBrowserSessionId();
            }
        } catch (error) {
            console.warn('Failed to initialize user tracking:', error);
            this.userId = 'guest_' + this.getBrowserSessionId();
        }
    }

    loadUserSpecificProgress() {
        try {
            const allProgress = localStorage.getItem('ascended_all_user_progress');
            const parsedProgress = allProgress ? JSON.parse(allProgress) : {};
            
            // Return progress for current user, or empty object
            return parsedProgress[this.userId] || {};
        } catch (error) {
            console.warn('Failed to load user-specific progress:', error);
            return {};
        }
    }

    saveUserSpecificProgress() {
        try {
            // Load all users' progress
            const allProgress = localStorage.getItem('ascended_all_user_progress');
            const parsedProgress = allProgress ? JSON.parse(allProgress) : {};
            
            // Update current user's progress
            parsedProgress[this.userId] = this.localProgress;
            
            // Save back to localStorage
            localStorage.setItem('ascended_all_user_progress', JSON.stringify(parsedProgress));
            
            // Also save under legacy key for backward compatibility
            localStorage.setItem('ascended_user_progress', JSON.stringify(this.localProgress));
        } catch (error) {
            console.warn('Failed to save user-specific progress:', error);
        }
    }

    async startSession() {
        try {
            const response = await fetch('/api/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: this.detectPlatform(),
                    browser: this.detectBrowser()
                })
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                this.sessionId = result.session_id;
                console.log('Session started:', this.sessionId);
            }
        } catch (error) {
            console.warn('Failed to start session:', error);
        }
    }

    async endSession() {
        if (this.sessionId) {
            try {
                await fetch(`/api/session/${this.sessionId}/end`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log('Session ended:', this.sessionId);
            } catch (error) {
                console.warn('Failed to end session:', error);
            }
        }
    }

    async saveProgress(roomNumber, progressData) {
        this.actionsCount++;
        this.visitedRooms.add(roomNumber);
        
        // Ensure we have user context
        if (!this.userId) {
            await this.initializeUserTracking();
        }
        
        // Add comprehensive session metadata
        const enhancedProgress = {
            ...progressData,
            room_number: roomNumber,
            progress_data: {
                ...progressData,
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                user_id: this.userId,
                actions_count: this.actionsCount,
                time_in_room: Date.now() - (this.roomStartTime || this.sessionStartTime),
                browser_session: this.getBrowserSessionId(),
                platform: this.detectPlatform(),
                total_session_time: Date.now() - this.sessionStartTime,
                rooms_visited_count: this.visitedRooms.size
            }
        };

        // Save locally first with user-specific storage
        this.localProgress[roomNumber] = enhancedProgress.progress_data;
        this.saveUserSpecificProgress();

        // Save to server with retry logic
        return this.saveToServerWithRetry(enhancedProgress);
    }

    async saveToServerWithRetry(progressData, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch('/api/progress/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(progressData)
                });

                const result = await response.json();
                if (result.status === 'success') {
                    console.log(`Progress saved for room ${progressData.room_number}:`, result);
                    this.showProgressFeedback('✓ Progress saved to server', 'success');
                    return result;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error(`Save attempt ${attempt} failed:`, error);
                
                if (attempt === retries) {
                    // Final attempt failed
                    this.showProgressFeedback('⚠ Saved locally only (server unavailable)', 'warning');
                    return { status: 'error', message: error.message };
                } else {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
    }

    async loadProgress(roomNumber = null) {
        try {
            const url = roomNumber ? `/api/progress/load/${roomNumber}` : '/api/progress/load';
            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success') {
                console.log('Server progress loaded:', result.progress);
                
                // Update local cache with server data
                if (result.progress && Array.isArray(result.progress)) {
                    // Server returned all rooms progress
                    result.progress.forEach(roomProgress => {
                        this.localProgress[roomProgress.room_number] = roomProgress;
                    });
                } else if (result.progress && roomNumber) {
                    // Server returned specific room progress
                    this.localProgress[roomNumber] = result.progress;
                }
                
                this.saveUserSpecificProgress();
                return result.progress;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.warn('Failed to load server progress, using local:', error);
            
            // Return local progress
            if (roomNumber) {
                return this.localProgress[roomNumber] || null;
            } else {
                return Object.values(this.localProgress);
            }
        }
    }

    async syncProgress() {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        try {
            // Ensure we have user context
            if (!this.userId) {
                await this.initializeUserTracking();
            }
            
            const response = await fetch('/api/progress/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    local_progress: this.localProgress,
                    browser_session: this.getBrowserSessionId(),
                    sync_timestamp: new Date().toISOString(),
                    user_id: this.userId,
                    last_sync: this.lastSyncTime
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                // Update local progress with synced data
                this.localProgress = result.synced_progress || this.localProgress;
                this.saveUserSpecificProgress();
                this.lastSyncTime = Date.now();
                
                if (result.conflicts_resolved > 0) {
                    this.showProgressFeedback(
                        `🔄 Synced progress (${result.conflicts_resolved} conflicts resolved)`, 
                        'info'
                    );
                } else {
                    console.log('Progress synchronized successfully');
                }
                
                return result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to sync progress:', error);
            this.showProgressFeedback('⚠ Sync failed - using local progress', 'warning');
        } finally {
            this.syncInProgress = false;
        }
    }

    async getAchievements() {
        try {
            const response = await fetch('/api/achievements');
            const result = await response.json();

            if (result.status === 'success') {
                return result.achievements;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to load achievements:', error);
            return [];
        }
    }

    async getStatistics() {
        try {
            const response = await fetch('/api/statistics');
            const result = await response.json();

            if (result.status === 'success') {
                return result.statistics;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
            return null;
        }
    }

    enterRoom(roomNumber) {
        this.roomStartTime = Date.now();
        this.visitedRooms.add(roomNumber);
        
        // Auto-save current progress when entering new room
        if (this.localProgress[roomNumber]) {
            this.saveProgress(roomNumber, {
                ...this.localProgress[roomNumber],
                last_accessed: new Date().toISOString(),
                room_entries: (this.localProgress[roomNumber].room_entries || 0) + 1
            });
        }
        
        // Update session with room visit
        if (this.sessionId) {
            this.updateSession();
        }
    }

    async updateSession() {
        if (!this.sessionId) return;
        
        try {
            await fetch(`/api/session/${this.sessionId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rooms_visited: Array.from(this.visitedRooms),
                    actions_count: this.actionsCount
                })
            });
        } catch (error) {
            console.warn('Failed to update session:', error);
        }
    }

    startAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveUserSpecificProgress();
            
            // Sync with server every 2 minutes
            if (Date.now() - this.lastSyncTime > 120000) {
                this.syncProgress();
            }
        }, 30000);
    }

    loadLocalProgress() {
        try {
            // Try user-specific progress first
            if (this.userId) {
                return this.loadUserSpecificProgress();
            }
            
            // Fallback to legacy progress
            const saved = localStorage.getItem('ascended_user_progress');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load local progress:', error);
            return {};
        }
    }

    saveLocalProgress() {
        this.saveUserSpecificProgress();
    }

    getBrowserSessionId() {
        let sessionId = sessionStorage.getItem('browser_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('browser_session_id', sessionId);
        }
        return sessionId;
    }

    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
            return 'mobile';
        } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    detectBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    showProgressFeedback(message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `fixed bottom-4 left-4 z-50 px-3 py-2 rounded text-sm ${
            type === 'success' ? 'bg-green-800 text-green-200' :
            type === 'warning' ? 'bg-yellow-800 text-yellow-200' :
            type === 'error' ? 'bg-red-800 text-red-200' :
            'bg-blue-800 text-blue-200'
        }`;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }

    getRoomProgress(roomNumber) {
        return this.localProgress[roomNumber] || null;
    }

    getAllProgress() {
        return { ...this.localProgress };
    }

    getUserId() {
        return this.userId;
    }

    // Method to handle user switching (logout/login)
    switchUser(newUserId) {
        // Save current user's progress
        this.saveUserSpecificProgress();
        
        // End current session
        this.endSession();
        
        // Switch to new user
        this.userId = newUserId;
        this.localProgress = this.loadUserSpecificProgress();
        
        // Start new session
        this.startSession();
        
        console.log(`Switched to user: ${newUserId}`);
    }

    cleanup() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.saveUserSpecificProgress();
        this.endSession();
    }
}

