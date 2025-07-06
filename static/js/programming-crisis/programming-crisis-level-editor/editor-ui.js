export class EditorUI {
    constructor(editor) {
        this.editor = editor;
    }

    renderEditor() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-pencil-square text-6xl text-blue-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-blue-400">LEVEL EDITOR</h2>
                    <p class="text-gray-300 mt-2">Create custom debugging challenges!</p>
                </div>
                
                <div class="editor-controls grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <!-- Tool Palette -->
                    <div class="tool-palette bg-gray-800 p-4 rounded-lg">
                        <h3 class="text-lg font-bold text-white mb-3">🛠️ Tools</h3>
                        <div class="tools-grid grid grid-cols-3 gap-2">
                            ${Object.entries(this.editor.tools).map(([key, tool]) => `
                                <button class="tool-btn ${this.editor.selectedTool === key ? 'selected' : ''} 
                                       bg-gray-700 hover:bg-gray-600 p-3 rounded border-2 transition-colors"
                                       data-tool="${key}">
                                    <div class="text-2xl mb-1">${tool.icon}</div>
                                    <div class="text-xs">${tool.name}</div>
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Sub-tool options -->
                        <div class="sub-tools mt-4">
                            <div id="bug-options" class="sub-tool-panel ${this.editor.selectedTool === 'bug' ? '' : 'hidden'}">
                                <h4 class="text-sm font-bold text-gray-300 mb-2">Bug Types</h4>
                                <select id="bug-type-select" class="w-full bg-gray-700 text-white p-2 rounded">
                                    ${Object.entries(this.editor.bugTypes).map(([key, bug]) => `
                                        <option value="${key}" ${this.editor.selectedBugType === key ? 'selected' : ''}>
                                            ${key.replace('_', ' ')} (${bug.health} HP)
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div id="obstacle-options" class="sub-tool-panel ${this.editor.selectedTool === 'obstacle' ? '' : 'hidden'}">
                                <h4 class="text-sm font-bold text-gray-300 mb-2">Obstacle Types</h4>
                                <select id="obstacle-type-select" class="w-full bg-gray-700 text-white p-2 rounded">
                                    ${Object.entries(this.editor.obstacleTypes).map(([key, obstacle]) => `
                                        <option value="${key}" ${this.editor.selectedObstacleType === key ? 'selected' : ''}>
                                            ${obstacle.icon} ${key.replace('_', ' ')}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div id="powerup-options" class="sub-tool-panel ${this.editor.selectedTool === 'powerup' ? '' : 'hidden'}">
                                <h4 class="text-sm font-bold text-gray-300 mb-2">Power-up Types</h4>
                                <select id="powerup-type-select" class="w-full bg-gray-700 text-white p-2 rounded">
                                    ${Object.entries(this.editor.powerUpTypes).map(([key, powerup]) => `
                                        <option value="${key}" ${this.editor.selectedPowerUpType === key ? 'selected' : ''}>
                                            ${powerup.icon} ${key.replace('_', ' ')} (+${powerup.value})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Level Info -->
                    <div class="level-info bg-gray-800 p-4 rounded-lg">
                        <h3 class="text-lg font-bold text-white mb-3">📝 Level Properties</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-bold text-gray-300 mb-1">Level Name</label>
                                <input id="level-name" type="text" value="${this.editor.currentEditingLevel?.name || ''}" 
                                       class="w-full bg-gray-700 text-white p-2 rounded">
                            </div>
                            
                            <div class="level-stats grid grid-cols-2 gap-2 text-sm">
                                <div class="stat-item bg-gray-700 p-2 rounded text-center">
                                    <div class="text-red-400 font-bold" id="bug-count">0</div>
                                    <div class="text-gray-300">Bugs</div>
                                </div>
                                <div class="stat-item bg-gray-700 p-2 rounded text-center">
                                    <div class="text-gray-400 font-bold" id="obstacle-count">0</div>
                                    <div class="text-gray-300">Obstacles</div>
                                </div>
                                <div class="stat-item bg-gray-700 p-2 rounded text-center">
                                    <div class="text-green-400 font-bold" id="powerup-count">0</div>
                                    <div class="text-gray-300">Power-ups</div>
                                </div>
                                <div class="stat-item bg-gray-700 p-2 rounded text-center">
                                    <div class="text-blue-400 font-bold" id="difficulty-score">0</div>
                                    <div class="text-gray-300">Difficulty</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="editor-actions bg-gray-800 p-4 rounded-lg">
                        <h3 class="text-lg font-bold text-white mb-3">⚡ Actions</h3>
                        <div class="space-y-2">
                            <button id="clear-level" class="w-full bg-red-600 hover:bg-red-700 p-2 rounded transition-colors">
                                <i class="bi bi-trash"></i> Clear Level
                            </button>
                            <button id="test-level" class="w-full bg-green-600 hover:bg-green-700 p-2 rounded transition-colors">
                                <i class="bi bi-play"></i> Test Level
                            </button>
                            <button id="save-level" class="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded transition-colors">
                                <i class="bi bi-save"></i> Save Level
                            </button>
                            <button id="load-level" class="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded transition-colors">
                                <i class="bi bi-folder-open"></i> Load Level
                            </button>
                            <button id="export-level" class="w-full bg-yellow-600 hover:bg-yellow-700 p-2 rounded transition-colors">
                                <i class="bi bi-download"></i> Export JSON
                            </button>
                            <button id="import-level" class="w-full bg-cyan-600 hover:bg-cyan-700 p-2 rounded transition-colors">
                                <i class="bi bi-upload"></i> Import JSON
                            </button>
                            <button id="exit-editor" class="w-full bg-gray-600 hover:bg-gray-700 p-2 rounded transition-colors">
                                <i class="bi bi-x-circle"></i> Exit Editor
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Editor Grid -->
                <div class="editor-grid-container bg-gray-800 rounded-lg p-3 lg:p-4">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 lg:mb-4 gap-2">
                        <h3 class="text-lg lg:text-xl font-bold text-white">🎨 Level Design Canvas</h3>
                        <div class="grid-info text-xs lg:text-sm text-gray-400">
                            Click to place objects • Right-click to remove
                        </div>
                    </div>
                    
                    <div class="grid-container flex justify-center overflow-x-auto">
                        <div id="editor-game-grid" class="bg-black rounded border-2 border-gray-600 relative mx-auto" 
                             style="width: ${this.editor.room.gridManager.gridWidth * this.editor.room.gridManager.cellSize}px; 
                                    height: ${this.editor.room.gridManager.gridHeight * this.editor.room.gridManager.cellSize}px; min-width: 300px;">
                            <!-- Editor grid will be rendered here -->
                        </div>
                    </div>
                    
                    <div class="grid-legend mt-2 text-xs lg:text-sm text-gray-400 text-center">
                        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 lg:gap-2">
                            <span>🤖 = Player Start</span>
                            <span>🐛 = Bug</span>
                            <span>🧱 = Wall</span>
                            <span>🔥 = Firewall</span>
                            <span>💊 = Power-up</span>
                            <span>🔐 = Encrypted</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.editor.selectTool(tool);
            });
        });
        
        // Sub-tool selection
        document.getElementById('bug-type-select')?.addEventListener('change', (e) => {
            this.editor.selectedBugType = e.target.value;
        });
        
        document.getElementById('obstacle-type-select')?.addEventListener('change', (e) => {
            this.editor.selectedObstacleType = e.target.value;
        });
        
        document.getElementById('powerup-type-select')?.addEventListener('change', (e) => {
            this.editor.selectedPowerUpType = e.target.value;
        });
        
        // Action buttons
        document.getElementById('clear-level')?.addEventListener('click', () => {
            this.editor.clearLevel();
        });
        
        document.getElementById('test-level')?.addEventListener('click', () => {
            this.editor.tester.testLevel();
        });
        
        document.getElementById('save-level')?.addEventListener('click', () => {
            this.editor.storage.saveLevel();
        });
        
        document.getElementById('load-level')?.addEventListener('click', () => {
            this.editor.storage.showLoadLevelModal();
        });
        
        document.getElementById('export-level')?.addEventListener('click', () => {
            this.editor.storage.exportLevel();
        });
        
        document.getElementById('import-level')?.addEventListener('click', () => {
            this.editor.storage.importLevel();
        });
        
        document.getElementById('exit-editor')?.addEventListener('click', () => {
            this.editor.exitEditorMode();
        });
        
        // Level name input
        document.getElementById('level-name')?.addEventListener('input', (e) => {
            this.editor.currentEditingLevel.name = e.target.value;
        });
    }

    updateToolSelection(tool) {
        // Update tool button appearances
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.tool === tool);
            if (btn.dataset.tool === tool) {
                btn.style.borderColor = '#3b82f6';
                btn.style.backgroundColor = '#1e40af';
            } else {
                btn.style.borderColor = '#6b7280';
                btn.style.backgroundColor = '#374151';
            }
        });
        
        // Show/hide sub-tool panels
        document.querySelectorAll('.sub-tool-panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        
        const activePanel = document.getElementById(`${tool}-options`);
        if (activePanel) {
            activePanel.classList.remove('hidden');
        }
    }

    updateTypeOptions() {
        // This method can be used to refresh type options if needed
        // Currently, the options are static, but this allows for future dynamic updates
    }

    updateLevelStats() {
        const bugCountEl = document.getElementById('bug-count');
        const obstacleCountEl = document.getElementById('obstacle-count');
        const powerupCountEl = document.getElementById('powerup-count');
        const difficultyScoreEl = document.getElementById('difficulty-score');
        
        if (bugCountEl) bugCountEl.textContent = this.editor.currentEditingLevel.bugs.length;
        if (obstacleCountEl) obstacleCountEl.textContent = this.editor.currentEditingLevel.obstacles.length;
        if (powerupCountEl) powerupCountEl.textContent = this.editor.currentEditingLevel.powerUps.length;
        if (difficultyScoreEl) difficultyScoreEl.textContent = this.editor.calculateDifficultyScore();
    }
}
