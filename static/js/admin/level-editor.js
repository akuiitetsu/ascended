class LevelEditor {
    constructor() {
        this.currentRoom = 1;
        this.selectedLevel = null;
        this.levels = {};
        this.roomTemplates = {
            1: { // Flowchart Lab
                name: '',
                story: '',
                objective: '',
                character: '',
                taskType: 'flowchart',
                instruction: '',
                hint: '',
                flowchartData: {
                    startNode: { id: 'start', type: 'start', text: 'Start', x: 100, y: 50 },
                    endNode: { id: 'end', type: 'end', text: 'End', x: 100, y: 300 },
                    nodes: [],
                    connections: []
                },
                successCriteria: {}
            },
            2: { // Network Nexus
                name: '',
                story: '',
                objective: '',
                character: '',
                taskType: 'topology-builder',
                instruction: '',
                hint: '',
                requiredDevices: [],
                requiredConnections: 0,
                successCriteria: {}
            },
            3: { // AI Systems
                name: '',
                story: '',
                objective: '',
                character: '',
                taskType: 'ai-training',
                instruction: '',
                hint: '',
                dataset: [],
                algorithm: '',
                successCriteria: {}
            },
            4: { // Database Crisis
                name: '',
                story: '',
                objective: '',
                character: '',
                taskType: 'sql-query',
                instruction: '',
                hint: '',
                database: '',
                tables: [],
                successCriteria: {}
            },
            5: { // Programming Crisis
                name: '',
                story: '',
                objective: '',
                character: '',
                taskType: 'code-debug',
                instruction: '',
                hint: '',
                code: '',
                language: 'python',
                successCriteria: {}
            }
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadLevelsForRoom(this.currentRoom);
    }

    bindEvents() {
        // Room tabs
        document.querySelectorAll('.room-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const roomId = parseInt(e.target.dataset.room);
                this.switchRoom(roomId);
            });
        });

        // Level management buttons
        document.getElementById('create-level-btn').addEventListener('click', () => {
            this.showCreateLevelModal();
        });

        document.getElementById('import-levels-btn').addEventListener('click', () => {
            this.showImportModal();
        });

        document.getElementById('export-levels-btn').addEventListener('click', () => {
            this.exportLevels();
        });

        document.getElementById('save-level-btn').addEventListener('click', () => {
            this.saveCurrentLevel();
        });

        document.getElementById('delete-level-btn').addEventListener('click', () => {
            this.deleteCurrentLevel();
        });

        // Modal handlers
        document.getElementById('cancel-create').addEventListener('click', () => {
            this.hideCreateLevelModal();
        });

        document.getElementById('cancel-import').addEventListener('click', () => {
            this.hideImportModal();
        });

        document.getElementById('create-level-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createLevel(e.target);
        });

        document.getElementById('import-levels-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.importLevels(e.target);
        });
    }

    switchRoom(roomId) {
        this.currentRoom = roomId;
        
        // Update active tab
        document.querySelectorAll('.room-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-room="${roomId}"]`).classList.add('active');
        
        // Load levels for new room
        this.loadLevelsForRoom(roomId);
        this.clearEditor();
    }

    async loadLevelsForRoom(roomId) {
        try {
            const response = await fetch(`/api/admin/levels/${roomId}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                this.levels[roomId] = data.levels;
                this.renderLevelsList();
            } else {
                this.showMessage(data.message, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to load levels', 'error');
            console.error(error);
        }
    }

    renderLevelsList() {
        const listContainer = document.getElementById('levels-list');
        const levels = this.levels[this.currentRoom] || [];
        
        if (levels.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center text-gray-400 py-4">
                    <i class="bi bi-inbox text-2xl mb-2"></i>
                    <p>No levels created yet</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = levels.map(level => `
            <div class="level-item bg-gray-700 border border-gray-600 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors"
                 data-level-id="${level.id}">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-blue-300">Level ${level.level_number}</h3>
                        <p class="text-sm text-gray-300">${level.name}</p>
                    </div>
                    <div class="text-xs text-gray-400">
                        Updated: ${new Date(level.updated_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.level-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const levelId = parseInt(e.currentTarget.dataset.levelId);
                this.selectLevel(levelId);
            });
        });
    }

    selectLevel(levelId) {
        const level = this.levels[this.currentRoom].find(l => l.id === levelId);
        if (!level) return;

        this.selectedLevel = level;
        
        // Update visual selection
        document.querySelectorAll('.level-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-level-id="${levelId}"]`).classList.add('selected');
        
        // Enable editor buttons
        document.getElementById('save-level-btn').disabled = false;
        document.getElementById('delete-level-btn').disabled = false;
        
        this.renderLevelEditor(level);
    }

    renderLevelEditor(level) {
        const editorContent = document.getElementById('editor-content');
        
        editorContent.innerHTML = `
            <div class="space-y-6">
                <!-- Basic Info -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Level Name</label>
                        <input type="text" id="level-name" value="${level.name}" 
                               class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Level Number</label>
                        <input type="number" id="level-number" value="${level.level_number}" readonly
                               class="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-300">
                    </div>
                </div>

                <!-- Level Data JSON Editor -->
                <div>
                    <label class="block text-sm font-medium mb-2">
                        Level Configuration 
                        <span class="text-xs text-gray-400">(JSON Format)</span>
                    </label>
                    <textarea id="level-data-editor" class="json-editor w-full" rows="20">${JSON.stringify(level.data, null, 2)}</textarea>
                </div>

                <!-- Template Helpers -->
                <div class="bg-gray-700 rounded-lg p-4">
                    <h3 class="font-bold text-blue-400 mb-3">Quick Templates</h3>
                    <div class="flex space-x-2">
                        <button id="load-template-btn" class="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-sm transition-colors">
                            Load Room Template
                        </button>
                        <button id="validate-json-btn" class="bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-sm transition-colors">
                            Validate JSON
                        </button>
                        <button id="format-json-btn" class="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-sm transition-colors">
                            Format JSON
                        </button>
                    </div>
                </div>

                <!-- Level Preview -->
                <div class="bg-gray-700 rounded-lg p-4">
                    <h3 class="font-bold text-blue-400 mb-3">Level Preview</h3>
                    <div id="level-preview" class="bg-gray-800 rounded p-3 text-sm">
                        <div class="grid grid-cols-2 gap-4 text-xs">
                            <div><strong>Name:</strong> <span class="preview-name">${level.name}</span></div>
                            <div><strong>Type:</strong> <span class="preview-type">${level.data.taskType || 'Not set'}</span></div>
                            <div><strong>Character:</strong> <span class="preview-character">${level.data.character || 'Not set'}</span></div>
                            <div><strong>Story:</strong> <span class="preview-story">${(level.data.story || '').substring(0, 50)}...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind editor events
        this.bindEditorEvents();
    }

    bindEditorEvents() {
        // Template loader
        document.getElementById('load-template-btn').addEventListener('click', () => {
            this.loadTemplate();
        });

        // JSON validation
        document.getElementById('validate-json-btn').addEventListener('click', () => {
            this.validateJSON();
        });

        // JSON formatting
        document.getElementById('format-json-btn').addEventListener('click', () => {
            this.formatJSON();
        });

        // Real-time preview updates
        document.getElementById('level-name').addEventListener('input', () => {
            this.updatePreview();
        });

        document.getElementById('level-data-editor').addEventListener('input', () => {
            this.updatePreview();
        });
    }

    loadTemplate() {
        const template = this.roomTemplates[this.currentRoom];
        if (template) {
            document.getElementById('level-data-editor').value = JSON.stringify(template, null, 2);
            this.updatePreview();
            this.showMessage('Template loaded successfully', 'success');
        }
    }

    validateJSON() {
        try {
            const jsonText = document.getElementById('level-data-editor').value;
            JSON.parse(jsonText);
            this.showMessage('JSON is valid!', 'success');
        } catch (error) {
            this.showMessage(`JSON Error: ${error.message}`, 'error');
        }
    }

    formatJSON() {
        try {
            const jsonText = document.getElementById('level-data-editor').value;
            const parsed = JSON.parse(jsonText);
            document.getElementById('level-data-editor').value = JSON.stringify(parsed, null, 2);
            this.showMessage('JSON formatted successfully', 'success');
        } catch (error) {
            this.showMessage(`Cannot format invalid JSON: ${error.message}`, 'error');
        }
    }

    updatePreview() {
        try {
            const name = document.getElementById('level-name').value;
            const jsonText = document.getElementById('level-data-editor').value;
            const data = JSON.parse(jsonText);
            
            document.querySelector('.preview-name').textContent = name || 'Unnamed Level';
            document.querySelector('.preview-type').textContent = data.taskType || 'Not set';
            document.querySelector('.preview-character').textContent = data.character || 'Not set';
            document.querySelector('.preview-story').textContent = (data.story || 'No story set').substring(0, 50) + '...';
        } catch (error) {
            // Preview will show invalid data indication
        }
    }

    clearEditor() {
        this.selectedLevel = null;
        document.getElementById('editor-content').innerHTML = `
            <div class="text-center text-gray-400 py-12">
                <i class="bi bi-arrow-left text-4xl mb-2"></i>
                <p>Select a level to edit or create a new one</p>
            </div>
        `;
        document.getElementById('save-level-btn').disabled = true;
        document.getElementById('delete-level-btn').disabled = true;
    }

    showCreateLevelModal() {
        document.getElementById('create-level-modal').classList.remove('hidden');
        document.getElementById('create-level-modal').classList.add('flex');
    }

    hideCreateLevelModal() {
        document.getElementById('create-level-modal').classList.add('hidden');
        document.getElementById('create-level-modal').classList.remove('flex');
        document.getElementById('create-level-form').reset();
    }

    showImportModal() {
        document.getElementById('import-levels-modal').classList.remove('hidden');
        document.getElementById('import-levels-modal').classList.add('flex');
    }

    hideImportModal() {
        document.getElementById('import-levels-modal').classList.add('hidden');
        document.getElementById('import-levels-modal').classList.remove('flex');
        document.getElementById('import-levels-form').reset();
    }

    async createLevel(form) {
        try {
            const formData = new FormData(form);
            const data = {
                room_id: this.currentRoom,
                level_number: parseInt(formData.get('level_number')),
                name: formData.get('name'),
                data: this.roomTemplates[this.currentRoom] || {}
            };

            const response = await fetch('/api/admin/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.hideCreateLevelModal();
                this.loadLevelsForRoom(this.currentRoom);
                this.showMessage('Level created successfully', 'success');
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to create level', 'error');
            console.error(error);
        }
    }

    async saveCurrentLevel() {
        if (!this.selectedLevel) return;

        try {
            const name = document.getElementById('level-name').value;
            const jsonText = document.getElementById('level-data-editor').value;
            
            // Validate JSON
            const data = JSON.parse(jsonText);
            
            const response = await fetch(`/api/admin/levels/${this.selectedLevel.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, data })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Update local data
                this.selectedLevel.name = name;
                this.selectedLevel.data = data;
                
                this.loadLevelsForRoom(this.currentRoom);
                this.showMessage('Level saved successfully', 'success');
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.showMessage('Invalid JSON format', 'error');
            } else {
                this.showMessage('Failed to save level', 'error');
                console.error(error);
            }
        }
    }

    async deleteCurrentLevel() {
        if (!this.selectedLevel) return;

        if (!confirm(`Are you sure you want to delete "${this.selectedLevel.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/levels/${this.selectedLevel.id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.clearEditor();
                this.loadLevelsForRoom(this.currentRoom);
                this.showMessage('Level deleted successfully', 'success');
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to delete level', 'error');
            console.error(error);
        }
    }

    async exportLevels() {
        try {
            const response = await fetch(`/api/admin/export-levels/${this.currentRoom}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `room_${this.currentRoom}_levels.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showMessage('Levels exported successfully', 'success');
            } else {
                this.showMessage('Failed to export levels', 'error');
            }
        } catch (error) {
            this.showMessage('Failed to export levels', 'error');
            console.error(error);
        }
    }

    async importLevels(form) {
        try {
            const formData = new FormData(form);
            const jsonText = formData.get('json_data');
            const overwrite = formData.get('overwrite') === 'on';
            
            // Parse and validate JSON
            const importData = JSON.parse(jsonText);
            
            const data = {
                room_id: this.currentRoom,
                levels: importData.levels || [],
                overwrite: overwrite
            };

            const response = await fetch('/api/admin/import-levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.hideImportModal();
                this.loadLevelsForRoom(this.currentRoom);
                this.showMessage(result.message, 'success');
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.showMessage('Invalid JSON format', 'error');
            } else {
                this.showMessage('Failed to import levels', 'error');
                console.error(error);
            }
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white ${
            type === 'error' ? 'bg-red-600' : 
            type === 'success' ? 'bg-green-600' : 
            'bg-blue-600'
        }`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize level editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LevelEditor();
});
