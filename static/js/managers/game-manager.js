export class GameManager {
    constructor(game) {
        this.game = game;
    }

    startGame() {
        console.log('Starting game...');
        this.game.gameActive = true;
        this.game.gameStarted = true;
        
        // Enable tutorial button when game starts
        const tutorialBtn = document.getElementById('show-tutorial-btn');
        if (tutorialBtn) {
            tutorialBtn.disabled = false;
        }
        
        // Load first room without showing tutorial automatically
        this.game.levelManager.loadRoom(1);
        
        // Set up game state monitoring
        this.setupGameStateMonitoring();
        
        // Set up tutorial button functionality
        this.setupTutorialButton();
        
        console.log('✓ Game started successfully');
    }

    async roomCompleted(message, completionData = {}) {
        // Enhanced room completion with badge system integration
        console.log(`Room ${this.game.currentRoom} completed:`, message);
        
        // Initialize badge manager if not exists
        if (!this.game.badgeManager) {
            const { BadgeManager } = await import('./badge-manager.js');
            this.game.badgeManager = new BadgeManager(this.game);
        }

        // Update player progress
        if (!Array.isArray(this.game.player.unlockedCosmetics)) {
            this.game.player.unlockedCosmetics = [];
        }
        this.game.player.roomsCompleted++;
        
        // Unlock cosmetics for this room (handled by cosmetic manager)
        this.game.cosmeticManager.unlockCosmetics();
        
        // Check and award badges for room completion using badge manager
        const roomCompletionData = {
            roomNumber: this.game.currentRoom,
            message: message,
            score: completionData.score || 100,
            timeSpent: completionData.timeSpent || 0,
            hintsUsed: completionData.hintsUsed || 0,
            attempts: completionData.attempts || 1,
            isFirstCompletion: this.game.player.roomsCompleted === this.game.currentRoom,
            ...completionData
        };

        try {
            // Award badges using the dedicated badge manager
            const earnedBadges = await this.game.badgeManager.checkAndAwardRoomBadges(
                this.game.currentRoom, 
                roomCompletionData
            );
            
            console.log(`Earned ${earnedBadges.length} badges for room completion`);
            
            // Show success modal after badge rewards
            setTimeout(() => {
                if (this.game.currentRoom === this.game.totalRooms) {
                    this.gameWon();
                } else {
                    this.game.modalManager.showSuccessModal(message);
                }
            }, earnedBadges.length > 0 ? 3000 : 0); // Delay if badges were shown
            
        } catch (error) {
            console.error('Error in badge checking:', error);
            // Continue with normal flow even if badge system fails
            if (this.game.currentRoom === this.game.totalRooms) {
                this.gameWon();
            } else {
                this.game.modalManager.showSuccessModal(message);
            }
        }
    }

    nextRoom() {
        this.game.modalManager.hideSuccessModal();
        this.game.levelManager.stopCurrentRoom();
        this.game.levelManager.loadRoom(this.game.currentRoom + 1);
    }

    pauseGame(reason) {
        this.game.modalManager.showPauseOverlay(reason);
    }

    resumeGame() {
        this.game.modalManager.hidePauseOverlay();
    }

    gameWon() {
        this.game.gameActive = false;
        
        document.getElementById('room-content').innerHTML = this.game.modalManager.showVictoryContent();
        
        this.game.player.level++;
        this.game.cosmeticManager.savePlayerData();
    }

    gameOver(message) {
        this.game.gameActive = false;
        
        this.game.modalManager.showGameOverModal(message);
    }

    restartGame() {
        // Reset all game state
        this.game.currentRoom = 1;
        this.game.gameActive = false;
        this.game.gameStarted = false;
        
        // Disable tutorial button during restart
        const tutorialBtn = document.getElementById('show-tutorial-btn');
        if (tutorialBtn) {
            tutorialBtn.disabled = true;
        }
        
        // Stop current room
        this.game.levelManager.stopCurrentRoom();
        
        // Clear room content
        document.getElementById('room-content').innerHTML = `
            <div class="loading text-center">
                <i class="bi bi-gear-fill animate-spin text-4xl text-yellow-400"></i>
                <p class="mt-4">Restarting systems...</p>
            </div>
        `;
        
        // Restart after brief delay
        setTimeout(() => {
            this.startGame();
        }, 1000);
    }

    enableFullscreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.enableFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    setupTutorialButton() {
        const tutorialBtn = document.getElementById('show-tutorial-btn');
        if (tutorialBtn) {
            tutorialBtn.addEventListener('click', () => {
                // Get current room number
                const currentRoom = this.game ? this.game.currentRoom : 1;
                this.showTutorial(currentRoom);
            });
        }
    }
    
    showTutorial(roomNumber = 1) {
        // Try multiple ways to access tutorial manager
        if (this.game && this.game.levelManager && this.game.levelManager.tutorialManager) {
            this.game.levelManager.tutorialManager.showTutorial(roomNumber);
        } else if (this.game && this.game.tutorialManager) {
            this.game.tutorialManager.showTutorial(roomNumber);
        } else if (window.game && window.game.tutorialManager) {
            window.game.tutorialManager.showTutorial(roomNumber);
        } else {
            // Fallback: create new instance
            const tutorialManager = new (window.TutorialManager || TutorialManager)();
            tutorialManager.showTutorial(roomNumber);
        }
    }
}