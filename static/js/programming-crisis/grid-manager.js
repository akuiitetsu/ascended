export class GridManager {
    constructor(room) {
        this.room = room;
        this.baseGridWidth = 12;
        this.baseGridHeight = 8;
        this.baseCellSize = 50;
        this.gameGrid = null;
        this.playerElement = null;
        
        // Calculate responsive dimensions
        this.updateResponsiveDimensions();
        
        // Listen for window resize
        window.addEventListener('resize', () => {
            this.updateResponsiveDimensions();
            this.updateGridSize();
        });
    }

    updateResponsiveDimensions() {
        const container = document.getElementById('game-grid');
        if (!container) return;
        
        const containerRect = container.parentElement.getBoundingClientRect();
        const availableWidth = containerRect.width - 32; // Account for padding
        const availableHeight = Math.min(containerRect.height - 100, window.innerHeight * 0.5); // Max 50% of viewport
        
        // Calculate optimal cell size based on container
        const cellSizeByWidth = Math.floor(availableWidth / this.baseGridWidth);
        const cellSizeByHeight = Math.floor(availableHeight / this.baseGridHeight);
        
        // Use smaller dimension to ensure grid fits
        this.cellSize = Math.max(30, Math.min(cellSizeByWidth, cellSizeByHeight, 60)); // Min 30px, max 60px
        
        // Adjust grid dimensions on small screens
        if (window.innerWidth < 768) {
            this.gridWidth = 10;
            this.gridHeight = 6;
        } else if (window.innerWidth < 1024) {
            this.gridWidth = 11;
            this.gridHeight = 7;
        } else {
            this.gridWidth = this.baseGridWidth;
            this.gridHeight = this.baseGridHeight;
        }
    }

    updateGridSize() {
        if (!this.gameGrid) return;
        
        this.gameGrid.style.width = `${this.gridWidth * this.cellSize}px`;
        this.gameGrid.style.height = `${this.gridHeight * this.cellSize}px`;
        
        // Update all cells
        const cells = this.gameGrid.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            
            cell.style.left = `${x * this.cellSize}px`;
            cell.style.top = `${y * this.cellSize}px`;
            cell.style.width = `${this.cellSize}px`;
            cell.style.height = `${this.cellSize}px`;
        });
        
        // Update player and objects
        this.renderPlayer();
        this.renderGameObjects();
    }

    setupGameGrid() {
        this.gameGrid = document.getElementById('game-grid');
        this.gameGrid.innerHTML = '';
        
        // Set responsive grid size
        this.updateResponsiveDimensions();
        this.gameGrid.style.width = `${this.gridWidth * this.cellSize}px`;
        this.gameGrid.style.height = `${this.gridHeight * this.cellSize}px`;
        
        // Create grid cells
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell absolute border border-gray-700';
                cell.style.left = `${x * this.cellSize}px`;
                cell.style.top = `${y * this.cellSize}px`;
                cell.style.width = `${this.cellSize}px`;
                cell.style.height = `${this.cellSize}px`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.gameGrid.appendChild(cell);
            }
        }
        
        // Place player
        this.renderPlayer();
        
        // Place game objects
        this.renderGameObjects();
    }

    renderPlayer() {
        if (this.playerElement) {
            this.playerElement.remove();
        }
        
        this.playerElement = document.createElement('div');
        this.playerElement.className = 'player-character absolute flex items-center justify-center text-2xl font-bold z-10';
        this.playerElement.style.left = `${this.room.player.x * this.cellSize}px`;
        this.playerElement.style.top = `${this.room.player.y * this.cellSize}px`;
        this.playerElement.style.width = `${this.cellSize}px`;
        this.playerElement.style.height = `${this.cellSize}px`;
        this.playerElement.style.backgroundColor = '#3b82f6';
        this.playerElement.style.border = '2px solid #1e40af';
        this.playerElement.style.borderRadius = '8px';
        this.playerElement.innerHTML = '🤖';
        
        this.gameGrid.appendChild(this.playerElement);
    }

    renderGameObjects() {
        // Clear existing objects
        document.querySelectorAll('.game-object').forEach(el => el.remove());
        
        // Render bugs
        this.room.bugs.forEach(bug => {
            const element = document.createElement('div');
            element.className = 'game-object bug absolute flex items-center justify-center text-2xl z-5';
            element.style.left = `${bug.x * this.cellSize}px`;
            element.style.top = `${bug.y * this.cellSize}px`;
            element.style.width = `${this.cellSize}px`;
            element.style.height = `${this.cellSize}px`;
            element.style.backgroundColor = '#dc2626';
            element.style.border = '2px solid #991b1b';
            element.style.borderRadius = '8px';
            element.innerHTML = '🐛';
            element.title = `${bug.type} (HP: ${bug.health})`;
            this.gameGrid.appendChild(element);
        });
        
        // Render obstacles
        this.room.obstacles.forEach(obstacle => {
            const element = document.createElement('div');
            element.className = 'game-object obstacle absolute flex items-center justify-center text-2xl z-5';
            element.style.left = `${obstacle.x * this.cellSize}px`;
            element.style.top = `${obstacle.y * this.cellSize}px`;
            element.style.width = `${this.cellSize}px`;
            element.style.height = `${this.cellSize}px`;
            element.style.backgroundColor = obstacle.type === 'firewall' ? '#f59e0b' : '#6b7280';
            element.style.border = '2px solid #374151';
            element.style.borderRadius = '4px';
            element.innerHTML = obstacle.type === 'firewall' ? '🔥' : '🧱';
            this.gameGrid.appendChild(element);
        });
        
        // Render power-ups
        this.room.powerUps.forEach(powerUp => {
            const element = document.createElement('div');
            element.className = 'game-object powerup absolute flex items-center justify-center text-2xl z-5';
            element.style.left = `${powerUp.x * this.cellSize}px`;
            element.style.top = `${powerUp.y * this.cellSize}px`;
            element.style.width = `${this.cellSize}px`;
            element.style.height = `${this.cellSize}px`;
            element.style.backgroundColor = '#10b981';
            element.style.border = '2px solid #047857';
            element.style.borderRadius = '50%';
            element.innerHTML = '💊';
            element.title = `${powerUp.type} (+${powerUp.value})`;
            this.gameGrid.appendChild(element);
        });
    }

    getGridDimensions() {
        return {
            width: this.gridWidth,
            height: this.gridHeight,
            cellSize: this.cellSize
        };
    }
}
