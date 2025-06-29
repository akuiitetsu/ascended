import { EditorGrid } from './editor-grid.js';
import { EditorUI } from './editor-ui.js';
import { LevelStorage } from './level-storage.js';
import { LevelTester } from './level-tester.js';

export class EditorCore {
    constructor(room) {
        this.room = room;
        this.isEditorMode = false;
        this.selectedTool = 'bug';
        this.selectedBugType = 'syntax_error';
        this.selectedObstacleType = 'wall';
        this.selectedPowerUpType = 'health_pack';
        
        this.currentEditingLevel = {
            name: 'Custom Level',
            bugs: [],
            obstacles: [],
            powerUps: [],
            playerStart: { x: 1, y: 6 }
        };
        
        // Initialize sub-managers
        this.grid = new EditorGrid(this);
        this.ui = new EditorUI(this);
        this.storage = new LevelStorage(this);
        this.tester = new LevelTester(this);
        
        this.tools = {
            bug: { icon: '🐛', name: 'Bug' },
            obstacle: { icon: '🧱', name: 'Obstacle' },
            powerup: { icon: '💊', name: 'Power-up' },
            player: { icon: '🤖', name: 'Player Start' },
            eraser: { icon: '🗑️', name: 'Eraser' }
        };
        
        this.bugTypes = {
            syntax_error: { health: 30, color: '#dc2626' },
            type_error: { health: 25, color: '#f59e0b' },
            logic_error: { health: 40, color: '#8b5cf6' },
            runtime_error: { health: 50, color: '#ef4444' },
            memory_leak: { health: 60, color: '#06b6d4' },
            race_condition: { health: 70, color: '#10b981' },
            buffer_overflow: { health: 80, color: '#f97316' }
        };
        
        this.obstacleTypes = {
            wall: { color: '#6b7280', icon: '🧱' },
            firewall: { color: '#f59e0b', icon: '🔥' },
            encrypted_wall: { color: '#8b5cf6', icon: '🔐' }
        };
        
        this.powerUpTypes = {
            health_pack: { value: 25, color: '#10b981', icon: '💊' },
            energy_boost: { value: 20, color: '#3b82f6', icon: '⚡' },
            debug_tool: { value: 30, color: '#8b5cf6', icon: '🔧' },
            super_debug: { value: 50, color: '#f59e0b', icon: '⭐' }
        };
    }

    enterEditorMode() {
        this.isEditorMode = true;
        this.currentEditingLevel = {
            name: `Custom Level ${this.storage.getCustomLevels().length + 1}`,
            bugs: [],
            obstacles: [],
            powerUps: [],
            playerStart: { x: 1, y: 6 }
        };
        
        this.ui.renderEditor();
        this.grid.setupEditorGrid();
    }

    exitEditorMode() {
        this.isEditorMode = false;
        this.room.render();
        this.room.gridManager.setupGameGrid();
    }

    selectTool(tool) {
        this.selectedTool = tool;
        this.ui.updateToolSelection(tool);
        this.ui.updateTypeOptions();
    }

    placeBug(x, y) {
        this.eraseObject(x, y);
        
        const bugType = this.bugTypes[this.selectedBugType];
        const newBug = {
            x, y,
            type: this.selectedBugType,
            health: bugType.health,
            id: Date.now() + Math.random()
        };
        
        this.currentEditingLevel.bugs.push(newBug);
    }

    placeObstacle(x, y) {
        this.eraseObject(x, y);
        
        const newObstacle = {
            x, y,
            type: this.selectedObstacleType
        };
        
        this.currentEditingLevel.obstacles.push(newObstacle);
    }

    placePowerUp(x, y) {
        this.eraseObject(x, y);
        
        const powerUpType = this.powerUpTypes[this.selectedPowerUpType];
        const newPowerUp = {
            x, y,
            type: this.selectedPowerUpType,
            value: powerUpType.value
        };
        
        this.currentEditingLevel.powerUps.push(newPowerUp);
    }

    setPlayerStart(x, y) {
        this.currentEditingLevel.playerStart = { x, y };
        this.grid.renderPlayerStart();
    }

    eraseObject(x, y) {
        this.currentEditingLevel.bugs = this.currentEditingLevel.bugs.filter(
            bug => !(bug.x === x && bug.y === y)
        );
        
        this.currentEditingLevel.obstacles = this.currentEditingLevel.obstacles.filter(
            obstacle => !(obstacle.x === x && obstacle.y === y)
        );
        
        this.currentEditingLevel.powerUps = this.currentEditingLevel.powerUps.filter(
            powerUp => !(powerUp.x === x && powerUp.y === y)
        );
    }

    clearLevel() {
        if (confirm('Are you sure you want to clear the entire level?')) {
            this.currentEditingLevel.bugs = [];
            this.currentEditingLevel.obstacles = [];
            this.currentEditingLevel.powerUps = [];
            this.currentEditingLevel.playerStart = { x: 1, y: 6 };
            
            this.grid.renderPlayerStart();
            this.grid.renderEditorObjects();
            this.ui.updateLevelStats();
        }
    }

    calculateDifficultyScore() {
        let score = 0;
        
        this.currentEditingLevel.bugs.forEach(bug => {
            score += this.bugTypes[bug.type].health;
        });
        
        score += this.currentEditingLevel.obstacles.length * 10;
        
        this.currentEditingLevel.powerUps.forEach(powerUp => {
            score -= this.powerUpTypes[powerUp.type].value / 2;
        });
        
        return Math.max(0, Math.round(score));
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
}
