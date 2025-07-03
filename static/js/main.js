// Import managers
import { LevelManager } from './managers/level-manager.js';
import { CosmeticManager } from './managers/cosmetic-manager.js';
import { ModalManager } from './managers/modal-manager.js';
import { GameManager } from './managers/game-manager.js';

class EscapeTheLabGame {
    constructor() {
        this.currentRoom = 1;
        this.totalRooms = 5;
        this.gameActive = false;
        this.gameStarted = false;
        this.inRoom = false; // Track if we're currently in a room
        
        // Initialize managers
        this.levelManager = new LevelManager(this);
        this.cosmeticManager = new CosmeticManager(this);
        this.modalManager = new ModalManager(this);
        this.gameManager = new GameManager(this);
        
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

    init() {
        // Load saved cosmetics
        this.cosmeticManager.loadPlayerData();
        
        // Initialize game state
        this.gameActive = false;
        this.inRoom = false;
        
        console.log('AscendEd: Tech Lab Breakout initialized');
    }

    async loadRoom(roomNumber) {
        try {
            this.inRoom = true;
            this.gameActive = true;
            this.currentRoom = roomNumber;
            
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

    roomCompleted(message) {
        this.player.roomsCompleted++;
        this.cosmeticManager.unlockCosmetics();
        this.cosmeticManager.savePlayerData();
        
        if (this.player.roomsCompleted >= this.totalRooms) {
            this.gameWon();
        } else {
            this.modalManager.showSuccessModal(message);
        }
    }

    gameWon() {
        this.inRoom = false;
        this.gameActive = false;
        const victoryContent = this.modalManager.showVictoryContent();
        
        document.getElementById('room-content').innerHTML = victoryContent;
    }

    gameOver(message) {
        this.inRoom = false;
        this.gameActive = false;
        this.modalManager.showGameOverModal(message);
    }

    nextRoom() {
        if (this.currentRoom < this.totalRooms) {
            this.loadRoom(this.currentRoom + 1);
        } else {
            this.gameWon();
        }
    }

    restart() {
        this.player.roomsCompleted = 0;
        this.currentRoom = 1;
        this.inRoom = false;
        this.gameActive = false;
        this.loadRoom(1);
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
                this.levelManager.stopCurrentRoom(); // Stop current room before loading new one
                this.levelManager.loadRoom(roomNumber);
            });
        });
        
        console.log('Wave navigation buttons configured');
    }
}

// Initialize the game
const game = new EscapeTheLabGame();
window.game = game;

// Set up event listeners for modals
document.addEventListener('DOMContentLoaded', () => {
    const nextRoomBtn = document.getElementById('next-room-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    if (nextRoomBtn) {
        nextRoomBtn.addEventListener('click', () => {
            game.modalManager.hideSuccessModal();
            game.nextRoom();
        });
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            game.restart();
        });
    }
});

export { EscapeTheLabGame };
