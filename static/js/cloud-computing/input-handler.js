export class InputHandler {
    constructor(room) {
        this.room = room;
    }

    setupEventListeners() {
        // Shop items
        document.querySelectorAll('.shop-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const nodeType = e.currentTarget.dataset.nodeType;
                this.selectNodeType(nodeType);
            });
        });

        // Control buttons
        document.getElementById('toggle-connection-mode').addEventListener('click', () => {
            this.toggleConnectionMode();
        });

        document.getElementById('auto-scale').addEventListener('click', () => {
            this.room.autoScale();
        });

        document.getElementById('emergency-maintenance').addEventListener('click', () => {
            this.room.emergencyMaintenance();
        });

        document.getElementById('abandon-infrastructure').addEventListener('click', () => {
            this.room.abandonInfrastructure();
        });
    }

    setupCanvasEventListeners() {
        // Canvas event listeners
        this.room.gameArea.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.room.gameArea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleCanvasRightClick(e);
        });
        this.room.gameArea.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle click
                e.preventDefault();
                this.handleCanvasMiddleClick(e);
            } else if (e.button === 0) { // Left click for dragging
                this.handleMouseDown(e);
            }
        });
        
        // Add mouse move and mouse up listeners for dragging
        this.room.gameArea.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.room.gameArea.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.room.gameArea.addEventListener('mouseleave', (e) => this.handleMouseUp(e)); // Stop dragging if mouse leaves area
    }

    handleMouseDown(e) {
        if (this.room.connectionMode) return; // Don't drag in connection mode
        
        const rect = this.room.gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedNode = this.room.nodeManager.getNodeAt(x, y);
        
        if (clickedNode && !clickedNode.isInternet) { // Don't allow dragging internet node
            this.room.isDragging = true;
            this.room.dragNode = clickedNode;
            this.room.dragOffset.x = x - clickedNode.x;
            this.room.dragOffset.y = y - clickedNode.y;
            
            // Change cursor to indicate dragging
            this.room.gameArea.style.cursor = 'grabbing';
            
            // Highlight the node being dragged
            this.room.nodeManager.highlightNode(clickedNode, true);
            
            e.preventDefault(); // Prevent text selection
        }
    }

    handleMouseMove(e) {
        if (!this.room.isDragging || !this.room.dragNode) return;
        
        const rect = this.room.gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate new position
        const newX = x - this.room.dragOffset.x;
        const newY = y - this.room.dragOffset.y;
        
        // Keep node within bounds (considering node size)
        const nodeRadius = 20;
        const boundedX = Math.max(nodeRadius, Math.min(800 - nodeRadius, newX));
        const boundedY = Math.max(nodeRadius, Math.min(400 - nodeRadius, newY));
        
        // Update node position
        this.room.dragNode.x = boundedX;
        this.room.dragNode.y = boundedY;
        
        // Update visual position
        if (this.room.dragNode.element) {
            this.room.dragNode.element.style.left = `${boundedX - nodeRadius}px`;
            this.room.dragNode.element.style.top = `${boundedY - nodeRadius}px`;
        }
        
        // Update all connections involving this node
        this.room.connectionManager.updateNodeConnections(this.room.dragNode);
    }

    handleMouseUp(e) {
        if (this.room.isDragging && this.room.dragNode) {
            // Remove highlight from dragged node
            this.room.nodeManager.highlightNode(this.room.dragNode, false);
            
            // Reset cursor
            this.room.gameArea.style.cursor = 'default';
            
            this.room.isDragging = false;
            this.room.dragNode = null;
        }
    }

    handleCanvasClick(e) {
        // Don't handle clicks if we just finished dragging
        if (this.room.isDragging) return;
        
        const rect = this.room.gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.room.connectionMode) {
            this.handleConnectionClick(x, y);
        } else if (this.room.selectedNodeType) {
            this.placeNode(x, y);
        }
    }

    handleCanvasRightClick(e) {
        const rect = this.room.gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.handleConnectionClick(x, y);
    }

    handleCanvasMiddleClick(e) {
        const rect = this.room.gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const node = this.room.nodeManager.getNodeAt(x, y);
        if (node) {
            this.room.nodeManager.showUpgradeMenu(node);
        }
    }

    selectNodeType(nodeType) {
        this.room.selectedNodeType = nodeType;
        const nodeData = this.room.data.node_types.find(n => n.id === nodeType);
        
        if (this.room.budget >= nodeData.cost) {
            this.room.gameArea.style.cursor = 'crosshair';
            this.room.showMessage(`Click to place ${nodeData.name} ($${nodeData.cost})`, 'info');
        } else {
            this.room.showMessage('Insufficient budget!', 'error');
        }
    }

    placeNode(x, y) {
        if (!this.room.selectedNodeType) return;

        const nodeData = this.room.data.node_types.find(n => n.id === this.room.selectedNodeType);
        
        if (this.room.budget >= nodeData.cost) {
            this.room.nodeManager.addNode(this.room.selectedNodeType, x, y);
            this.room.budget -= nodeData.cost;
            this.room.selectedNodeType = null;
            this.room.gameArea.style.cursor = 'default';
            this.room.updateDisplay();
            this.room.playSound('node_place');
        }
    }

    handleConnectionClick(x, y) {
        const clickedNode = this.room.nodeManager.getNodeAt(x, y);
        
        if (!clickedNode) return;

        if (!this.room.selectedNode) {
            this.room.selectedNode = clickedNode;
            this.room.nodeManager.highlightNode(clickedNode, true);
            
            if (clickedNode.isInternet) {
                this.room.showMessage('Internet selected - connect to infrastructure nodes', 'info');
            } else {
                this.room.showMessage('Click another node to connect', 'info');
            }
        } else if (this.room.selectedNode === clickedNode) {
            this.room.nodeManager.highlightNode(clickedNode, false);
            this.room.selectedNode = null;
            this.room.showMessage('Connection cancelled', 'info');
        } else {
            this.room.connectionManager.createConnection(this.room.selectedNode, clickedNode);
            this.room.nodeManager.highlightNode(this.room.selectedNode, false);
            this.room.selectedNode = null;
        }
    }

    toggleConnectionMode() {
        this.room.connectionMode = !this.room.connectionMode;
        this.room.selectedNode = null;
        
        // Reset any highlighted nodes
        this.room.nodes.forEach(node => this.room.nodeManager.highlightNode(node, false));
        
        this.room.updateDisplay();
        this.room.render(); // Re-render to update button text
    }
}