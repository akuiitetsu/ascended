export class ConnectionManager {
    constructor(room) {
        this.room = room;
    }

    createConnection(node1, node2) {
        // Prevent connection between internet and itself
        if (node1.isInternet && node2.isInternet) return;
        
        // Check if connection already exists
        const exists = this.room.connections.some(conn => 
            (conn.from === node1.id && conn.to === node2.id) ||
            (conn.from === node2.id && conn.to === node1.id)
        );

        if (exists) {
            this.room.showMessage('Connection already exists!', 'error');
            return;
        }

        const connection = {
            from: node1.id,
            to: node2.id,
            element: null
        };

        this.room.connections.push(connection);
        node1.connections.push(node2.id);
        node2.connections.push(node1.id);
        
        this.createConnectionElement(connection);
        this.room.playSound('connection_made');
        
        if (node1.isInternet || node2.isInternet) {
            this.room.showMessage('Internet connection established!', 'success');
        } else {
            this.room.showMessage('Connection established!', 'success');
        }
    }

    createConnectionElement(connection) {
        let fromNode, toNode;
        
        if (connection.from === 'internet') {
            fromNode = this.room.internetNode;
            toNode = this.room.nodes.find(n => n.id === connection.to);
        } else if (connection.to === 'internet') {
            fromNode = this.room.nodes.find(n => n.id === connection.from);
            toNode = this.room.internetNode;
        } else {
            fromNode = this.room.nodes.find(n => n.id === connection.from);
            toNode = this.room.nodes.find(n => n.id === connection.to);
        }
        
        if (!fromNode || !toNode) return;
        
        const line = document.createElement('div');
        line.className = 'connection absolute border-t-2 border-yellow-400 opacity-60 transition-all duration-300';
        line.style.zIndex = '5';
        
        // Internet connections are thicker and blue
        if (fromNode.isInternet || toNode.isInternet) {
            line.style.borderColor = '#3b82f6';
            line.style.borderWidth = '3px';
            line.style.opacity = '0.8';
        }
        
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.left = `${fromNode.x}px`;
        line.style.top = `${fromNode.y}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 0';
        
        // Add connection activity indicator
        line.addEventListener('mouseenter', () => {
            line.style.borderColor = '#60a5fa';
            line.style.opacity = '1.0';
        });
        
        line.addEventListener('mouseleave', () => {
            if (fromNode.isInternet || toNode.isInternet) {
                line.style.borderColor = '#3b82f6';
                line.style.opacity = '0.8';
            } else {
                line.style.borderColor = '#fbbf24';
                line.style.opacity = '0.6';
            }
        });
        
        connection.element = line;
        this.room.gameArea.appendChild(line);
    }

    updateConnectionElement(connection) {
        if (!connection.element) return;
        
        let fromNode, toNode;
        
        if (connection.from === 'internet') {
            fromNode = this.room.internetNode;
            toNode = this.room.nodes.find(n => n.id === connection.to);
        } else if (connection.to === 'internet') {
            fromNode = this.room.nodes.find(n => n.id === connection.from);
            toNode = this.room.internetNode;
        } else {
            fromNode = this.room.nodes.find(n => n.id === connection.from);
            toNode = this.room.nodes.find(n => n.id === connection.to);
        }
        
        if (!fromNode || !toNode) return;
        
        // Recalculate line position and angle
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        connection.element.style.width = `${length}px`;
        connection.element.style.left = `${fromNode.x}px`;
        connection.element.style.top = `${fromNode.y}px`;
        connection.element.style.transform = `rotate(${angle}deg)`;
    }

    updateNodeConnections(node) {
        // Update all connection lines that involve this node
        this.room.connections.forEach(connection => {
            if (connection.from === node.id || connection.to === node.id) {
                this.updateConnectionElement(connection);
            }
        });
    }
}