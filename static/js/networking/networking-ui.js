export class NetworkingUI {
    constructor(room) {
        this.room = room;
    }

    render() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-diagram-3 text-6xl text-blue-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-blue-400">FLOWCHART CONSTRUCTION LAB</h2>
                    <p class="text-gray-300 mt-2">Learn to create proper flowcharts step by step!</p>
                </div>
                
                <div class="defense-status grid grid-cols-3 gap-4 mb-6">
                    <div class="status-card bg-green-900 p-4 rounded text-center">
                        <i class="bi bi-check-circle text-green-400 text-2xl"></i>
                        <p class="text-sm text-green-200">Completion Score</p>
                        <p id="network-integrity" class="text-2xl font-bold text-green-100">${Math.round(this.room.completionScore)}%</p>
                        <p class="text-xs ${this.room.completionScore > 70 ? 'text-green-400' : 'text-yellow-400'}">
                            ${this.room.completionScore > 70 ? 'EXCELLENT' : 'LEARNING'}
                        </p>
                    </div>
                    <div class="status-card bg-purple-900 p-4 rounded text-center">
                        <i class="bi bi-puzzle text-purple-400 text-2xl"></i>
                        <p class="text-sm text-purple-200">Nodes Placed</p>
                        <p id="attacks-blocked" class="text-2xl font-bold text-purple-100">${this.room.nodesPlaced}</p>
                        <p class="text-xs text-purple-300">Progress</p>
                    </div>
                    <div class="status-card bg-yellow-900 p-4 rounded text-center">
                        <i class="bi bi-layers text-yellow-400 text-2xl"></i>
                        <p class="text-sm text-yellow-200">Current Level</p>
                        <p id="wave-progress" class="text-2xl font-bold text-yellow-100">${this.room.currentLevel}/${this.room.maxLevels}</p>
                        <p class="text-xs text-yellow-300">${this.room.getCurrentLevelName()}</p>
                    </div>
                </div>

                <div class="challenge-content bg-gray-700 p-6 rounded-lg">
                    <div class="flex gap-4 mb-4">
                        <!-- Flowchart Canvas -->
                        <div class="game-area-container bg-black rounded-lg p-4 flex-1">
                            <h4 class="text-white font-bold mb-3 text-center">🔄 FLOWCHART CANVAS</h4>
                            <div id="defense-game" class="relative bg-gray-900 rounded" style="width: 800px; height: 600px; margin: 0 auto; border: 2px solid #4299e1;">
                                <!-- Flowchart creation area -->
                            </div>
                        </div>
                        
                        <!-- Tool Palette -->
                        <div class="tool-palette bg-gray-800 rounded-lg p-4" style="width: 200px;">
                            <h4 class="text-white font-bold mb-3 text-center">🛠️ TOOLS</h4>
                            <div id="flowchart-tools" class="space-y-2">
                                <!-- Tools will be populated by setupFlowchartTools -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Instructions Panel -->
                    <div class="instruction-panel bg-gray-800 p-4 rounded-lg mb-4">
                        <div class="flex items-start gap-4 mb-3">
                            <div class="scenario-info flex-1">
                                <h4 class="text-white font-bold mb-2 flex items-center">
                                    📋 <span id="scenario-title" class="ml-2">${this.room.getCurrentLevelName()}</span>
                                </h4>
                                <div class="scenario-context bg-gray-700 p-3 rounded mb-3">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-blue-400 font-bold">🎭 Scenario:</span>
                                        <span id="scenario-name" class="text-blue-300">${this.room.getCurrentScenario()}</span>
                                    </div>
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-green-400 font-bold">👤 Character:</span>
                                        <span id="character-name" class="text-green-300">${this.room.getCurrentCharacter()}</span>
                                    </div>
                                    <div class="text-gray-300 text-sm">
                                        <span class="text-purple-400 font-bold">📖 Story:</span>
                                        <p id="scenario-story" class="mt-1">${this.room.getCurrentStory()}</p>
                                    </div>
                                </div>
                                <div class="task-instruction bg-blue-900 p-3 rounded">
                                    <p class="text-blue-200 font-bold mb-1">🎯 Your Task:</p>
                                    <p id="current-instruction" class="text-gray-300 text-sm">${this.room.getCurrentInstruction()}</p>
                                </div>
                            </div>
                        </div>
                        <div class="hint-section bg-gray-700 p-3 rounded">
                            <span class="text-xs text-gray-400">💡 Hint: </span>
                            <span id="current-hint" class="text-xs text-blue-300">${this.room.getCurrentHint()}</span>
                        </div>
                    </div>
                    
                    <div class="control-buttons text-center mb-4">
                        <button id="start-defense" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-sm transition-colors mr-2">
                            <i class="bi bi-play-fill"></i> ${this.room.isLearning ? 'Continue Learning' : 'Start Learning'}
                        </button>
                        <button id="check-solution" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm transition-colors mr-2">
                            <i class="bi bi-check-square"></i> Check Solution
                        </button>
                        <button id="get-hint" class="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg text-sm transition-colors mr-2">
                            <i class="bi bi-lightbulb"></i> Get Hint
                        </button>
                        <button id="reset-canvas" class="bg-orange-600 hover:bg-orange-700 px-6 py-2 rounded-lg text-sm transition-colors mr-2">
                            <i class="bi bi-arrow-clockwise"></i> Reset Canvas
                        </button>
                        <button id="emergency-retreat" class="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg text-sm transition-colors">
                            <i class="bi bi-x-circle"></i> Exit Lab
                        </button>
                    </div>
                    
                    <div class="instructions text-center text-sm text-gray-400">
                        <p class="mb-2">🎯 Complete ${this.room.maxLevels} flowchart exercises to master flowchart creation</p>
                        <p class="mb-2">🔄 Place flowchart elements and connect them with arrows</p>
                        <p class="text-yellow-300">⚠️ <strong>Required:</strong> Use arrows to connect all nodes before advancing!</p>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.setupFlowchartTools();
    }

    setupEventListeners() {
        document.getElementById('start-defense').addEventListener('click', () => {
            this.room.startLearning();
        });

        document.getElementById('check-solution').addEventListener('click', () => {
            this.room.checkSolution();
        });

        document.getElementById('get-hint').addEventListener('click', () => {
            this.room.showHint();
        });

        document.getElementById('emergency-retreat').addEventListener('click', () => {
            this.room.exitLab();
        });

        document.getElementById('reset-canvas').addEventListener('click', () => {
            this.room.resetCanvas();
        });
    }

    setupFlowchartTools() {
        const toolsContainer = document.getElementById('flowchart-tools');
        const tools = [
            { type: 'oval', icon: '⭕', name: 'Oval', description: 'Start/End', color: '#10b981' },
            { type: 'rectangle', icon: '⬜', name: 'Rectangle', description: 'Process', color: '#3b82f6' },
            { type: 'diamond', icon: '♦️', name: 'Diamond', description: 'Decision', color: '#f59e0b' },
            { type: 'parallelogram', icon: '▱', name: 'Parallelogram', description: 'Input/Output', color: '#8b5cf6' },
            { type: 'arrow', icon: '➡️', name: 'Arrows', description: 'Connect Nodes', color: '#6b7280' },
            { type: 'delete', icon: '🗑️', name: 'Delete', description: 'Remove Elements', color: '#ef4444' }
        ];

        tools.forEach(tool => {
            const toolElement = document.createElement('div');
            toolElement.className = 'tool-item p-3 rounded cursor-pointer border-2 border-gray-600 hover:border-blue-400 transition-colors mb-2';
            toolElement.style.backgroundColor = tool.color + '20';
            toolElement.setAttribute('data-tool-type', tool.type);
            toolElement.innerHTML = `
                <div class="text-center">
                    <div class="text-2xl mb-1">${tool.icon}</div>
                    <div class="text-xs font-bold text-white">${tool.name}</div>
                    <div class="text-xs text-gray-300">${tool.description}</div>
                </div>
            `;
            
            toolElement.addEventListener('click', () => {
                this.selectTool(tool.type);
            });
            
            toolsContainer.appendChild(toolElement);
        });
    }

    setupDefenseGame() {
        const gameArea = document.getElementById('defense-game');
        if (!gameArea) {
            console.error('Game area not found');
            return;
        }
        
        // Clear any existing content
        gameArea.innerHTML = '';
        
        // Add grid background for alignment
        this.addGridBackground(gameArea);
        
        // Add drop zones and interaction handlers
        this.setupCanvasInteraction(gameArea);
        
        console.log('Flowchart learning game setup complete');
    }

    addGridBackground(gameArea) {
        gameArea.style.backgroundImage = `
            linear-gradient(to right, rgba(75, 85, 99, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75, 85, 99, 0.3) 1px, transparent 1px)
        `;
        gameArea.style.backgroundSize = '20px 20px';
    }

    setupCanvasInteraction(gameArea) {
        gameArea.addEventListener('click', (e) => {
            if (!this.room.selectedTool || !this.room.isLearning) return;
            
            const rect = gameArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            console.log(`Canvas clicked at (${x}, ${y}) with tool: ${this.room.selectedTool}`);
            
            if (this.room.selectedTool === 'arrow') {
                // Clear any pending connection when clicking empty space
                if (this.room.connectionStart) {
                    this.clearHighlight(this.room.connectionStart.id);
                    this.room.connectionStart = null;
                    this.showMessage('Connection cancelled. Select a node to start connecting.', 'info');
                } else {
                    this.showMessage('Select a node to start connecting with arrows', 'info');
                }
                return;
            } else if (this.room.selectedTool === 'delete') {
                this.showMessage('Click on a node or connection to delete it', 'info');
                return;
            } else {
                // Handle node placement
                const gridX = Math.round(x / 20) * 20;
                const gridY = Math.round(y / 20) * 20;
                this.room.placeFlowchartNode(this.room.selectedTool, gridX, gridY);
            }
        });
    }

    handleArrowConnection(x, y) {
        // This method is no longer needed since we handle connections in setupNodeInteraction
    }

    showConnectionPreview(startNode, mouseX, mouseY) {
        // Remove connection preview functionality
        // Users will connect manually by clicking nodes
    }

    clearConnectionPreview() {
        // No preview to clear
    }

    selectTool(toolType) {
        // Clear any existing connection state when switching tools
        if (this.room.connectionStart) {
            this.clearHighlight(this.room.connectionStart.id);
            this.room.connectionStart = null;
            console.log('Cleared connection state when switching tools');
        }
        
        // Remove previous selection
        document.querySelectorAll('.tool-item').forEach(tool => {
            tool.classList.remove('border-blue-400');
            tool.classList.add('border-gray-600');
        });
        
        // Select current tool
        const selectedTool = document.querySelector(`[data-tool-type="${toolType}"]`);
        if (selectedTool) {
            selectedTool.classList.remove('border-gray-600');
            selectedTool.classList.add('border-blue-400');
        }
        
        this.room.selectedTool = toolType;
        console.log(`Tool selected: ${toolType}`);
        
        if (toolType === 'arrow') {
            this.showMessage('Arrow tool active: Click a node to start, then click another node to connect them. Connections are REQUIRED to advance!', 'info');
        } else if (toolType === 'delete') {
            this.showMessage('Delete tool selected: Click on any node or connection to remove it from the flowchart', 'info');
        } else {
            this.showMessage(`${toolType} tool selected - Click on canvas to place`, 'info');
        }
    }

    highlightNode(nodeId, color) {
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.style.border = `3px solid ${color}`;
            nodeElement.style.boxShadow = `0 0 15px ${color}`;
        }
    }

    clearHighlight(nodeId) {
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.style.border = '2px solid rgba(255, 255, 255, 0.3)';
            nodeElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        }
    }

    updateDisplay() {
        // Update completion score
        const scoreDisplay = document.getElementById('network-integrity');
        if (scoreDisplay) {
            scoreDisplay.textContent = `${Math.round(this.room.completionScore)}%`;
            
            const statusCard = scoreDisplay.closest('.status-card');
            const statusText = statusCard.querySelector('.text-xs');
            
            if (this.room.completionScore > 80) {
                statusText.textContent = 'EXCELLENT';
                statusText.className = 'text-xs text-green-400';
            } else if (this.room.completionScore > 60) {
                statusText.textContent = 'GOOD';
                statusText.className = 'text-xs text-blue-400';
            } else {
                statusText.textContent = 'LEARNING';
                statusText.className = 'text-xs text-yellow-400';
            }
        }
        
        // Update nodes placed
        const nodesDisplay = document.getElementById('attacks-blocked');
        if (nodesDisplay) {
            nodesDisplay.textContent = this.room.nodesPlaced;
        }
        
        // Update level progress
        const levelDisplay = document.getElementById('wave-progress');
        if (levelDisplay) {
            levelDisplay.textContent = `${this.room.currentLevel}/${this.room.maxLevels}`;
        }
        
        // Update scenario information
        const scenarioTitle = document.getElementById('scenario-title');
        if (scenarioTitle) {
            scenarioTitle.textContent = this.room.getCurrentLevelName();
        }
        
        const scenarioName = document.getElementById('scenario-name');
        if (scenarioName) {
            scenarioName.textContent = this.room.getCurrentScenario();
        }
        
        const characterName = document.getElementById('character-name');
        if (characterName) {
            characterName.textContent = this.room.getCurrentCharacter();
        }
        
        const scenarioStory = document.getElementById('scenario-story');
        if (scenarioStory) {
            scenarioStory.textContent = this.room.getCurrentStory();
        }
        
        // Update current instruction
        const instructionDisplay = document.getElementById('current-instruction');
        if (instructionDisplay) {
            instructionDisplay.textContent = this.room.getCurrentInstruction();
        }
        
        // Update hint
        const hintDisplay = document.getElementById('current-hint');
        if (hintDisplay) {
            hintDisplay.textContent = this.room.getCurrentHint();
        }
        
        // Clear any pending connection highlights when updating display
        if (this.room.connectionStart) {
            // Don't auto-clear here as it might be needed, but ensure state is consistent
            console.log('Connection state exists during display update');
        }
    }

    clearAllHighlights() {
        // Method to clear all node highlights
        document.querySelectorAll('.flowchart-node').forEach(node => {
            node.style.border = '2px solid rgba(255, 255, 255, 0.3)';
            node.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        });
    }

    renderSuccessScreen() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="defense-success text-center p-8">
                <i class="bi bi-trophy-fill text-8xl text-green-400 mb-4 animate-bounce"></i>
                <h2 class="text-3xl font-bold text-green-400 mb-4">FLOWCHART MASTERY ACHIEVED!</h2>
                
                <div class="final-stats grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-green-800 p-4 rounded">
                        <p class="text-green-200">Final Score</p>
                        <p class="text-2xl font-bold text-green-400">${Math.round(this.room.completionScore)}%</p>
                        <p class="text-xs text-green-300">✓ Mastered</p>
                    </div>
                    <div class="bg-purple-800 p-4 rounded">
                        <p class="text-purple-200">Nodes Created</p>
                        <p class="text-2xl font-bold text-purple-400">${this.room.nodesPlaced}</p>
                        <p class="text-xs text-purple-300">✓ Experience</p>
                    </div>
                    <div class="bg-blue-800 p-4 rounded">
                        <p class="text-blue-200">Levels Completed</p>
                        <p class="text-2xl font-bold text-blue-400">${this.room.maxLevels}</p>
                        <p class="text-xs text-blue-300">✓ Full Course</p>
                    </div>
                </div>
                
                <div class="victory-report bg-gray-800 p-4 rounded mb-4">
                    <h4 class="font-bold text-gray-200 mb-2">🎓 Learning Report</h4>
                    <div class="text-left text-sm text-gray-300">
                        <p>✅ Flowchart fundamentals mastered</p>
                        <p>✅ Proper symbol usage learned</p>
                        <p>✅ Decision logic flow understood</p>
                        <p>✅ Process sequencing completed</p>
                        <p>✅ Input/Output handling practiced</p>
                        <p>✅ Ready to create professional flowcharts</p>
                    </div>
                </div>
            </div>
        `;
    }

    showValidationFeedback(isCorrect, feedback) {
        const gameArea = document.getElementById('defense-game');
        
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'absolute text-white font-bold text-lg animate-pulse';
        feedbackElement.style.left = '50%';
        feedbackElement.style.top = '10px';
        feedbackElement.style.transform = 'translateX(-50%)';
        feedbackElement.style.zIndex = '30';
        feedbackElement.style.backgroundColor = isCorrect ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        feedbackElement.style.padding = '10px 20px';
        feedbackElement.style.borderRadius = '8px';
        feedbackElement.style.border = `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`;
        feedbackElement.innerHTML = `
            <div class="text-center">
                <div class="text-2xl mb-2">${isCorrect ? '✅' : '❌'}</div>
                <div>${isCorrect ? 'Correct!' : 'Not quite right'}</div>
                <div class="text-sm mt-1">${feedback}</div>
            </div>
        `;
        
        gameArea.appendChild(feedbackElement);
        
        setTimeout(() => {
            if (feedbackElement.parentNode) {
                feedbackElement.remove();
            }
        }, 3000);
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
            default:
                messageDiv.classList.add('bg-gray-800', 'text-gray-200', 'border', 'border-gray-500');
        }
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 3000);
    }
}
