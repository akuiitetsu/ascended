class LevelEditor {
    constructor() {
        this.currentRoom = 1;
        this.selectedLevel = null;
        this.levels = {};
        this.currentTab = 'editor';
        this.sortable = null; // For drag and drop
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
        this.initTabs();
    }

    bindEvents() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

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

        // Populate defaults button
        document.getElementById('populate-defaults-btn').addEventListener('click', () => {
            this.populateDefaultLevels();
        });

        // Modal handlers
        document.getElementById('cancel-create')?.addEventListener('click', () => {
            this.hideCreateLevelModal();
        });

        document.getElementById('cancel-import')?.addEventListener('click', () => {
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

        // Guide modal handlers
        document.getElementById('close-import-example')?.addEventListener('click', () => {
            this.hideImportExample();
        });
    }

    initTabs() {
        // Show default tab
        this.switchTab(this.currentTab);
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
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

    async populateDefaultLevels() {
        const confirmed = confirm(
            'This will populate the database with default levels from the codebase. ' +
            'If levels already exist, this operation will not overwrite them. Continue?'
        );
        
        if (!confirmed) return;

        try {
            const response = await fetch('/api/admin/levels/populate-defaults', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            
            if (result.status === 'success' || result.status === 'info') {
                this.showMessage(result.message, result.status === 'success' ? 'success' : 'info');
                // Reload levels for current room
                this.loadLevelsForRoom(this.currentRoom);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to populate default levels', 'error');
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
                    <p>No levels found</p>
                    <button class="mt-2 text-green-400 hover:text-green-300 text-sm" onclick="levelEditor.populateDefaultLevels()">
                        <i class="bi bi-download"></i> Load Defaults
                    </button>
                </div>
            `;
            return;
        }

        // Sort levels by level_number
        const sortedLevels = levels.sort((a, b) => a.level_number - b.level_number);

        listContainer.innerHTML = `
            <div class="mb-3 flex items-center justify-between">
                <span class="text-sm text-gray-400">
                    <i class="bi bi-arrows-move"></i> Drag to reorder levels
                </span>
                <button id="save-order-btn" class="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-xs transition-colors hidden">
                    <i class="bi bi-save"></i> Save Order
                </button>
            </div>
            <div id="sortable-levels" class="space-y-2">
                ${sortedLevels.map(level => `
                    <div class="level-item bg-gray-700 border border-gray-600 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors flex items-center"
                         data-level-id="${level.id}" data-level-number="${level.level_number}">
                        <div class="drag-handle flex-shrink-0 mr-3">
                            <i class="bi bi-grip-vertical"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center">
                                <div class="min-w-0 flex-1">
                                    <h3 class="font-bold text-blue-300">Level ${level.level_number}</h3>
                                    <p class="text-sm text-gray-300 truncate">${level.name}</p>
                                    <p class="text-xs text-gray-400">${level.data.taskType || 'No task type'}</p>
                                </div>
                                <div class="text-xs text-gray-400 flex-shrink-0 ml-3">
                                    <div>Updated: ${new Date(level.updated_at).toLocaleDateString()}</div>
                                    <div class="text-center mt-1">
                                        <i class="bi bi-pencil text-blue-400" title="Click to edit"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Initialize drag and drop
        this.initializeDragAndDrop();

        // Add click handlers
        document.querySelectorAll('.level-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if dragging
                if (e.target.closest('.drag-handle')) return;
                
                const levelId = parseInt(e.currentTarget.dataset.levelId);
                this.selectLevel(levelId);
            });
        });

        // Save order button handler
        document.getElementById('save-order-btn')?.addEventListener('click', () => {
            this.saveLevelOrder();
        });
    }

    initializeDragAndDrop() {
        const sortableContainer = document.getElementById('sortable-levels');
        if (!sortableContainer) return;

        // Destroy existing sortable if it exists
        if (this.sortable) {
            this.sortable.destroy();
        }

        this.sortable = new Sortable(sortableContainer, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                this.onLevelReorder(evt);
            }
        });
    }

    onLevelReorder(evt) {
        // Show save order button
        const saveBtn = document.getElementById('save-order-btn');
        if (saveBtn) {
            saveBtn.classList.remove('hidden');
        }

        // Update visual level numbers
        const levelItems = document.querySelectorAll('.level-item');
        levelItems.forEach((item, index) => {
            const levelNumberElement = item.querySelector('h3');
            levelNumberElement.textContent = `Level ${index + 1}`;
            item.dataset.newOrder = index + 1;
        });

        this.showMessage('Level order changed. Click "Save Order" to persist changes.', 'info');
    }

    async saveLevelOrder() {
        try {
            const levelItems = document.querySelectorAll('.level-item');
            const reorderData = [];

            levelItems.forEach((item, index) => {
                const levelId = parseInt(item.dataset.levelId);
                const newLevelNumber = index + 1;
                reorderData.push({
                    id: levelId,
                    level_number: newLevelNumber
                });
            });

            const response = await fetch('/api/admin/levels/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: this.currentRoom,
                    levels: reorderData
                })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Update local data
                this.levels[this.currentRoom].forEach(level => {
                    const reorderItem = reorderData.find(item => item.id === level.id);
                    if (reorderItem) {
                        level.level_number = reorderItem.level_number;
                    }
                });

                // Hide save button and refresh display
                document.getElementById('save-order-btn').classList.add('hidden');
                this.showMessage('Level order saved successfully', 'success');
                
                // Refresh the list to ensure consistency
                this.loadLevelsForRoom(this.currentRoom);
            } else {
                this.showMessage(result.message, 'error');
                // Revert the visual changes
                this.renderLevelsList();
            }
        } catch (error) {
            this.showMessage('Failed to save level order', 'error');
            console.error(error);
            // Revert the visual changes
            this.renderLevelsList();
        }
    }

    selectLevel(levelId) {
        // Find the level in current room
        const level = this.levels[this.currentRoom]?.find(l => l.id === levelId);
        if (!level) return;

        this.selectedLevel = level;
        
        // Update visual selection
        document.querySelectorAll('.level-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-level-id="${levelId}"]`)?.classList.add('selected');
        
        // Load level into editor
        this.loadLevelIntoEditor(level);
        
        // Enable editor buttons
        document.getElementById('save-level-btn').disabled = false;
        document.getElementById('delete-level-btn').disabled = false;
    }

    loadLevelIntoEditor(level) {
        const editorContent = document.getElementById('editor-content');
        
        editorContent.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Level Name</label>
                    <input type="text" id="level-name" value="${level.name}" 
                           class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                </div>
                
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-sm font-medium">Level Configuration (JSON)</label>
                        <div class="flex space-x-2">
                            <button id="format-json-btn" class="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs transition-colors">
                                <i class="bi bi-code"></i> Format JSON
                            </button>
                            <button id="validate-json-btn" class="bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs transition-colors">
                                <i class="bi bi-check-circle"></i> Validate
                            </button>
                            <button id="reset-template-btn" class="bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded text-xs transition-colors">
                                <i class="bi bi-arrow-clockwise"></i> Reset Template
                            </button>
                        </div>
                    </div>
                    <textarea id="level-data-editor" rows="20" 
                              class="w-full json-editor resize-vertical"
                              placeholder="Enter level configuration in JSON format...">${JSON.stringify(level.data, null, 2)}</textarea>
                </div>
                
                <div class="bg-gray-700 rounded-lg p-3">
                    <h4 class="font-semibold mb-2">Level Info</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-400">Room:</span> ${this.getRoomName(this.currentRoom)}
                        </div>
                        <div>
                            <span class="text-gray-400">Level Number:</span> ${level.level_number}
                        </div>
                        <div>
                            <span class="text-gray-400">Created:</span> ${new Date(level.created_at).toLocaleDateString()}
                        </div>
                        <div>
                            <span class="text-gray-400">Updated:</span> ${new Date(level.updated_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Bind helper button events
        this.bindEditorHelpers();
    }

    bindEditorHelpers() {
        // Format JSON button
        document.getElementById('format-json-btn')?.addEventListener('click', () => {
            try {
                const editor = document.getElementById('level-data-editor');
                const jsonData = JSON.parse(editor.value);
                editor.value = JSON.stringify(jsonData, null, 2);
                this.showMessage('JSON formatted successfully', 'success');
            } catch (error) {
                this.showMessage('Invalid JSON format', 'error');
            }
        });

        // Validate JSON button
        document.getElementById('validate-json-btn')?.addEventListener('click', () => {
            try {
                const editor = document.getElementById('level-data-editor');
                JSON.parse(editor.value);
                this.showMessage('JSON is valid', 'success');
            } catch (error) {
                this.showMessage(`JSON validation error: ${error.message}`, 'error');
            }
        });

        // Reset template button
        document.getElementById('reset-template-btn')?.addEventListener('click', () => {
            if (confirm('Reset to default template? This will lose all current changes.')) {
                const editor = document.getElementById('level-data-editor');
                const template = this.roomTemplates[this.currentRoom] || {};
                editor.value = JSON.stringify(template, null, 2);
                this.showMessage('Template reset successfully', 'info');
            }
        });
    }

    clearEditor() {
        this.selectedLevel = null;
        
        // Clear visual selection
        document.querySelectorAll('.level-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Reset editor content
        const editorContent = document.getElementById('editor-content');
        editorContent.innerHTML = `
            <div class="text-center text-gray-400 py-12">
                <i class="bi bi-arrow-left text-4xl mb-2"></i>
                <p>Select a level to edit or create a new one</p>
                <p class="text-sm mt-2">Click "Populate Defaults" to load levels from the codebase</p>
            </div>
        `;
        
        // Disable editor buttons
        document.getElementById('save-level-btn').disabled = true;
        document.getElementById('delete-level-btn').disabled = true;
    }

    getRoomName(roomId) {
        const roomNames = {
            1: 'Flowchart Lab',
            2: 'Network Nexus',
            3: 'AI Systems',
            4: 'Database Crisis',
            5: 'Programming Crisis'
        };
        return roomNames[roomId] || `Room ${roomId}`;
    }

    showCreateLevelModal() {
        const modal = document.getElementById('create-level-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Clear form
        const form = document.getElementById('create-level-form');
        form.reset();
        
        // Focus on name input
        const nameInput = form.querySelector('input[name="name"]');
        setTimeout(() => nameInput.focus(), 100);
    }

    hideCreateLevelModal() {
        const modal = document.getElementById('create-level-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    showImportModal() {
        const modal = document.getElementById('import-levels-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Clear form
        const form = document.getElementById('import-levels-form');
        form.reset();
        
        // Focus on textarea
        const textarea = form.querySelector('textarea[name="json_data"]');
        setTimeout(() => textarea.focus(), 100);
    }

    hideImportModal() {
        const modal = document.getElementById('import-levels-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    hideImportExample() {
        const modal = document.getElementById('import-example-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    async createLevel(form) {
        try {
            const formData = new FormData(form);
            const name = formData.get('name');
            
            if (!name || name.trim() === '') {
                this.showMessage('Level name is required', 'error');
                return;
            }

            // Get the next level number for this room
            const levels = this.levels[this.currentRoom] || [];
            const nextLevelNumber = levels.length > 0 ? Math.max(...levels.map(l => l.level_number)) + 1 : 1;

            // Get template for current room
            const template = this.roomTemplates[this.currentRoom] || {};
            
            const levelData = {
                room_id: this.currentRoom,
                level_number: nextLevelNumber,
                name: name.trim(),
                data: {
                    ...template,
                    name: name.trim()
                }
            };

            const response = await fetch('/api/admin/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(levelData)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.showMessage('Level created successfully', 'success');
                this.hideCreateLevelModal();
                
                // Reload levels for current room
                await this.loadLevelsForRoom(this.currentRoom);
                
                // Auto-select the new level
                const newLevel = this.levels[this.currentRoom]?.find(l => l.id === result.level_id);
                if (newLevel) {
                    this.selectLevel(newLevel.id);
                }
            } else {
                this.showMessage(result.message || 'Failed to create level', 'error');
            }
        } catch (error) {
            console.error('Create level error:', error);
            this.showMessage('Failed to create level', 'error');
        }
    }

    async saveCurrentLevel() {
        if (!this.selectedLevel) {
            this.showMessage('No level selected', 'error');
            return;
        }

        try {
            const nameInput = document.getElementById('level-name');
            const dataEditor = document.getElementById('level-data-editor');
            
            if (!nameInput || !dataEditor) {
                this.showMessage('Editor not properly loaded', 'error');
                return;
            }

            const name = nameInput.value.trim();
            if (!name) {
                this.showMessage('Level name is required', 'error');
                return;
            }

            // Validate JSON
            let levelData;
            try {
                levelData = JSON.parse(dataEditor.value);
            } catch (jsonError) {
                this.showMessage(`Invalid JSON: ${jsonError.message}`, 'error');
                return;
            }

            const updateData = {
                name: name,
                data: levelData
            };

            const response = await fetch(`/api/admin/levels/${this.selectedLevel.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.showMessage('Level saved successfully', 'success');
                
                // Update local data
                this.selectedLevel.name = name;
                this.selectedLevel.data = levelData;
                this.selectedLevel.updated_at = new Date().toISOString();
                
                // Refresh the levels list to show updated data
                this.renderLevelsList();
                
                // Re-select the current level to maintain editor state
                this.selectLevel(this.selectedLevel.id);
            } else {
                this.showMessage(result.message || 'Failed to save level', 'error');
            }
        } catch (error) {
            console.error('Save level error:', error);
            this.showMessage('Failed to save level', 'error');
        }
    }

    async deleteCurrentLevel() {
        if (!this.selectedLevel) {
            this.showMessage('No level selected', 'error');
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to delete level "${this.selectedLevel.name}"?\n\n` +
            'This action cannot be undone. Consider exporting the level first as a backup.'
        );
        
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/admin/levels/${this.selectedLevel.id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.showMessage('Level deleted successfully', 'success');
                
                // Clear editor and reload levels
                this.clearEditor();
                await this.loadLevelsForRoom(this.currentRoom);
            } else {
                this.showMessage(result.message || 'Failed to delete level', 'error');
            }
        } catch (error) {
            console.error('Delete level error:', error);
            this.showMessage('Failed to delete level', 'error');
        }
    }

    async importLevels(form) {
        try {
            const formData = new FormData(form);
            const jsonData = formData.get('json_data');
            const overwrite = formData.get('overwrite') === 'on';
            
            if (!jsonData || jsonData.trim() === '') {
                this.showMessage('JSON data is required', 'error');
                return;
            }

            // Validate JSON
            let importData;
            try {
                importData = JSON.parse(jsonData);
            } catch (jsonError) {
                this.showMessage(`Invalid JSON: ${jsonError.message}`, 'error');
                return;
            }

            // Validate structure
            if (!importData.levels || !Array.isArray(importData.levels)) {
                this.showMessage('JSON must contain a "levels" array', 'error');
                return;
            }

            const requestData = {
                room_id: this.currentRoom,
                levels: importData.levels,
                overwrite: overwrite
            };

            const response = await fetch('/api/admin/import-levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.showMessage(result.message || 'Levels imported successfully', 'success');
                this.hideImportModal();
                
                // Reload levels for current room
                await this.loadLevelsForRoom(this.currentRoom);
            } else {
                this.showMessage(result.message || 'Failed to import levels', 'error');
            }
        } catch (error) {
            console.error('Import levels error:', error);
            this.showMessage('Failed to import levels', 'error');
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
                const result = await response.json();
                this.showMessage(result.message || 'Failed to export levels', 'error');
            }
        } catch (error) {
            console.error('Export levels error:', error);
            this.showMessage('Failed to export levels', 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.level-editor-message');
        existingMessages.forEach(msg => msg.remove());

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `level-editor-message fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white font-medium shadow-lg max-w-md`;
        
        switch (type) {
            case 'success':
                messageDiv.className += ' bg-green-600';
                break;
            case 'error':
                messageDiv.className += ' bg-red-600';
                break;
            case 'warning':
                messageDiv.className += ' bg-yellow-600';
                break;
            case 'info':
            default:
                messageDiv.className += ' bg-blue-600';
                break;
        }
        
        messageDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="bi ${type === 'success' ? 'bi-check-circle' : 
                                  type === 'error' ? 'bi-x-circle' : 
                                  type === 'warning' ? 'bi-exclamation-triangle' : 
                                  'bi-info-circle'} mr-2"></i>
                    <span class="text-sm">${message}</span>
                </div>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="bi bi-x text-lg"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Global functions for guide interactions
function showImportExample() {
    document.getElementById('import-example-modal').classList.remove('hidden');
    document.getElementById('import-example-modal').classList.add('flex');
}

function hideImportExample() {
    document.getElementById('import-example-modal').classList.add('hidden');
    document.getElementById('import-example-modal').classList.remove('flex');
}

// Initialize level editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.levelEditor = new LevelEditor();
    
    // Make guide functions globally available
    window.showImportExample = showImportExample;
});