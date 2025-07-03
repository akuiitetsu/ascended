import { TutorialManager } from './tutorial-manager.js';

export class LevelManager {
    constructor(game) {
        this.game = game;
        this.tutorialManager = new TutorialManager();
        this.rooms = ['Flowchart Lab', 'Network Nexus', 'AI Systems', 'Database Crisis', 'Programming Crisis'];
        this.currentRoomInstance = null;
    }

    stopCurrentRoom() {
        if (this.currentRoomInstance) {
            console.log('Stopping current room instance...');
            
            // Clear any running timers/intervals - comprehensive cleanup
            const timerProperties = [
                'defenseTimer', 'gameTimer', 'visualTimer', 'ethicsTimer', 
                'programmingTimer', 'databaseTimer', 'cyberTimer', 'attackTimer',
                'waveTimer', 'trafficTimer', 'connectionTimer'
            ];
            
            timerProperties.forEach(timerProp => {
                if (this.currentRoomInstance[timerProp]) {
                    clearInterval(this.currentRoomInstance[timerProp]);
                    console.log(`Cleared ${timerProp}`);
                }
            });
            
            // Remove any other potential timer references
            if (this.currentRoomInstance.ethicsTimer) {
                clearInterval(this.currentRoomInstance.ethicsTimer);
                console.log('Cleared ethics timer');
            }
            
            if (this.currentRoomInstance.programmingTimer) {
                clearInterval(this.currentRoomInstance.programmingTimer);
                console.log('Cleared programming timer');
            }
            
            // Call cleanup method if it exists
            if (typeof this.currentRoomInstance.cleanup === 'function') {
                this.currentRoomInstance.cleanup();
                console.log('Called room cleanup method');
            }
            
            // Stop any running games/simulations
            if (this.currentRoomInstance.isRunning) {
                this.currentRoomInstance.isRunning = false;
            }
            
            if (this.currentRoomInstance.isDefending) {
                this.currentRoomInstance.isDefending = false;
            }
            
            // Clear the instance
            this.currentRoomInstance = null;
            console.log('Current room instance cleared');
        }
    }

    async loadRoom(roomNumber) {
        console.log(`Loading room ${roomNumber}...`);
        
        // Stop the current room before loading new one
        this.stopCurrentRoom();
        
        this.game.currentRoom = roomNumber;
        this.game.gameActive = true; // Set game as active when loading a room
        this.game.inRoom = true; // Set inRoom flag
        document.getElementById('current-room').textContent = roomNumber;
        
        const roomName = this.rooms[roomNumber - 1];
        
        try {
            // Show loading state
            document.getElementById('room-content').innerHTML = `
                <div class="loading text-center">
                    <i class="bi bi-gear-fill animate-spin text-4xl text-yellow-400"></i>
                    <p class="mt-4">Loading Room ${roomNumber}...</p>
                </div>
            `;

            // Show tutorial automatically when entering a room
            if (this.tutorialManager && typeof this.tutorialManager.showTutorial === 'function') {
                this.tutorialManager.showTutorial(roomNumber);
            } else {
                console.warn('Tutorial manager not properly initialized');
            }

            // Handle all rooms as modular with ES6 imports
            console.log(`Loading modular room: ${roomName}`);
            
            // Dynamic import for all rooms
            const moduleMap = {
                1: '../networking/networking.js',
                2: '../cloudscale/cloudscale.js',
                3: '../ai-systems/ai-systems.js',
                4: '../database-emergency/database-emergency.js',
                5: '../programming-crisis/programming-crisis.js'
            };

            const module = await import(moduleMap[roomNumber]);
            const RoomClass = module[`Room${roomNumber}`] || module.default;
            
            if (RoomClass) {
                this.currentRoomInstance = new RoomClass(this.game);
                await this.currentRoomInstance.init();
                console.log(`Room ${roomNumber} loaded successfully`);
            } else {
                throw new Error(`Room class not found in module for room ${roomNumber}`);
            }
            
        } catch (error) {
            console.error(`Failed to load room ${roomNumber}:`, error);
            this.game.inRoom = false; // Reset inRoom flag on error
            document.getElementById('room-content').innerHTML = `
                <div class="error text-center text-red-400">
                    <i class="bi bi-exclamation-triangle text-4xl mb-4"></i>
                    <h3 class="text-xl mb-2">Error Loading Room ${roomNumber}</h3>
                    <p class="mb-4">${error.message}</p>
                    <button onclick="game.loadRoom(1)" class="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
                        Return to Room 1
                    </button>
                </div>
            `;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`Script loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCurrentRoomInstance() {
        return this.currentRoomInstance;
    }

    showRoomTutorial(roomNumber = this.game.currentRoom) {
        // Method to explicitly show tutorial for current or specified room
        if (this.tutorialManager) {
            this.tutorialManager.showTutorial(roomNumber);
        }
    }
}