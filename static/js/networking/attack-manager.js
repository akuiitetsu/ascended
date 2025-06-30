export class FlowchartManager {
    constructor(room) {
        this.room = room;
        this.nodes = [];
        this.connections = [];
    }

    createNodeElement(node) {
        const gameArea = document.getElementById('defense-game');
        if (!gameArea) return;
        
        const element = document.createElement('div');
        element.className = 'flowchart-node absolute cursor-pointer transition-all duration-200';
        element.style.left = `${node.x - 30}px`;
        element.style.top = `${node.y - 20}px`;
        element.style.width = '60px';
        element.style.height = '40px';
        element.style.zIndex = '15';
        element.style.userSelect = 'none';
        element.setAttribute('data-node-id', node.id);
        
        // Style based on node type
        this.styleNodeElement(element, node);
        
        // Add click handler for different tools
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`Node ${node.id} clicked with tool: ${this.room.selectedTool}`);
            
            if (this.room.selectedTool === 'arrow') {
                this.handleNodeConnectionClick(node.id);
            } else if (this.room.selectedTool === 'delete') {
                this.handleNodeDeletion(node.id);
            } else {
                this.selectNode(node.id);
            }
        });
        
        // Add double-click for editing text
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editNodeText(node.id);
        });
        
        node.element = element;
        gameArea.appendChild(element);
        
        console.log(`Created ${node.type} node at (${node.x}, ${node.y})`);
    }

    handleNodeConnectionClick(nodeId) {
        console.log(`Connection click for node: ${nodeId}, current start: ${this.room.connectionStart?.id}`);
        
        if (!this.room.connectionStart) {
            // First click - select source node
            this.room.connectionStart = this.room.placedNodes.find(n => n.id === nodeId);
            if (this.room.connectionStart) {
                this.room.ui.highlightNode(nodeId, '#00ff00'); // Green highlight
                this.room.ui.showMessage(`Selected ${this.room.connectionStart.type} as connection start. Click another node to connect.`, 'info');
                console.log(`Set connection start: ${nodeId}`);
            }
        } else {
            // Second click - create connection
            if (nodeId !== this.room.connectionStart.id) {
                // Check if connection already exists
                const existingConnection = this.connections.find(conn => 
                    conn.from === this.room.connectionStart.id && conn.to === nodeId
                );
                
                if (existingConnection) {
                    this.room.ui.showMessage('Connection already exists between these nodes!', 'error');
                } else {
                    this.room.createConnection(this.room.connectionStart.id, nodeId);
                    const targetNode = this.room.placedNodes.find(n => n.id === nodeId);
                    this.room.ui.showMessage(`Connected ${this.room.connectionStart.type} to ${targetNode.type}`, 'success');
                    console.log(`Created connection from ${this.room.connectionStart.id} to ${nodeId}`);
                }
            } else {
                this.room.ui.showMessage('Cannot connect a node to itself!', 'error');
            }
            
            // Clear connection state
            this.room.ui.clearHighlight(this.room.connectionStart.id);
            this.room.connectionStart = null;
            console.log('Cleared connection start');
        }
    }

    handleNodeDeletion(nodeId) {
        // Confirm deletion
        const nodeToDelete = this.room.placedNodes.find(n => n.id === nodeId);
        if (!nodeToDelete) return;
        
        const confirmed = confirm(`Delete this ${nodeToDelete.type} node? This will also remove any connections to it.`);
        if (!confirmed) return;
        
        // Remove all connections involving this node
        this.removeConnectionsForNode(nodeId);
        
        // Remove node from room data
        this.room.placedNodes = this.room.placedNodes.filter(n => n.id !== nodeId);
        this.room.nodesPlaced = Math.max(0, this.room.nodesPlaced - 1);
        
        // Remove visual element
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.remove();
        }
        
        // Update display
        this.room.updateDisplay();
        
        // Show feedback
        this.room.ui.showMessage(`${nodeToDelete.type} node deleted successfully`, 'success');
        
        console.log(`Deleted node ${nodeId} and its connections`);
    }

    removeConnectionsForNode(nodeId) {
        // Find connections involving this node
        const connectionsToRemove = this.connections.filter(conn => 
            conn.from === nodeId || conn.to === nodeId
        );
        
        // Remove visual connection elements
        connectionsToRemove.forEach(conn => {
            if (conn.element && conn.element.parentNode) {
                conn.element.remove();
            }
        });
        
        // Remove from connections array
        this.connections = this.connections.filter(conn => 
            conn.from !== nodeId && conn.to !== nodeId
        );
        
        console.log(`Removed ${connectionsToRemove.length} connections for node ${nodeId}`);
    }


    handleConnectionDeletion(fromNodeId, toNodeId, connectionElement) {
        const confirmed = confirm('Delete this connection?');
        if (!confirmed) return;
        
        // Remove visual elements
        if (connectionElement && connectionElement.parentNode) {
            connectionElement.remove();
        }
        
        // Remove invisible click area
        const svg = document.querySelector('#defense-game svg');
        if (svg) {
            const clickableStrokes = svg.querySelectorAll('line[stroke="transparent"]');
            clickableStrokes.forEach(stroke => {
                // Check if this stroke corresponds to the connection being deleted
                const x1 = parseFloat(stroke.getAttribute('x1'));
                const y1 = parseFloat(stroke.getAttribute('y1'));
                const x2 = parseFloat(stroke.getAttribute('x2'));
                const y2 = parseFloat(stroke.getAttribute('y2'));
                
                const connX1 = parseFloat(connectionElement.getAttribute('x1'));
                const connY1 = parseFloat(connectionElement.getAttribute('y1'));
                const connX2 = parseFloat(connectionElement.getAttribute('x2'));
                const connY2 = parseFloat(connectionElement.getAttribute('y2'));
                
                if (Math.abs(x1 - connX1) < 1 && Math.abs(y1 - connY1) < 1 && 
                    Math.abs(x2 - connX2) < 1 && Math.abs(y2 - connY2) < 1) {
                    stroke.remove();
                }
            });
        }
        
        // Remove from connections array
        this.connections = this.connections.filter(conn => 
            !(conn.from === fromNodeId && conn.to === toNodeId)
        );
        
        // Show feedback
        this.room.ui.showMessage('Connection deleted successfully', 'success');
        
        console.log(`Deleted connection from ${fromNodeId} to ${toNodeId}`);
    }

    styleNodeElement(element, node) {
        const styles = {
            oval: {
                background: 'linear-gradient(45deg, #10b981, #059669)',
                borderRadius: '50%',
                icon: '⭕',
                text: 'START/END'
            },
            rectangle: {
                background: 'linear-gradient(45deg, #3b82f6, #2563eb)',
                borderRadius: '8px',
                icon: '⬜',
                text: 'PROCESS'
            },
            diamond: {
                background: 'linear-gradient(45deg, #f59e0b, #d97706)',
                borderRadius: '0',
                icon: '♦️',
                text: 'DECISION',
                transform: 'rotate(45deg)'
            },
            parallelogram: {
                background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                borderRadius: '4px',
                icon: '▱',
                text: 'INPUT/OUTPUT',
                transform: 'skewX(-20deg)'
            },
            // Legacy support for old names
            start: {
                background: 'linear-gradient(45deg, #10b981, #059669)',
                borderRadius: '50%',
                icon: '⭕',
                text: 'START/END'
            },
            process: {
                background: 'linear-gradient(45deg, #3b82f6, #2563eb)',
                borderRadius: '8px',
                icon: '⬜',
                text: 'PROCESS'
            },
            decision: {
                background: 'linear-gradient(45deg, #f59e0b, #d97706)',
                borderRadius: '0',
                icon: '♦️',
                text: 'DECISION',
                transform: 'rotate(45deg)'
            },
            input: {
                background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                borderRadius: '4px',
                icon: '▱',
                text: 'INPUT/OUTPUT',
                transform: 'skewX(-20deg)'
            }
        };
        
        const style = styles[node.type] || styles.rectangle;
        
        element.style.background = style.background;
        element.style.borderRadius = style.borderRadius;
        element.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        element.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.color = 'white';
        element.style.fontSize = '9px';
        element.style.fontWeight = 'bold';
        element.style.textAlign = 'center';
        element.style.transform = style.transform || 'none';
        
        element.innerHTML = `
            <div class="node-content" style="transform: ${style.transform && style.transform.includes('skew') ? 'skewX(20deg)' : style.transform && style.transform.includes('rotate') ? 'rotate(-45deg)' : 'none'}">
                <div style="font-size: 12px;">${style.icon}</div>
                <div style="font-size: 7px; margin-top: 2px; line-height: 1;">${style.text}</div>
            </div>
        `;
        
        // Add hover effects
        element.addEventListener('mouseenter', () => {
            const currentTransform = style.transform || '';
            element.style.transform = currentTransform + ' scale(1.1)';
            element.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = style.transform || 'none';
            element.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        });
    }

    selectNode(nodeId) {
        // Remove previous selections
        document.querySelectorAll('.flowchart-node').forEach(node => {
            node.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        });
        
        // Select current node
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.style.border = '2px solid #fbbf24';
            this.room.selectedNode = nodeId;
        }
    }

    editNodeText(nodeId) {
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (!nodeElement) return;
        
        const currentText = nodeElement.querySelector('.node-content div:last-child').textContent;
        const newText = prompt('Enter node text:', currentText);
        
        if (newText !== null) {
            nodeElement.querySelector('.node-content div:last-child').textContent = newText.toUpperCase();
            
            // Update node data
            const node = this.room.placedNodes.find(n => n.id === nodeId);
            if (node) {
                node.text = newText;
            }
        }
    }

    createConnection(fromNodeId, toNodeId) {
        const fromElement = document.querySelector(`[data-node-id="${fromNodeId}"]`);
        const toElement = document.querySelector(`[data-node-id="${toNodeId}"]`);
        
        if (!fromElement || !toElement) {
            console.error('Could not find elements for connection', fromNodeId, toNodeId);
            return;
        }
        
        const gameArea = document.getElementById('defense-game');
        
        // Calculate positions
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect();
        
        // Get center points of nodes
        const fromCenterX = fromRect.left - gameRect.left + fromRect.width / 2;
        const fromCenterY = fromRect.top - gameRect.top + fromRect.height / 2;
        const toCenterX = toRect.left - gameRect.left + toRect.width / 2;
        const toCenterY = toRect.top - gameRect.top + toRect.height / 2;
        
        // Calculate the angle between nodes
        const dx = toCenterX - fromCenterX;
        const dy = toCenterY - fromCenterY;
        const angle = Math.atan2(dy, dx);
        
        // Node radius (assuming nodes are roughly circular/square)
        const fromRadius = Math.max(fromRect.width, fromRect.height) / 2;
        const toRadius = Math.max(toRect.width, toRect.height) / 2;
        
        // Calculate connection points at the edge of nodes
        const x1 = fromCenterX + Math.cos(angle) * fromRadius;
        const y1 = fromCenterY + Math.sin(angle) * fromRadius;
        const x2 = toCenterX - Math.cos(angle) * toRadius;
        const y2 = toCenterY - Math.sin(angle) * toRadius;
        
        // Add SVG if it doesn't exist
        let svg = gameArea.querySelector('svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '5';
            
            // Add enhanced arrowhead marker
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '12');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '12');
            marker.setAttribute('refY', '5');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('markerUnits', 'strokeWidth');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 12 5, 0 10');
            polygon.setAttribute('fill', '#60a5fa');
            polygon.setAttribute('stroke', '#60a5fa');
            polygon.setAttribute('stroke-width', '1');
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.appendChild(defs);
            gameArea.appendChild(svg);
        }
        
        // Create main connection line
        const connection = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        connection.setAttribute('x1', x1);
        connection.setAttribute('y1', y1);
        connection.setAttribute('x2', x2);
        connection.setAttribute('y2', y2);
        connection.setAttribute('stroke', '#60a5fa');
        connection.setAttribute('stroke-width', '3');
        connection.setAttribute('marker-end', 'url(#arrowhead)');
        connection.setAttribute('class', 'connection-line');
        
        // Add invisible wider stroke for easier clicking (delete functionality)
        const clickableStroke = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        clickableStroke.setAttribute('x1', x1);
        clickableStroke.setAttribute('y1', y1);
        clickableStroke.setAttribute('x2', x2);
        clickableStroke.setAttribute('y2', y2);
        clickableStroke.setAttribute('stroke', 'transparent');
        clickableStroke.setAttribute('stroke-width', '10');
        clickableStroke.style.pointerEvents = 'stroke';
        clickableStroke.style.cursor = 'pointer';
        
        clickableStroke.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.room.selectedTool === 'delete') {
                this.handleConnectionDeletion(fromNodeId, toNodeId, connection);
            }
        });
        
        // Add to SVG
        svg.appendChild(clickableStroke);
        svg.appendChild(connection);
        
        // Add hover effects for connections
        connection.addEventListener('mouseenter', () => {
            connection.setAttribute('stroke-width', '4');
            connection.setAttribute('stroke', '#93c5fd');
        });
        
        connection.addEventListener('mouseleave', () => {
            connection.setAttribute('stroke-width', '3');
            connection.setAttribute('stroke', '#60a5fa');
        });
        
        // Store connection data
        this.connections.push({
            from: fromNodeId,
            to: toNodeId,
            element: connection,
            clickable: clickableStroke
        });
        
        console.log(`Visual connection created from ${fromNodeId} to ${toNodeId}`);
    }

    clearCanvas() {
        const gameArea = document.getElementById('defense-game');
        if (gameArea) {
            // Remove all flowchart nodes
            gameArea.querySelectorAll('.flowchart-node').forEach(node => {
                node.remove();
                console.log('Removed flowchart node:', node.getAttribute('data-node-id'));
            });
            
            // Remove all SVG connections including previews
            gameArea.querySelectorAll('svg').forEach(svg => {
                svg.remove();
                console.log('Removed SVG connections');
            });
            
            // Clear any temporary visual effects and feedback elements
            gameArea.querySelectorAll('.feedback-element, .validation-feedback, .connection-preview, .arrow-preview').forEach(element => {
                element.remove();
            });
            
            // Remove any lingering connection elements by class
            gameArea.querySelectorAll('.connection-line').forEach(line => {
                line.remove();
            });
            
            // Force remove any remaining child elements that might be connections
            const remainingElements = gameArea.querySelectorAll('line, polygon, marker, defs');
            remainingElements.forEach(element => {
                element.remove();
            });
        }
        
        // Reset internal data structures completely
        this.nodes = [];
        this.connections = [];
        
        console.log('Canvas cleared completely - all nodes and connections removed');
    }

    exportFlowchart() {
        return {
            nodes: this.room.placedNodes,
            connections: this.connections.map(conn => ({
                from: conn.from,
                to: conn.to
            }))
        };
    }
}
