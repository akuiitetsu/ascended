export class EditorGrid {
    constructor(editor) {
        this.editor = editor;
    }

    setupEditorGrid() {
        const editorGrid = document.getElementById('editor-game-grid');
        editorGrid.innerHTML = '';
        
        // Create grid cells
        for (let y = 0; y < this.editor.room.gridManager.gridHeight; y++) {
            for (let x = 0; x < this.editor.room.gridManager.gridWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'editor-cell absolute border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors';
                cell.style.left = `${x * this.editor.room.gridManager.cellSize}px`;
                cell.style.top = `${y * this.editor.room.gridManager.cellSize}px`;
                cell.style.width = `${this.editor.room.gridManager.cellSize}px`;
                cell.style.height = `${this.editor.room.gridManager.cellSize}px`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // Add click handlers
                cell.addEventListener('click', (e) => this.handleCellClick(e, x, y));
                cell.addEventListener('contextmenu', (e) => this.handleCellRightClick(e, x, y));
                
                editorGrid.appendChild(cell);
            }
        }
        
        // Render initial player position
        this.renderPlayerStart();
        this.editor.ui.updateLevelStats();
    }

    handleCellClick(event, x, y) {
        event.preventDefault();
        
        switch (this.editor.selectedTool) {
            case 'bug':
                this.editor.placeBug(x, y);
                break;
            case 'obstacle':
                this.editor.placeObstacle(x, y);
                break;
            case 'powerup':
                this.editor.placePowerUp(x, y);
                break;
            case 'player':
                this.editor.setPlayerStart(x, y);
                break;
            case 'eraser':
                this.editor.eraseObject(x, y);
                break;
        }
        
        this.renderEditorObjects();
        this.editor.ui.updateLevelStats();
    }

    handleCellRightClick(event, x, y) {
        event.preventDefault();
        this.editor.eraseObject(x, y);
        this.renderEditorObjects();
        this.editor.ui.updateLevelStats();
    }

    renderPlayerStart() {
        // Remove existing player element
        document.querySelectorAll('.editor-player').forEach(el => el.remove());
        
        const playerElement = document.createElement('div');
        playerElement.className = 'editor-player absolute flex items-center justify-center text-2xl font-bold z-10 pointer-events-none';
        playerElement.style.left = `${this.editor.currentEditingLevel.playerStart.x * this.editor.room.gridManager.cellSize}px`;
        playerElement.style.top = `${this.editor.currentEditingLevel.playerStart.y * this.editor.room.gridManager.cellSize}px`;
        playerElement.style.width = `${this.editor.room.gridManager.cellSize}px`;
        playerElement.style.height = `${this.editor.room.gridManager.cellSize}px`;
        playerElement.style.backgroundColor = '#3b82f6';
        playerElement.style.border = '2px solid #1e40af';
        playerElement.style.borderRadius = '8px';
        playerElement.innerHTML = '🤖';
        
        document.getElementById('editor-game-grid').appendChild(playerElement);
    }

    renderEditorObjects() {
        // Clear existing objects
        document.querySelectorAll('.editor-object').forEach(el => el.remove());
        
        const editorGrid = document.getElementById('editor-game-grid');
        
        // Render bugs
        this.editor.currentEditingLevel.bugs.forEach(bug => {
            const element = document.createElement('div');
            element.className = 'editor-object bug absolute flex items-center justify-center text-2xl z-5 pointer-events-none';
            element.style.left = `${bug.x * this.editor.room.gridManager.cellSize}px`;
            element.style.top = `${bug.y * this.editor.room.gridManager.cellSize}px`;
            element.style.width = `${this.editor.room.gridManager.cellSize}px`;
            element.style.height = `${this.editor.room.gridManager.cellSize}px`;
            element.style.backgroundColor = this.editor.bugTypes[bug.type].color;
            element.style.border = '2px solid #991b1b';
            element.style.borderRadius = '8px';
            element.innerHTML = '🐛';
            element.title = `${bug.type} (HP: ${bug.health})`;
            editorGrid.appendChild(element);
        });
        
        // Render obstacles
        this.editor.currentEditingLevel.obstacles.forEach(obstacle => {
            const element = document.createElement('div');
            element.className = 'editor-object obstacle absolute flex items-center justify-center text-2xl z-5 pointer-events-none';
            element.style.left = `${obstacle.x * this.editor.room.gridManager.cellSize}px`;
            element.style.top = `${obstacle.y * this.editor.room.gridManager.cellSize}px`;
            element.style.width = `${this.editor.room.gridManager.cellSize}px`;
            element.style.height = `${this.editor.room.gridManager.cellSize}px`;
            element.style.backgroundColor = this.editor.obstacleTypes[obstacle.type].color;
            element.style.border = '2px solid #374151';
            element.style.borderRadius = '4px';
            element.innerHTML = this.editor.obstacleTypes[obstacle.type].icon;
            editorGrid.appendChild(element);
        });
        
        // Render power-ups
        this.editor.currentEditingLevel.powerUps.forEach(powerUp => {
            const element = document.createElement('div');
            element.className = 'editor-object powerup absolute flex items-center justify-center text-2xl z-5 pointer-events-none';
            element.style.left = `${powerUp.x * this.editor.room.gridManager.cellSize}px`;
            element.style.top = `${powerUp.y * this.editor.room.gridManager.cellSize}px`;
            element.style.width = `${this.editor.room.gridManager.cellSize}px`;
            element.style.height = `${this.editor.room.gridManager.cellSize}px`;
            element.style.backgroundColor = this.editor.powerUpTypes[powerUp.type].color;
            element.style.border = '2px solid #047857';
            element.style.borderRadius = '50%';
            element.innerHTML = this.editor.powerUpTypes[powerUp.type].icon;
            element.title = `${powerUp.type} (+${powerUp.value})`;
            editorGrid.appendChild(element);
        });
    }
}
