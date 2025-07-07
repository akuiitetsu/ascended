// Import managers
import { LevelManager } from './managers/level-manager.js';
import { CosmeticManager } from './managers/cosmetic-manager.js';
import { ModalManager } from './managers/modal-manager.js';
import { GameManager } from './managers/game-manager.js';
import { ProgressManager } from './managers/progress-manager.js';

class EscapeTheLabGame {
    constructor() {
        this.currentRoom = 1;
        this.totalRooms = 5;
        this.gameActive = false;
        this.gameStarted = false;
        this.inRoom = false; // Track if we're currently in a room
        this.sessionId = this.generateSessionId();
        
        // Initialize managers
        this.levelManager = new LevelManager(this);
        this.cosmeticManager = new CosmeticManager(this);
        this.modalManager = new ModalManager(this);
        this.gameManager = new GameManager(this);
        this.progressManager = new ProgressManager(this);
        
        // Initialize tutorial manager from level manager
        this.tutorialManager = this.levelManager.tutorialManager;
        
        // Player character system
        this.player = {
            name: "Agent",
            level: 1,
            roomsCompleted: 0,
            cosmetics: {
                suit: 'basic',
                helmet: 'none',
                gloves: 'basic',
                badge: 'none',
                weapon: 'none'
            },
            unlockedCosmetics: ['basic-suit', 'basic-gloves']
        };
        
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async init() {
        // Check if user is authenticated
        const userStatus = await this.checkUserAuthentication();
        
        if (userStatus.authenticated) {
            // Load saved progress and cosmetics
            await this.loadSavedProgress();
            this.cosmeticManager.loadPlayerData();
            
            // Check if game was previously started
            const gameState = this.getGameState();
            if (gameState.gameStarted && gameState.currentRoom) {
                // User was in middle of game - restore state
                this.restoreGameState(gameState);
            }
        }
        
        console.log('AscendEd: Tech Lab Breakout initialized');
        this.setupTutorialButton();
        this.setupWaveNavigation(); // Add this line
    }

    async checkUserAuthentication() {
        try {
            const response = await fetch('/api/auth/user');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.currentUser = data.user;
                return { authenticated: true, user: data.user };
            }
            return { authenticated: false };
        } catch (error) {
            console.warn('Failed to check authentication:', error);
            return { authenticated: false };
        }
    }

    async loadSavedProgress() {
        try {
            // Load from server if authenticated
            if (this.currentUser) {
                const response = await fetch(`/api/load_progress/${this.sessionId}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    this.currentRoom = data.level || 1;
                    this.player.roomsCompleted = Math.max(0, data.level - 1);
                    
                    // Merge any additional progress data
                    if (data.progress) {
                        Object.assign(this.player, data.progress);
                    }
                    
                    console.log(`Loaded server progress: Room ${this.currentRoom}, ${this.player.roomsCompleted} completed`);
                    return;
                }
            }
            
            // Fallback to local storage
            const localProgress = localStorage.getItem('ascended_progress');
            if (localProgress) {
                const progress = JSON.parse(localProgress);
                this.currentRoom = progress.currentRoom || 1;
                this.player.roomsCompleted = progress.roomsCompleted || 0;
                this.player.level = progress.level || 1;
                
                console.log(`Loaded local progress: Room ${this.currentRoom}, ${this.player.roomsCompleted} completed`);
            }
        } catch (error) {
            console.warn('Failed to load saved progress:', error);
        }
    }

    async saveProgress() {
        const progressData = {
            currentRoom: this.currentRoom,
            roomsCompleted: this.player.roomsCompleted,
            level: this.player.level,
            gameStarted: this.gameStarted,
            inRoom: this.inRoom,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            playerData: {
                ...this.player,
                cosmetics: this.player.cosmetics
            }
        };

        // Save to local storage immediately
        localStorage.setItem('ascended_progress', JSON.stringify(progressData));
        this.saveGameState(progressData);

        // Save to server if authenticated
        if (this.currentUser) {
            try {
                const response = await fetch('/api/save_progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: this.sessionId,
                        level: this.currentRoom,
                        progress: progressData
                    })
                });

                const result = await response.json();
                if (result.status === 'success') {
                    console.log('Progress saved to server successfully');
                } else {
                    console.warn('Failed to save progress to server:', result.message);
                }
            } catch (error) {
                console.warn('Failed to save progress to server:', error);
            }
        }
    }

    saveGameState(state) {
        // Save current game state to session storage (survives page refresh)
        sessionStorage.setItem('ascended_game_state', JSON.stringify(state));
    }

    getGameState() {
        try {
            const state = sessionStorage.getItem('ascended_game_state');
            return state ? JSON.parse(state) : {};
        } catch (error) {
            console.warn('Failed to get game state:', error);
            return {};
        }
    }

    restoreGameState(gameState) {
        this.currentRoom = gameState.currentRoom || 1;
        this.gameStarted = gameState.gameStarted || false;
        this.inRoom = gameState.inRoom || false;
        this.player.roomsCompleted = gameState.roomsCompleted || 0;
        
        if (gameState.playerData) {
            Object.assign(this.player, gameState.playerData);
        }

        // If game was started, skip welcome screen and restore game UI
        if (this.gameStarted) {
            this.showGameInterface();
            
            // Load the current room if we were in one
            if (this.inRoom && this.currentRoom) {
                setTimeout(() => {
                    this.loadRoom(this.currentRoom);
                }, 100);
            }
        }

        console.log(`Restored game state: Room ${this.currentRoom}, Started: ${this.gameStarted}, In Room: ${this.inRoom}`);
    }

    showGameInterface() {
        // Hide welcome screen and show game interface
        const welcomeScreen = document.getElementById('welcome-screen');
        const gameHeader = document.getElementById('game-header');
        const gameMain = document.getElementById('game-main');
        
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (gameHeader) gameHeader.classList.remove('hidden');
        if (gameMain) gameMain.classList.remove('hidden');
        
        // Update room indicator
        const roomIndicator = document.getElementById('current-room');
        if (roomIndicator) {
            roomIndicator.textContent = this.currentRoom;
        }
        
        this.gameActive = true;
    }
    
    setupTutorialButton() {
        const tutorialBtn = document.getElementById('show-tutorial-btn');
        if (tutorialBtn) {
            tutorialBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Tutorial button clicked, showing tutorial for room:', this.currentRoom);
                this.showTutorial(this.currentRoom);
            });
            console.log('Tutorial button event listener added');
        } else {
            console.warn('Tutorial button not found in DOM');
        }
    }
    
    showTutorial(roomNumber = null) {
        const room = roomNumber || this.currentRoom || 1;
        console.log('Showing tutorial for room:', room);
        
        if (this.tutorialManager) {
            this.tutorialManager.showTutorial(room);
        } else {
            console.error('Tutorial manager not available');
            // Fallback
            import('./managers/tutorial-manager.js').then(module => {
                const tutorialManager = new module.TutorialManager();
                tutorialManager.showTutorial(room);
            });
        }
    }

    async roomCompleted(message, roomData = {}) {
        try {
            // Update progress
            this.player.roomsCompleted++;
            this.currentRoom = Math.min(this.currentRoom + 1, this.totalRooms);
            
            // Prepare comprehensive progress data
            const progressData = {
                room_name: `Room ${this.currentRoom - 1}`,
                status: 'completed',
                completion_percentage: 100,
                completion_status: 'completed',
                score: roomData.score || 100,
                time_spent: roomData.timeSpent || Date.now() - (this.progressManager.roomStartTime || this.progressManager.sessionStartTime),
                room_data: {
                    ...roomData,
                    completed_at: new Date().toISOString(),
                    message: message
                }
            };
            
            // Save progress immediately
            await this.saveProgress();
            
            // Save to progress manager if available
            if (this.progressManager) {
                await this.progressManager.saveProgress(this.currentRoom - 1, progressData);
            }
            
            // Update cosmetics and save
            this.cosmeticManager.unlockCosmetics();
            this.cosmeticManager.savePlayerData();
            
            // Check if all rooms are completed
            if (this.player.roomsCompleted >= this.totalRooms) {
                this.gameWon();
            } else {
                this.modalManager.showSuccessModal(message);
            }
        } catch (error) {
            console.error('Failed to save room completion:', error);
            // Still show success modal even if save failed
            this.modalManager.showSuccessModal(message + ' (Progress saved locally)');
        }
    }

    async loadUserProgress() {
        // This method is kept for compatibility but now handled in loadSavedProgress
        await this.loadSavedProgress();
    }

    async loadRoom(roomNumber) {
        try {
            this.inRoom = true;
            this.gameActive = true;
            this.gameStarted = true;
            this.currentRoom = roomNumber;
            
            // Update UI
            const roomIndicator = document.getElementById('current-room');
            if (roomIndicator) {
                roomIndicator.textContent = roomNumber;
            }
            
            // Save progress immediately when entering room
            await this.saveProgress();
            
            // Update progress tracker current room
            if (window.progressTracker) {
                window.progressTracker.setCurrentRoom(roomNumber);
            }
            
            // Track room entry if progress manager is available
            if (this.progressManager && typeof this.progressManager.enterRoom === 'function') {
                this.progressManager.enterRoom(roomNumber);
            }
            
            await this.levelManager.loadRoom(roomNumber);
            console.log(`Successfully loaded room ${roomNumber}`);
        } catch (error) {
            console.error('Failed to load room:', error);
            this.inRoom = false;
            this.gameActive = false;
            
            // Show error message to user
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed top-4 right-4 bg-red-800 text-red-200 p-3 rounded z-50';
            errorMessage.textContent = `Failed to load room ${roomNumber}. Please try again.`;
            document.body.appendChild(errorMessage);
            setTimeout(() => errorMessage.remove(), 5000);
        }
    }

    // Add method to start game (called from start button)
    async startGame() {
        this.gameStarted = true;
        this.showGameInterface();
        
        // Save that game has been started
        await this.saveProgress();
        
        // Load the current room (or room 1 if starting fresh)
        await this.loadRoom(this.currentRoom);
    }

    // Add method to show tutorial for current room
    showRoomTutorial() {
        if (this.inRoom && this.currentRoom && this.tutorialManager) {
            try {
                this.tutorialManager.showTutorial(this.currentRoom);
            } catch (error) {
                console.error('Failed to show tutorial:', error);
                
                // Show fallback message
                const message = document.createElement('div');
                message.className = 'fixed top-4 right-4 bg-yellow-800 text-yellow-200 p-3 rounded z-50';
                message.textContent = 'Tutorial system temporarily unavailable. Please try again.';
                document.body.appendChild(message);
                setTimeout(() => message.remove(), 3000);
            }
        } else {
            console.warn('Cannot show tutorial: not currently in a room or tutorial manager not available');
        }
    }

    showCosmeticMenu() {
        this.cosmeticManager.showCosmeticMenu();
    }

    async gameWon() {
        this.inRoom = false;
        this.gameActive = false;
        
        // Save final completion state
        await this.saveProgress();
        
        const victoryContent = this.modalManager.showVictoryContent();
        document.getElementById('room-content').innerHTML = victoryContent;
    }

    gameOver(message) {
        this.inRoom = false;
        this.gameActive = false;
        this.modalManager.showGameOverModal(message);
    }

    async nextRoom() {
        if (this.currentRoom < this.totalRooms) {
            await this.loadRoom(this.currentRoom + 1);
        } else {
            this.gameWon();
        }
    }

    async restart() {
        // Reset game state
        this.player.roomsCompleted = 0;
        this.currentRoom = 1;
        this.inRoom = false;
        this.gameActive = false;
        this.gameStarted = true; // Keep game started to stay in game interface
        
        // Clear saved progress
        localStorage.removeItem('ascended_progress');
        sessionStorage.removeItem('ascended_game_state');
        
        // Save reset state
        await this.saveProgress();
        
        // Load room 1
        await this.loadRoom(1);
    }

    // Enhanced cleanup method
    async cleanup() {
        // Save final progress before cleanup
        await this.saveProgress();
        
        if (this.progressManager) {
            this.progressManager.cleanup();
        }
    }

    setupEventListeners() {
        document.getElementById('next-room-btn').addEventListener('click', () => {
            this.gameManager.nextRoom();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.gameManager.restartGame();
        });
        
        // Add character menu button listener
        const characterMenuBtn = document.getElementById('character-menu-btn');
        if (characterMenuBtn) {
            characterMenuBtn.addEventListener('click', () => {
                this.cosmeticManager.showCosmeticMenu();
            });
        }
        
        // Add fullscreen toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11' && this.gameActive) {
                e.preventDefault();
                this.gameManager.toggleFullscreen();
            }
        });
    }

    setupWaveNavigation() {
        // Set up wave navigation buttons
        document.querySelectorAll('.wave-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomNumber = parseInt(e.currentTarget.dataset.room);
                console.log(`Wave navigation: Jumping to Room ${roomNumber}`);
                
                // Stop current room before loading new one
                if (this.levelManager) {
                    this.levelManager.stopCurrentRoom();
                }
                
                // Load the new room
                this.loadRoom(roomNumber);
            });
        });
        
        console.log('Wave navigation buttons configured');
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing game...');
    window.game = new EscapeTheLabGame();
    
    // Enhanced start game button functionality
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', async () => {
            await window.game.startGame();
        });
    }
    
    // Setup room navigation immediately
    setupGlobalRoomNavigation();
    
    // Additional tutorial button setup as backup
    setTimeout(() => {
        const tutorialBtn = document.getElementById('show-tutorial-btn');
        if (tutorialBtn && !tutorialBtn.hasAttribute('data-listener-added')) {
            tutorialBtn.addEventListener('click', () => {
                console.log('Backup tutorial button clicked');
                if (window.game && window.game.showTutorial) {
                    window.game.showTutorial();
                } else if (window.game && window.game.tutorialManager) {
                    window.game.tutorialManager.showTutorial(window.game.currentRoom || 1);
                }
            });
            tutorialBtn.setAttribute('data-listener-added', 'true');
        }
    }, 100);
});

// Global function to setup room navigation (works even if game isn't fully loaded)
function setupGlobalRoomNavigation() {
    document.querySelectorAll('.wave-nav-btn').forEach(btn => {
        // Remove any existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            const roomNumber = parseInt(e.currentTarget.dataset.room);
            console.log(`Global navigation: Jumping to Room ${roomNumber}`);
            
            // Try multiple navigation methods
            if (window.game && window.game.loadRoom) {
                // Stop current room if possible
                if (window.game.levelManager && window.game.levelManager.stopCurrentRoom) {
                    window.game.levelManager.stopCurrentRoom();
                }
                window.game.loadRoom(roomNumber);
            } else {
                // Fallback: direct URL navigation
                window.location.href = `/room/${roomNumber}/level/1`;
            }
        });
    });
    
    console.log('Global room navigation configured');
}

// Initialize the game
const game = new EscapeTheLabGame();
window.game = game;

// Enhanced page unload handler
window.addEventListener('beforeunload', async () => {
    if (window.game) {
        await window.game.cleanup();
    }
});

// Handle visibility change to save progress when tab becomes hidden
document.addEventListener('visibilitychange', async () => {
    if (document.hidden && window.game) {
        await window.game.saveProgress();
    }
});

// Periodic progress saving (every 30 seconds)
setInterval(async () => {
    if (window.game && window.game.gameStarted) {
        await window.game.saveProgress();
    }
}, 30000);

// Set up event listeners for modals
document.addEventListener('DOMContentLoaded', () => {
    const nextRoomBtn = document.getElementById('next-room-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    if (nextRoomBtn) {
        nextRoomBtn.addEventListener('click', async () => {
            if (window.game) {
                window.game.modalManager.hideSuccessModal();
                await window.game.nextRoom();
            }
        });
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', async () => {
            if (window.game) {
                await window.game.restart();
            }
        });
    }
});

export { EscapeTheLabGame };
