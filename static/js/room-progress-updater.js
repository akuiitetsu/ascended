/**
 * Room Progress Updater
 * Handles real-time progress updates for game rooms
 */

class RoomProgressUpdater {
    constructor() {
        this.currentRoom = null;
        this.progressTracker = window.progressTracker;
        this.trackingActive = false;
        this.startTime = null;
        this.gameState = {
            puzzlesTotal: 0,
            puzzlesSolved: 0,
            challengesTotal: 0,
            challengesSolved: 0,
            secretsTotal: 0,
            secretsFound: 0,
            objectivesTotal: 0,
            objectivesCompleted: 0,
            explorationPercent: 0,
            hintsUsed: 0,
            deaths: 0,
            score: 0
        };
        
        this.init();
    }
    
    init() {
        // Set up event listeners for game events
        window.addEventListener('puzzleSolved', this.handlePuzzleSolved.bind(this));
        window.addEventListener('challengeCompleted', this.handleChallengeCompleted.bind(this));
        window.addEventListener('secretFound', this.handleSecretFound.bind(this));
        window.addEventListener('objectiveCompleted', this.handleObjectiveCompleted.bind(this));
        window.addEventListener('explorationUpdate', this.handleExplorationUpdate.bind(this));
        window.addEventListener('hintUsed', this.handleHintUsed.bind(this));
        window.addEventListener('playerDeath', this.handlePlayerDeath.bind(this));
        window.addEventListener('scoreUpdate', this.handleScoreUpdate.bind(this));
        
        // Set up listeners for room changes
        window.addEventListener('roomEntered', this.handleRoomEntered.bind(this));
        window.addEventListener('roomExited', this.handleRoomExited.bind(this));
        
        // Set up regular updates for time tracking
        this.updateInterval = setInterval(() => {
            if (this.trackingActive && this.currentRoom) {
                this.updateTimeSpent();
            }
        }, 10000); // Update every 10 seconds
        
        console.log('Room Progress Updater initialized');
    }
    
    handleRoomEntered(event) {
        const roomId = event.detail.roomId;
        this.currentRoom = roomId;
        this.trackingActive = true;
        this.startTime = Date.now();
        
        // Reset game state for the new room
        this.gameState = {
            puzzlesTotal: event.detail.puzzlesTotal || 0,
            puzzlesSolved: 0,
            challengesTotal: event.detail.challengesTotal || 0,
            challengesSolved: 0,
            secretsTotal: event.detail.secretsTotal || 0,
            secretsFound: 0,
            objectivesTotal: event.detail.objectivesTotal || 0,
            objectivesCompleted: 0,
            explorationPercent: 0,
            hintsUsed: 0,
            deaths: 0,
            score: 0
        };
        
        console.log(`Room Progress Tracking started for Room ${roomId}`, this.gameState);
        
        // Update room progress bars
        this.updateRoomProgressBar();
    }
    
    handleRoomExited(event) {
        if (!this.currentRoom) return;
        
        // Final update before exiting
        this.updateTimeSpent();
        this.sendProgressUpdate();
        
        this.trackingActive = false;
        console.log(`Room Progress Tracking stopped for Room ${this.currentRoom}`);
    }
    
    updateTimeSpent() {
        if (!this.startTime || !this.currentRoom) return;
        
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000); // Time in seconds
        
        // Update progress tracker with time spent
        if (this.progressTracker) {
            const roomProgress = this.progressTracker.getRoomProgress(this.currentRoom);
            roomProgress.timeSpent = (roomProgress.timeSpent || 0) + timeSpent;
            this.progressTracker.updateRoomProgress(this.currentRoom, roomProgress);
        }
        
        // Reset start time for next interval
        this.startTime = Date.now();
    }
    
    handlePuzzleSolved(event) {
        if (!this.trackingActive || !this.currentRoom) return;
        
        const puzzleId = event.detail.puzzleId;
        this.gameState.puzzlesSolved++;
        
        // Track event
        if (this.progressTracker) {
            this.progressTracker.trackGameEvent(this.currentRoom, 'puzzle_solved', {
                puzzle_id: puzzleId,
                puzzle_name: event.detail.puzzleName || `Puzzle ${puzzleId}`
            });
        }
        
        // Update progress bar
        this.updateRoomProgressBar();
    }
    
    handleChallengeCompleted(event) {
        if (!this.trackingActive || !this.currentRoom) return;
        
        const challengeId = event.detail.challengeId;
        this.gameState.challengesSolved++;
        
        // Track event
        if (this.progressTracker) {
            this.progressTracker.trackGameEvent(this.currentRoom, 'challenge_completed', {
                challenge_id: challengeId,
                challenge_name: event.detail.challengeName || `Challenge ${challengeId}`
            });
        }
        
        // Update progress bar
        this.updateRoomProgressBar();
    }
    
    handleSecretFound(event) {
        if (!this.trackingActive || !this.currentRoom) return;
        
        const secretId = event.detail.secretId;
        this.gameState.secretsFound++;
        
        // Track event
        if (this.progressTracker) {
            this.progressTracker.trackGameEvent(this.currentRoom, 'secret_found', {
                secret_id: secretId,
                secret_name: event.detail.secretName || `Secret ${secretId}`
            });
        }
        
        // Update progress bar
        this.updateRoomProgressBar();
    }
    
    handleObjectiveCompleted(event) {
        if (!this.trackingActive || !this.currentRoom) return;
        
        const objectiveId = event.detail.objectiveId;
        this.gameState.objectivesCompleted++;
        
        // Track event
        if (this.progressTracker) {
            this.progressTracker.trackGameEvent(this.currentRoom, 'objective_completed', {
                objective_id: objectiveId,
                objective_name: event.detail.objectiveName || `Objective ${objectiveId}`
            });
        }
        
        // Update progress bar
        this.updateRoomProgressBar();
    }
    
    handleExplorationUpdate(event) {
        if (!this.trackingActive || !this.currentRoom) return;
        
        const percentage = event.detail.percentage;
        this.gameState.explorationPercent = percentage;
        
        // Only track significant changes in exploration (>5%)
        if (Math.abs(percentage - (this.lastReportedExploration || 0)) >= 5) {
            this.lastReportedExploration = percentage;
            
            // Track event
            if (this.progressTracker) {
                this.progressTracker.trackGameEvent(this.currentRoom, 'exploration_update', {
                    percentage: percentage
                });
            }
            
            // Update progress bar
            this.updateRoomProgressBar();
        }
    }
    
    handleHintUsed(event) {
        if (!this.trackingActive || !this.currentRoom) return;
        
        this.gameState.hintsUsed++;
        
        // Track event
        if (this.progressTracker) {
            this.progressTracker.trackGameEvent(this.currentRoom, 'hint_used', {
                hint_id: event.detail.hintId,
                hint_context: event.detail.context
            });
        }
    }
    
    handlePlayerDeath(event) {
        if (!this.trackingActive || !this.currentRoom) return;
        
        this.gameState.deaths++;
        
        // Track event
        if (this.progressTracker) {
            this.progressTracker.trackGameEvent(this.currentRoom, 'death', {
                cause: event.detail.cause,
                location: event.detail.location
            });
        }
    }
    
    handleScoreUpdate(event) {
        if (!this.trackingActive || !this.currentRoom) return;
        
        const newScore = event.detail.score;
        this.gameState.score = newScore;
        
        // Update best score if needed
        if (this.progressTracker) {
            const roomProgress = this.progressTracker.getRoomProgress(this.currentRoom);
            if (newScore > (roomProgress.bestScore || 0)) {
                roomProgress.bestScore = newScore;
                this.progressTracker.updateRoomProgress(this.currentRoom, roomProgress);
            }
        }
    }
    
    updateRoomProgressBar() {
        // Calculate completion percentage based on game state
        let completionPercentage = this.calculateCompletionPercentage();
        
        // Update progress tracker
        if (this.progressTracker) {
            const roomProgress = this.progressTracker.getRoomProgress(this.currentRoom);
            roomProgress.percentage = Math.max(roomProgress.percentage || 0, completionPercentage);
            this.progressTracker.updateRoomProgress(this.currentRoom, roomProgress);
        }
        
        // Find and update room progress bar in the UI
        this.updateProgressBarInUI(completionPercentage);
        
        // Send progress update every few updates or on significant changes
        if (this.lastProgressSent === undefined || 
            Math.abs(completionPercentage - (this.lastProgressSent || 0)) >= 10 ||
            Date.now() - (this.lastProgressSendTime || 0) > 60000) {
            
            this.sendProgressUpdate();
            this.lastProgressSent = completionPercentage;
            this.lastProgressSendTime = Date.now();
        }
    }
    
    calculateCompletionPercentage() {
        // Calculate weighted completion percentage
        const weights = {
            puzzles: 35,      // 35% for puzzles
            challenges: 25,    // 25% for challenges
            objectives: 25,    // 25% for objectives
            exploration: 10,   // 10% for exploration
            secrets: 5         // 5% bonus for secrets
        };
        
        // Calculate component percentages
        const puzzlePct = this.gameState.puzzlesTotal > 0 
            ? (this.gameState.puzzlesSolved / this.gameState.puzzlesTotal) * 100 
            : 0;
            
        const challengePct = this.gameState.challengesTotal > 0 
            ? (this.gameState.challengesSolved / this.gameState.challengesTotal) * 100 
            : 0;
            
        const objectivePct = this.gameState.objectivesTotal > 0 
            ? (this.gameState.objectivesCompleted / this.gameState.objectivesTotal) * 100 
            : 0;
            
        const explorationPct = this.gameState.explorationPercent;
        
        const secretPct = this.gameState.secretsTotal > 0 
            ? (this.gameState.secretsFound / this.gameState.secretsTotal) * 100 
            : 0;
            
        // Calculate weighted average
        let completionPct = (
            (puzzlePct * weights.puzzles / 100) +
            (challengePct * weights.challenges / 100) +
            (objectivePct * weights.objectives / 100) +
            (explorationPct * weights.exploration / 100) +
            (secretPct * weights.secrets / 100)
        );
        
        // Cap at 100%
        return Math.min(100, Math.max(0, completionPct));
    }
    
    updateProgressBarInUI(percentage) {
        // Find progress bars in the UI
        const roomId = this.currentRoom;
        
        // Try different selectors for progress bars
        const progressSelectors = [
            `.room-progress-bar[data-room="${roomId}"]`,
            `.room-${roomId}-progress-bar`,
            `.room-card[data-room="${roomId}"] .progress-bar`,
            `#room-${roomId}-progress .progress-bar`
        ];
        
        let progressBar = null;
        for (const selector of progressSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                progressBar = element;
                break;
            }
        }
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            
            // Also try to update text displays
            const parentCard = progressBar.closest('.room-card') || progressBar.parentElement;
            if (parentCard) {
                const percentText = parentCard.querySelector('.progress-percent-text');
                if (percentText) {
                    percentText.textContent = `${Math.round(percentage)}%`;
                }
            }
        }
    }
    
    sendProgressUpdate() {
        if (!this.trackingActive || !this.currentRoom) return;
        
        // Calculate time spent since start
        const timeSpent = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        
        // Create progress data
        const progressData = {
            status: this.calculateCompletionPercentage() >= 95 ? 'completed' : 'in_progress',
            room_name: this.getRoomName(this.currentRoom),
            score: this.gameState.score,
            time_spent: timeSpent,
            total_puzzles: this.gameState.puzzlesTotal,
            puzzles_completed: this.gameState.puzzlesSolved,
            total_challenges: this.gameState.challengesTotal,
            challenges_solved: this.gameState.challengesSolved,
            total_secrets: this.gameState.secretsTotal,
            secrets_found: this.gameState.secretsFound,
            total_objectives: this.gameState.objectivesTotal,
            objectives_completed: this.gameState.objectivesCompleted,
            exploration_percentage: this.gameState.explorationPercent,
            hints_used: this.gameState.hintsUsed,
            deaths: this.gameState.deaths
        };
        
        // Update progress tracker
        if (this.progressTracker) {
            this.progressTracker.sendProgressUpdate(this.currentRoom, progressData);
        }
        
        // Reset start time for next interval
        this.startTime = Date.now();
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
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.roomProgressUpdater = new RoomProgressUpdater();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomProgressUpdater;
}
