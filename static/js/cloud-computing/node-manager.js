export class NodeManager {
    constructor(room) {
        this.room = room;
        this.nextNodeId = 1;
    }

    createInternetNode() {
        this.room.internetNode = {
            id: 'internet',
            type: 'internet',
            x: 50,
            y: 200,
            capacity: Infinity, // Internet has unlimited capacity
            currentLoad: 0,
            connections: [],
            upgrades: [],
            health: 100,
            element: null,
            isInternet: true
        };

        const element = document.createElement('div');
        element.className = 'node absolute cursor-pointer transition-all duration-200';
        element.style.left = `${this.room.internetNode.x - 25}px`;
        element.style.top = `${this.room.internetNode.y - 25}px`;
        element.style.width = '50px';
        element.style.height = '50px';
        element.style.backgroundColor = '#1e40af';
        element.style.borderRadius = '50%';
        element.style.border = '3px solid #3b82f6';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.fontSize = '24px';
        element.style.zIndex = '10';
        element.style.boxShadow = '0 0 20px #3b82f6';
        element.innerHTML = '🌐';
        element.title = 'Internet - Traffic Source (∞ capacity)';
        
        this.room.internetNode.element = element;
        this.room.gameArea.appendChild(element);
    }

    addNode(type, x, y, free = false) {
        const nodeData = this.room.data.node_types.find(n => n.id === type);
        
        const node = {
            id: this.nextNodeId++,
            type: type,
            x: x,
            y: y,
            capacity: nodeData.capacity,
            currentLoad: 0,
            connections: [],
            upgrades: [],
            health: 100,
            element: null
        };

        this.room.nodes.push(node);
        this.room.totalCapacity += nodeData.capacity;
        this.createNodeElement(node);
        
        if (!free) {
            this.room.budget -= nodeData.cost;
        }
        
        this.room.updateDisplay();
        return node;
    }

    createNodeElement(node) {
        const nodeData = this.room.data.node_types.find(n => n.id === node.type);
        
        const element = document.createElement('div');
        element.className = 'node absolute cursor-pointer transition-all duration-200 hover:scale-110';
        element.style.left = `${node.x - 20}px`;
        element.style.top = `${node.y - 20}px`;
        element.style.width = '40px';
        element.style.height = '40px';
        element.style.backgroundColor = nodeData.color;
        element.style.borderRadius = '50%';
        element.style.border = '2px solid #fff';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.fontSize = '20px';
        element.style.zIndex = '10';
        element.innerHTML = nodeData.icon;
        element.title = `${nodeData.name} (${node.capacity}/s) - Click and drag to move`;
        
        // Add visual feedback for draggable nodes
        element.style.userSelect = 'none'; // Prevent text selection while dragging
        
        node.element = element;
        this.room.gameArea.appendChild(element);
    }

    getNodeAt(x, y) {
        // Check internet node first (larger hitbox)
        if (this.room.internetNode) {
            const dx = this.room.internetNode.x - x;
            const dy = this.room.internetNode.y - y;
            if (Math.sqrt(dx * dx + dy * dy) <= 30) {
                return this.room.internetNode;
            }
        }
        
        // Check regular nodes
        return this.room.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= 25;
        });
    }

    highlightNode(node, highlight) {
        if (node.element) {
            if (highlight) {
                node.element.style.border = '3px solid #00ff00';
                node.element.style.boxShadow = '0 0 20px #00ff00';
            } else {
                node.element.style.border = '2px solid #fff';
                node.element.style.boxShadow = 'none';
            }
        }
    }

    updateNodeLoads() {
        // Reset all node loads
        this.room.nodes.forEach(node => node.currentLoad = 0);
        
        // Traffic always starts from internet and flows through connected nodes
        if (this.room.internetNode && this.room.internetNode.connections.length > 0) {
            // Distribute traffic from internet to directly connected nodes
            const directConnections = this.room.internetNode.connections;
            const trafficPerConnection = this.room.currentTraffic / directConnections.length;
            
            directConnections.forEach(connectedId => {
                const connectedNode = this.room.nodes.find(n => n.id === connectedId);
                if (connectedNode) {
                    const nodeLoad = Math.min(connectedNode.capacity, trafficPerConnection);
                    connectedNode.currentLoad = nodeLoad;
                    
                    // Distribute excess traffic to further connected nodes
                    const excessTraffic = Math.max(0, trafficPerConnection - connectedNode.capacity);
                    if (excessTraffic > 0) {
                        // Don't send traffic back to internet
                        const forwardConnections = connectedNode.connections.filter(id => id !== 'internet');
                        if (forwardConnections.length > 0) {
                            const trafficPerForward = excessTraffic / forwardConnections.length;
                            
                            forwardConnections.forEach(forwardId => {
                                const forwardNode = this.room.nodes.find(n => n.id === forwardId);
                                if (forwardNode) {
                                    const additionalLoad = Math.min(
                                        forwardNode.capacity - forwardNode.currentLoad,
                                        trafficPerForward
                                    );
                                    forwardNode.currentLoad += additionalLoad;
                                }
                            });
                        }
                    }
                }
            });
        } else if (this.room.nodes.length > 0) {
            // Fallback: if no internet connections, distribute equally (but this shouldn't happen)
            const trafficPerNode = this.room.currentTraffic / this.room.nodes.length;
            this.room.nodes.forEach(node => {
                node.currentLoad = Math.min(node.capacity, trafficPerNode);
            });
        }
        
        // Update visual load indicators for all nodes
        this.room.nodes.forEach(node => {
            if (node.element) {
                const loadPercentage = (node.currentLoad / node.capacity) * 100;
                
                if (loadPercentage > 90) {
                    node.element.style.boxShadow = '0 0 15px #ef4444';
                    node.element.style.animation = 'pulse 1s infinite';
                    node.element.style.borderColor = '#ef4444';
                } else if (loadPercentage > 70) {
                    node.element.style.boxShadow = '0 0 10px #f59e0b';
                    node.element.style.animation = 'none';
                    node.element.style.borderColor = '#f59e0b';
                } else {
                    node.element.style.boxShadow = 'none';
                    node.element.style.animation = 'none';
                    node.element.style.borderColor = '#fff';
                }
                
                // Update node tooltip with load info
                const nodeData = this.room.data.node_types.find(n => n.id === node.type);
                node.element.title = `${nodeData.name}\nCapacity: ${node.capacity}/s\nCurrent Load: ${Math.round(node.currentLoad)}/s (${Math.round(loadPercentage)}%)`;
            }
        });
        
        // Update internet node visual (always stable)
        if (this.room.internetNode && this.room.internetNode.element) {
            this.room.internetNode.element.style.boxShadow = '0 0 20px #3b82f6';
            // Show current traffic output from internet
            this.room.internetNode.element.title = `Internet - Traffic Source\nCurrent Output: ${Math.round(this.room.currentTraffic)}/s\nConnected Nodes: ${this.room.internetNode.connections.length}`;
        }
    }

    showUpgradeMenu(node) {
        // Implementation for node upgrades
        this.room.showMessage('Upgrade menu not implemented yet', 'info');
    }
}