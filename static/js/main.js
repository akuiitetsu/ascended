// Import managers
import { LevelManager } from './managers/level-manager.js';
import { CosmeticManager } from './managers/cosmetic-manager.js';
import { ModalManager } from './managers/modal-manager.js';
import { GameManager } from './managers/game-manager.js';

class EscapeTheLabGame {
    constructor() {
        this.currentRoom = 1;
        this.totalRooms = 5; // Updated to reflect actual number of rooms (was 6)
        this.gameActive = false;
        this.gameStarted = false;
        
        // Initialize managers
        this.levelManager = new LevelManager(this);
        this.cosmeticManager = new CosmeticManager(this);
        this.modalManager = new ModalManager(this);
        this.gameManager = new GameManager(this);
        
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
        this.cosmeticManager.loadPlayerData(); // Load player data before starting
        this.setupEventListeners();
        this.gameManager.startGame();
        
        // Set up wave navigation after game initialization
        this.setupWaveNavigation();
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
}

// Make game instance globally available for victory screen and navigation
let game;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    game = new EscapeTheLabGame();
    
    // Make game globally available immediately
    window.game = game;
});

// Global function for manual testing
window.jumpToRoom = function(roomNumber) {
    console.log(`Manual jump to room ${roomNumber}`);
    if (window.game && window.game.levelManager.loadRoom) {
        window.game.levelManager.stopCurrentRoom();
        window.game.levelManager.loadRoom(roomNumber);
    } else {
        console.error('Game not available for manual jump');
    }
};

// Export the game class for potential use in other modules
export { EscapeTheLabGame };
