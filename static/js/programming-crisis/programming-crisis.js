import { GridManager } from './grid-manager.js';
import { CodeExecutor } from './code-executor.js';
import { PlayerActions } from './player-actions.js';
import { LevelGenerator } from './level-generator.js';
import { ProgrammingCrisisUI } from './programming-crisis-ui.js';

class Room6 {
    constructor(game) {
        this.game = game;
        
        // Player character
        this.player = {
            x: 1,
            y: 6,
            health: 100,
            energy: 50,
            inventory: []
        };
        
        // Game state
        this.bugs = [];
        this.obstacles = [];
        this.powerUps = [];
        this.codeLines = [];
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.bugsDefeated = 0;
        
        // Initialize managers
        this.gridManager = new GridManager(this);
        this.codeExecutor = new CodeExecutor(this);
        this.playerActions = new PlayerActions(this);
        this.levelGenerator = new LevelGenerator(this);
        this.ui = new ProgrammingCrisisUI(this);
    }

    async init() {
        const response = await fetch('data/programming-crisis.json');
        this.data = await response.json();
        this.levelGenerator.initializeLevel();
        this.render();
        this.gridManager.setupGameGrid();
    }

    render() {
        this.ui.render();
    }

    levelComplete() {
        this.codeExecutor.stopExecution();
        
        if (this.currentLevel >= this.maxLevel) {
            this.systemStabilized();
        } else {
            this.currentLevel++;
            this.showMessage(`Level ${this.currentLevel - 1} complete! Advancing to level ${this.currentLevel}...`, 'success');
            
            setTimeout(() => {
                this.levelGenerator.initializeLevel();
                this.render();
                this.gridManager.setupGameGrid();
            }, 2000);
        }
    }

    updateDisplay() {
        this.ui.updateDisplay();
        this.codeExecutor.updateExecutionDisplay();
    }

    updateInventoryDisplay() {
        const inventoryDisplay = document.getElementById('inventory-display');
        if (inventoryDisplay) {
            if (this.player.inventory.length > 0) {
                inventoryDisplay.innerHTML = this.player.inventory.map(item => 
                    `<div class="text-green-300">${item.type} ${item.value ? `(+${item.value})` : ''}</div>`
                ).join('');
            } else {
                inventoryDisplay.innerHTML = '<div class="text-gray-500">Empty</div>';
            }
        }
    }

    systemStabilized() {
        this.codeExecutor.stopExecution();
        
        this.ui.renderSuccessScreen();
        
        setTimeout(() => {
            this.game.roomCompleted(`Programming crisis resolved! System debugged through advanced code-based navigation with loops and conditionals. ${this.bugsDefeated} bugs eliminated using Python-like programming commands.`);
        }, 3000);
    }

    gameOver() {
        this.codeExecutor.stopExecution();
        this.game.gameOver('Player health depleted! Debugging failed - System remains unstable with critical errors.');
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-20 right-4 p-3 rounded z-50 animate-pulse max-w-sm`;
        
        switch(type) {
            case 'success':
                messageDiv.classList.add('bg-green-800', 'text-green-200', 'border', 'border-green-500');
                break;
            case 'error':
                messageDiv.classList.add('bg-red-800', 'text-red-200', 'border', 'border-red-500');
                break;
            case 'info':
                messageDiv.classList.add('bg-blue-800', 'text-blue-200', 'border', 'border-blue-500');
                break;
        }
        
        messageDiv.innerHTML = message.replace(/\n/g, '<br>');
        document.body.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 4000);
    }

    cleanup() {
        this.codeExecutor.stopExecution();
    }
}

// Register the class globally
window.Room6 = Room6;

// Export the class for ES6 module imports
export { Room6 };
export default Room6;