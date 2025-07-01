// Import managers
import { LevelManager } from './managers/level-manager.js';
import { CosmeticManager } from './managers/cosmetic-manager.js';
import { ModalManager } from './managers/modal-manager.js';
import { GameManager } from './managers/game-manager.js';

export class EscapeTheLabGame {
    constructor() {
        this.currentRoom = 1;
        this.roomInstances = new Map();
        this.gameHistory = [];
        this.isGameActive = false;
        this.completedRooms = new Set();
        
        // Initialize managers
        this.levelManager = new LevelManager(this);
        this.cosmeticManager = new CosmeticManager(this);
        this.modalManager = new ModalManager(this);
        this.gameManager = new GameManager(this);
        
        // Initialize tutorial modal
        import('./tutorial-modal.js').then(module => {
            this.tutorialModal = new module.TutorialModal();
        }).catch(error => {
            console.warn('Could not load tutorial modal:', error);
        });
    }

    init() {
        this.cosmeticManager.loadPlayerData(); // Load player data before starting
        this.setupEventListeners();
        this.gameManager.startGame();
        
        // Set up wave navigation after game initialization
        this.setupWaveNavigation();
    }

    setupEventListeners() {
        document.getElementById('next-room-btn')?.addEventListener('click', () => {
            this.gameManager.nextRoom();
        });
        
        document.getElementById('restart-btn')?.addEventListener('click', () => {
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
                this.levelManager.stopCurrentRoom(); // Stop current room before loading new one
                this.levelManager.loadRoom(roomNumber);
            });
        });
        
        console.log('Wave navigation buttons configured');
    }

    async loadRoom(roomNumber, showTutorial = true) {
        console.log(`Loading Room ${roomNumber}...`);
        
        // Show tutorial if requested and not seen before
        if (showTutorial && this.tutorialModal) {
            this.tutorialModal.showTutorial(roomNumber);
        }
        
        // Update current room tracking
        this.currentRoom = roomNumber;
        const currentRoomElement = document.getElementById('current-room');
        if (currentRoomElement) {
            currentRoomElement.textContent = roomNumber;
        }
        
        // Cleanup previous room
        if (this.currentRoomInstance && this.currentRoomInstance.cleanup) {
            this.currentRoomInstance.cleanup();
        }
        
        // Create or get room instance
        let roomInstance = this.roomInstances.get(roomNumber);
        if (!roomInstance) {
            roomInstance = await this.createRoomInstance(roomNumber);
            if (roomInstance) {
                this.roomInstances.set(roomNumber, roomInstance);
            }
        }
        
        if (roomInstance) {
            this.currentRoomInstance = roomInstance;
            
            // Initialize or re-render the room
            if (roomInstance.init) {
                await roomInstance.init();
            } else if (roomInstance.render) {
                roomInstance.render();
            }
            
            this.updateRoomIndicators(roomNumber);
            console.log(`Room ${roomNumber} loaded successfully`);
        } else {
            console.error(`Failed to load Room ${roomNumber}`);
            this.showMessage(`Failed to load Room ${roomNumber}`, 'error');
        }
    }

    async createRoomInstance(roomNumber) {
        try {
            let roomModule;
            let RoomClass;
            
            switch(roomNumber) {
                case 1:
                    roomModule = await import('./networking/networking.js');
                    RoomClass = roomModule.Room1;
                    break;
                case 2:
                    roomModule = await import('./cloudscale/cloudscale.js');
                    RoomClass = roomModule.Room2;
                    break;
                case 3:
                    roomModule = await import('./ai-systems/ai-systems.js');
                    RoomClass = roomModule.Room3;
                    break;
                case 4:
                    roomModule = await import('./database-crisis/database-crisis.js');
                    RoomClass = roomModule.Room4;
                    break;
                case 5:
                    roomModule = await import('./programming-crisis/programming-crisis.js');
                    RoomClass = roomModule.Room5;
                    break;
                default:
                    console.error(`Invalid room number: ${roomNumber}`);
                    return null;
            }
            
            if (RoomClass) {
                const instance = new RoomClass(this);
                console.log(`Created Room ${roomNumber} instance:`, instance);
                return instance;
            } else {
                console.error(`Room class not found for Room ${roomNumber}`);
                return null;
            }
        } catch (error) {
            console.error(`Failed to load Room ${roomNumber}:`, error);
            return null;
        }
    }

    updateRoomIndicators(roomNumber) {
        // Update room indicators if they exist
        const currentRoomElement = document.getElementById('current-room');
        if (currentRoomElement) {
            currentRoomElement.textContent = roomNumber;
        }
    }

    showMessage(message, type) {
        // Simple message display
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    // Delegate game methods to GameManager
    roomCompleted(message) {
        this.gameManager.roomCompleted(message);
    }

    pauseGame(reason) {
        this.gameManager.pauseGame(reason);
    }

    resumeGame() {
        this.gameManager.resumeGame();
    }

    gameWon() {
        this.gameManager.gameWon();
    }

    gameOver(message) {
        this.gameManager.gameOver(message);
    }

    showNavigationWarning() {
        this.modalManager.showNavigationWarning();
    }

    showHelp() {
        // Show tutorial for current room when help is requested
        if (this.tutorialModal) {
            this.tutorialModal.forceShowTutorial(this.currentRoom);
        } else {
            this.showMessage('Tutorial system not available', 'info');
        }
    }
}

// Make game instance globally available for victory screen and navigation
let game;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    game = new EscapeTheLabGame();
    
    // Make game globally available immediately
    window.game = game;
    
    // Initialize the game
    game.init();
});

// Global function for manual testing
window.jumpToRoom = function(roomNumber) {
    console.log(`Manual jump to room ${roomNumber}`);
    if (window.game && window.game.loadRoom) {
        if (window.game.currentRoomInstance && window.game.currentRoomInstance.cleanup) {
            window.game.currentRoomInstance.cleanup();
        }
        window.game.loadRoom(roomNumber);
    } else {
        console.error('Game not available for manual jump');
    }
};
