export class LevelStorage {
    constructor(editor) {
        this.editor = editor;
        this.customLevels = this.loadCustomLevels();
    }

    saveLevel() {
        if (!this.editor.currentEditingLevel.name.trim()) {
            this.editor.showMessage('Please enter a level name!', 'error');
            return;
        }
        
        if (this.editor.currentEditingLevel.bugs.length === 0) {
            this.editor.showMessage('Add at least one bug before saving!', 'error');
            return;
        }
        
        const levelData = {
            ...this.editor.currentEditingLevel,
            created: new Date().toISOString(),
            difficulty: this.editor.calculateDifficultyScore()
        };
        
        this.customLevels.push(levelData);
        this.saveCustomLevels();
        
        this.editor.showMessage(`Level "${levelData.name}" saved successfully!`, 'success');
    }

    showLoadLevelModal() {
        if (this.customLevels.length === 0) {
            this.editor.showMessage('No custom levels found! Create and save a level first.', 'info');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 border-2 border-gray-600 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-white">📁 Load Custom Level</h2>
                    <button id="close-load-modal" class="text-gray-400 hover:text-white text-2xl">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
                
                <div class="custom-levels-list space-y-2">
                    ${this.customLevels.map((level, index) => `
                        <div class="level-item bg-gray-700 p-3 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                             data-index="${index}">
                            <div class="flex justify-between items-center">
                                <div>
                                    <h3 class="font-bold text-white">${level.name}</h3>
                                    <p class="text-sm text-gray-300">
                                        🐛 ${level.bugs.length} bugs • 
                                        🧱 ${level.obstacles.length} obstacles • 
                                        💊 ${level.powerUps.length} power-ups
                                    </p>
                                    <p class="text-xs text-gray-400">
                                        Difficulty: ${level.difficulty} • 
                                        Created: ${new Date(level.created).toLocaleDateString()}
                                    </p>
                                </div>
                                <button class="delete-level bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                                        data-index="${index}">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const closeBtn = modal.querySelector('#close-load-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        modal.querySelectorAll('.level-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-level')) return;
                
                const index = parseInt(item.dataset.index);
                this.loadLevel(this.customLevels[index]);
                modal.remove();
            });
        });
        
        modal.querySelectorAll('.delete-level').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                if (confirm(`Delete level "${this.customLevels[index].name}"?`)) {
                    this.customLevels.splice(index, 1);
                    this.saveCustomLevels();
                    modal.remove();
                    this.showLoadLevelModal();
                }
            });
        });
    }

    loadLevel(levelData) {
        this.editor.currentEditingLevel = {
            name: levelData.name,
            bugs: [...levelData.bugs],
            obstacles: [...levelData.obstacles],
            powerUps: [...levelData.powerUps],
            playerStart: { ...levelData.playerStart }
        };
        
        const levelNameInput = document.getElementById('level-name');
        if (levelNameInput) {
            levelNameInput.value = this.editor.currentEditingLevel.name;
        }
        
        this.editor.grid.renderPlayerStart();
        this.editor.grid.renderEditorObjects();
        this.editor.ui.updateLevelStats();
        
        this.editor.showMessage(`Level "${levelData.name}" loaded!`, 'success');
    }

    exportLevel() {
        if (!this.editor.currentEditingLevel.name.trim()) {
            this.editor.showMessage('Please enter a level name before exporting!', 'error');
            return;
        }
        
        const levelData = {
            ...this.editor.currentEditingLevel,
            exported: new Date().toISOString(),
            difficulty: this.editor.calculateDifficultyScore()
        };
        
        const dataStr = JSON.stringify(levelData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${levelData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        this.editor.showMessage('Level exported successfully!', 'success');
    }

    importLevel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const levelData = JSON.parse(e.target.result);
                    
                    // Validate level data structure
                    if (!this.validateLevelData(levelData)) {
                        throw new Error('Invalid level format');
                    }
                    
                    this.loadLevel(levelData);
                    this.editor.showMessage('Level imported successfully!', 'success');
                    
                } catch (error) {
                    this.editor.showMessage('Failed to import level: Invalid format', 'error');
                    console.error('Import error:', error);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    validateLevelData(levelData) {
        // Check if required properties exist
        const requiredProps = ['name', 'bugs', 'obstacles', 'powerUps', 'playerStart'];
        
        for (const prop of requiredProps) {
            if (!(prop in levelData)) {
                return false;
            }
        }
        
        // Check if arrays are actually arrays
        if (!Array.isArray(levelData.bugs) || 
            !Array.isArray(levelData.obstacles) || 
            !Array.isArray(levelData.powerUps)) {
            return false;
        }
        
        // Check player start position
        if (!levelData.playerStart || 
            typeof levelData.playerStart.x !== 'number' || 
            typeof levelData.playerStart.y !== 'number') {
            return false;
        }
        
        return true;
    }

    loadCustomLevels() {
        const saved = localStorage.getItem('programming-crisis-custom-levels');
        return saved ? JSON.parse(saved) : [];
    }

    saveCustomLevels() {
        localStorage.setItem('programming-crisis-custom-levels', JSON.stringify(this.customLevels));
    }

    getCustomLevels() {
        return this.customLevels;
    }
}
