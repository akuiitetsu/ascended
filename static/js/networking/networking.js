// Import all modules using ES6 imports
import { ShieldManager } from './shield-manager.js';
import { FlowchartManager } from './attack-manager.js';
import { LevelManager } from './wave-manager.js';
import { AudioManager } from './audio-manager.js';
import { NetworkingUI } from './networking-ui.js';

class Room1 {
    constructor(game) {
        this.game = game;
        this.completionScore = 0;
        this.nodesPlaced = 0;
        this.currentLevel = 1;
        this.maxLevels = 5;
        this.isLearning = false;
        this.selectedTool = null;
        this.placedNodes = [];
        this.currentLevelData = null;
        this.hintsUsed = 0;
        this.shieldPosition = { x: 300, y: 200 };
        this.shieldSize = 60;
        this.shieldStrength = 100;
        this.connectionStart = null; // For arrow tool connections

        // Drag and drop state
        this.isDragging = false;
        this.dragData = null;

        // Initialize managers
        this.shieldManager = new ShieldManager(this);
        this.flowchartManager = new FlowchartManager(this);
        this.levelManager = new LevelManager(this);
        this.audioManager = new AudioManager(this);
        this.ui = new NetworkingUI(this);
    }

    async init() {
        try {
            const response = await fetch('data/flowchart-levels.json');
            this.levelData = await response.json();
        } catch (error) {
            console.warn('Could not load level data, using defaults:', error);
            this.levelData = this.createDefaultLevelData();
        }
        await this.audioManager.loadSounds();
        this.render();
        // Don't auto-setup the learning game - wait for start button
    }

    createDefaultLevelData() {
        return {
            levels: [
                {
                    id: 1,
                    name: "Basic Start-End Flow",
                    instruction: "Create a simple flowchart with START and END nodes",
                    hint: "Every flowchart needs a START (circle) and END (circle) node"
                },
                // Add more levels as needed
            ]
        };
    }

    render() {
        this.ui.render();
    }

    setupLearningGame() {
        this.ui.setupDefenseGame();
        this.loadCurrentLevel();
        
        // Setup drag and drop for canvas
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const canvas = document.getElementById('flowchart-canvas');
        if (canvas) {
            canvas.addEventListener('dragover', (e) => this.handleDragOver(e));
            canvas.addEventListener('drop', (e) => this.handleDrop(e));
            canvas.addEventListener('dragenter', (e) => e.preventDefault());
            canvas.addEventListener('dragleave', (e) => e.preventDefault());
        }
    }

    startLearning() {
        if (this.isLearning) return;
        
        this.isLearning = true;
        this.audioManager.playSound('defense_start');
        
        // Now setup the learning game when start button is pressed
        this.setupLearningGame();
        
        this.updateDisplay();
        this.showMessage('Flowchart learning started! Follow the instructions to create proper flowcharts.', 'info');
    }

    loadCurrentLevel() {
        this.currentLevelData = this.levelManager.getLevelData(this.currentLevel);
        this.placedNodes = [];
        this.nodesPlaced = 0;
        this.hintsUsed = 0;
        this.connectionStart = null; // Clear any pending connections
        
        // Clear the visual canvas completely using flowchartManager
        this.flowchartManager.clearCanvas();
        
        this.updateDisplay();
        
        console.log(`Loaded level ${this.currentLevel} - canvas cleared`);
    }

    placeFlowchartNode(toolType, x, y) {
        if (!this.isLearning) {
            this.showMessage('Please click "Start Learning" to begin placing flowchart elements!', 'error');
            return;
        }
        
        const nodeId = `node_${Date.now()}`;
        const node = {
            id: nodeId,
            type: toolType,
            x: x,
            y: y
        };
        
        this.placedNodes.push(node);
        this.nodesPlaced++;
        this.flowchartManager.createNodeElement(node);
        this.updateDisplay();
        
        this.audioManager.playSound('alien_spawn'); // Reuse as "place" sound
    }

    createConnection(fromNodeId, toNodeId) {
        // Create visual connection between nodes
        this.flowchartManager.createConnection(fromNodeId, toNodeId);
        
        // Play sound feedback
        this.audioManager.playSound('alien_spawn'); // Reuse as "connection" sound
        
        console.log(`Connection created from ${fromNodeId} to ${toNodeId}`);
    }

    checkSolution() {
        if (!this.isLearning || !this.currentLevelData) {
            this.showMessage('Please click "Start Learning" first!', 'error');
            return;
        }
        
        const validation = this.levelManager.validateSolution(this.placedNodes, this.currentLevelData);
        
        if (validation.isCorrect) {
            this.completionScore = Math.min(100, this.completionScore + (20 - this.hintsUsed * 2));
            this.ui.showValidationFeedback(true, validation.feedback);
            this.audioManager.playSound('wave_complete');
            
            setTimeout(() => {
                this.nextLevel();
            }, 2000);
        } else {
            this.ui.showValidationFeedback(false, validation.feedback);
            this.audioManager.playSound('network_hit');
        }
    }

    showHint() {
        if (!this.isLearning || !this.currentLevelData) {
            this.showMessage('Please click "Start Learning" to begin using hints!', 'error');
            return;
        }
        
        this.hintsUsed++;
        const hint = this.levelManager.getHint(this.currentLevelData, this.hintsUsed);
        this.showMessage(hint, 'info');
    }

    nextLevel() {
        this.currentLevel++;
        
        if (this.currentLevel > this.maxLevels) {
            this.learningComplete();
        } else {
            // Clear any active connection state before loading new level
            if (this.connectionStart) {
                this.ui.clearHighlight(this.connectionStart.id);
                this.connectionStart = null;
            }
            
            this.loadCurrentLevel();
            this.showMessage(`Level ${this.currentLevel} unlocked! Canvas reset for new challenge.`, 'success');
        }
    }

    learningComplete() {
        this.isLearning = false;
        this.audioManager.playSound('defense_complete');
        
        this.ui.renderSuccessScreen();
        
        setTimeout(() => {
            // Enhanced completion data for badge system
            const completionData = {
                score: Math.round(this.completionScore),
                timeSpent: Date.now() - (this.startTime || Date.now()), // Milliseconds
                hintsUsed: this.hintsUsed,
                nodesPlaced: this.nodesPlaced,
                levelsCompleted: this.currentLevel,
                attempts: 1
            };
            
            this.game.roomCompleted(
                `Flowchart mastery achieved! Created ${this.nodesPlaced} flowchart elements with ${Math.round(this.completionScore)}% completion score. Ready to design professional flowcharts!`,
                completionData
            );
        }, 3000);
    }

    getCurrentLevelName() {
        return this.currentLevelData ? this.currentLevelData.name : 'Welcome to Flowchart Design';
    }

    getCurrentScenario() {
        return this.currentLevelData ? this.currentLevelData.scenario : 'Getting Started';
    }

    getCurrentCharacter() {
        return this.currentLevelData ? this.currentLevelData.character : '👨‍💻 Tutorial Guide';
    }

    getCurrentStory() {
        return this.currentLevelData ? this.currentLevelData.story : 'Learn the basics of flowchart creation step by step.';
    }

    getCurrentInstruction() {
        return this.currentLevelData ? this.currentLevelData.instruction : 'Select "Start Learning" to begin your flowchart journey';
    }

    getCurrentHint() {
        return this.currentLevelData ? this.currentLevelData.hint : 'Use the tools on the right to build your flowchart';
    }

    updateDisplay() {
        this.ui.updateDisplay();
    }

    exitLab() {
        this.game.gameOver('Flowchart lab session ended. Learning progress saved.');
    }

    playSound(soundType) {
        this.audioManager.playSound(soundType);
    }

    showMessage(message, type) {
        this.ui.showMessage(message, type);
    }

    cleanup() {
        this.isLearning = false;
        if (this.flowchartManager) {
            this.flowchartManager.clearCanvas();
        }
    }

    resetCanvas() {
        // Confirm with user before resetting
        const confirmed = confirm('Are you sure you want to reset the canvas? This will clear all placed nodes and connections.');
        
        if (confirmed) {
            // Clear any pending connections
            if (this.connectionStart) {
                this.ui.clearHighlight(this.connectionStart.id);
                this.connectionStart = null;
            }
            
            // Clear all placed nodes from room data
            this.placedNodes = [];
            this.nodesPlaced = 0;
            
            // Clear the visual canvas
            this.flowchartManager.clearCanvas();
            
            // Update display
            this.updateDisplay();
            
            // Play sound feedback
            this.audioManager.playSound('alien_spawn'); // Reuse as "reset" sound
            
            // Show confirmation message
            this.showMessage('Canvas reset! Start placing nodes to build your flowchart.', 'info');
            
            console.log('Canvas reset successfully');
        }
    }

    deleteElement(elementId, elementType) {
        if (elementType === 'node') {
            this.flowchartManager.handleNodeDeletion(elementId);
        } else if (elementType === 'connection') {
            // Connection deletion is handled in the flowchart manager
            console.log('Connection deletion triggered');
        }
    }

    // Drag and drop event handlers
    handleDragStart(event, node) {
        if (!this.isLearning) {
            event.preventDefault();
            this.showMessage('Please click "Start Learning" to begin moving nodes!', 'error');
            return;
        }
        
        this.isDragging = true;
        this.dragData = {
            id: node.id,
            type: node.type,
            offsetX: event.offsetX,
            offsetY: event.offsetY
        };
        
        // Visual feedback for dragging
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', node.id);
        
        console.log(`Drag started for node ${node.id}`);
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        // Visual feedback for valid drop target
        if (this.flowchartManager && this.flowchartManager.highlightDropTarget) {
            this.flowchartManager.highlightDropTarget(event.offsetX, event.offsetY);
        }
    }

    handleDrop(event) {
        event.preventDefault();
        
        if (!this.isLearning) {
            this.showMessage('Please click "Start Learning" to interact with flowchart elements!', 'error');
            return;
        }
        
        if (!this.isDragging || !this.dragData) return;
        
        const dropX = event.offsetX;
        const dropY = event.offsetY;
        
        // Logic to snap to grid or closest position
        const snappedPosition = this.snapToGrid(dropX, dropY);
        
        // Update node position
        const nodeId = this.dragData.id;
        const node = this.placedNodes.find(n => n.id === nodeId);
        if (node) {
            node.x = snappedPosition.x;
            node.y = snappedPosition.y;
            
            if (this.flowchartManager && this.flowchartManager.updateNodeElement) {
                this.flowchartManager.updateNodeElement(node);
            }
            this.audioManager.playSound('alien_spawn'); // Reuse as "move" sound
            
            console.log(`Node ${nodeId} dropped at ${snappedPosition.x}, ${snappedPosition.y}`);
        }
        
        this.isDragging = false;
        this.dragData = null;
    }

    snapToGrid(x, y) {
        const gridSize = 20; // Grid size for snapping
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }

    // Handle when elements are dragged onto the canvas from toolbar
    handleToolDrop(event, toolType) {
        if (!this.isLearning) {
            this.showMessage('Please click "Start Learning" to begin placing flowchart elements!', 'error');
            return;
        }
        
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Snap to grid
        const snappedPosition = this.snapToGrid(x, y);
        
        // Place the node
        this.placeFlowchartNode(toolType, snappedPosition.x, snappedPosition.y);
    }
}

// Register the class globally
window.Room1 = Room1;

// Also export for potential module use
export { Room1 };

