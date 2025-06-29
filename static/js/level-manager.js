export class LevelManager {
    constructor(room) {
        this.room = room;
        this.levels = [
            {
                id: 1,
                name: "Basic Start-End Flow",
                instruction: "Create a simple flowchart with START and END ovals",
                hint: "Every flowchart needs a START and END oval",
                requiredNodes: ['oval', 'oval'], // Two ovals for start and end
                minNodes: 2,
                maxNodes: 3,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustBeConnected: false
                }
            },
            {
                id: 2,
                name: "Adding Process Steps",
                instruction: "Create a flowchart: OVAL → RECTANGLE → OVAL",
                hint: "Use a rectangle (process) between your start and end ovals",
                requiredNodes: ['oval', 'rectangle', 'oval'],
                minNodes: 3,
                maxNodes: 4,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustHaveProcess: true,
                    mustBeConnected: false
                }
            },
            {
                id: 3,
                name: "Decision Making",
                instruction: "Create: OVAL → DIAMOND → two RECTANGLES → OVAL",
                hint: "Use a diamond for decisions that split into multiple paths",
                requiredNodes: ['oval', 'diamond', 'rectangle', 'rectangle', 'oval'],
                minNodes: 5,
                maxNodes: 6,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustHaveDecision: true,
                    mustHaveMultipleProcesses: true
                }
            },
            {
                id: 4,
                name: "Input and Output",
                instruction: "Create a complete flowchart with PARALLELOGRAM → RECTANGLE → DIAMOND → PARALLELOGRAM",
                hint: "Use parallelograms for input/output operations",
                requiredNodes: ['oval', 'parallelogram', 'rectangle', 'diamond', 'parallelogram', 'oval'],
                minNodes: 6,
                maxNodes: 8,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustHaveInput: true,
                    mustHaveProcess: true,
                    mustHaveDecision: true
                }
            },
            {
                id: 5,
                name: "Complex Flow Design",
                instruction: "Design a complete algorithm flowchart with loops and multiple decisions",
                hint: "Use arrows to create loops and complex pathways between shapes",
                requiredNodes: ['oval', 'parallelogram', 'rectangle', 'diamond', 'diamond', 'rectangle', 'parallelogram', 'oval'],
                minNodes: 8,
                maxNodes: 12,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustHaveMultipleDecisions: true,
                    mustHaveMultipleProcesses: true,
                    mustHaveInput: true,
                    complexFlow: true
                }
            }
        ];
    }

    getLevelData(levelNumber) {
        return this.levels[levelNumber - 1] || this.levels[0];
    }

    validateSolution(placedNodes, levelData) {
        const nodeTypes = placedNodes.map(node => node.type);
        const validation = {
            isCorrect: true,
            feedback: "",
            score: 0
        };

        // Check minimum nodes
        if (placedNodes.length < levelData.minNodes) {
            validation.isCorrect = false;
            validation.feedback = `Need at least ${levelData.minNodes} nodes. You have ${placedNodes.length}.`;
            return validation;
        }

        // Check maximum nodes
        if (placedNodes.length > levelData.maxNodes) {
            validation.isCorrect = false;
            validation.feedback = `Too many nodes! Maximum is ${levelData.maxNodes}. You have ${placedNodes.length}.`;
            return validation;
        }

        // Check if connections exist when required
        const connectionCount = this.room.flowchartManager.connections.length;
        const minimumConnections = Math.max(1, placedNodes.length - 1); // At least one less than nodes

        if (placedNodes.length >= 2 && connectionCount === 0) {
            validation.isCorrect = false;
            validation.feedback = "You must connect your nodes with arrows! Use the arrow tool to connect the flowchart elements.";
            return validation;
        }

        if (connectionCount < minimumConnections - 2) { // Allow some flexibility
            validation.isCorrect = false;
            validation.feedback = `Need more connections! You have ${connectionCount} connections but need at least ${minimumConnections - 1} to connect your flowchart properly.`;
            return validation;
        }

        // Validate node types
        const rules = levelData.validationRules;

        if (rules.mustHaveStart && !nodeTypes.includes('oval') && !nodeTypes.includes('start')) {
            validation.isCorrect = false;
            validation.feedback = "Missing START oval. Every flowchart needs a starting point.";
            return validation;
        }

        if (rules.mustHaveEnd && (nodeTypes.filter(type => type === 'oval' || type === 'start').length < 2)) {
            validation.isCorrect = false;
            validation.feedback = "Missing END oval. Every flowchart needs an ending point.";
            return validation;
        }

        if (rules.mustHaveProcess && !nodeTypes.includes('rectangle') && !nodeTypes.includes('process')) {
            validation.isCorrect = false;
            validation.feedback = "Missing PROCESS rectangle. Add a process step.";
            return validation;
        }

        if (rules.mustHaveDecision && !nodeTypes.includes('diamond') && !nodeTypes.includes('decision')) {
            validation.isCorrect = false;
            validation.feedback = "Missing DECISION diamond. Add a decision point.";
            return validation;
        }

        if (rules.mustHaveInput && !nodeTypes.includes('parallelogram') && !nodeTypes.includes('input')) {
            validation.isCorrect = false;
            validation.feedback = "Missing INPUT/OUTPUT parallelogram. Add input or output operations.";
            return validation;
        }

        if (rules.mustHaveMultipleProcesses && nodeTypes.filter(type => type === 'rectangle').length < 2) {
            validation.isCorrect = false;
            validation.feedback = "Need multiple PROCESS rectangles for this exercise.";
            return validation;
        }

        if (rules.mustHaveMultipleDecisions && nodeTypes.filter(type => type === 'diamond').length < 2) {
            validation.isCorrect = false;
            validation.feedback = "Need multiple DECISION diamonds for this complex flow.";
            return validation;
        }

        // Validate flow connectivity for higher levels
        if (levelData.id > 1) {
            const flowValidation = this.validateFlowConnectivity(placedNodes);
            if (!flowValidation.isValid) {
                validation.isCorrect = false;
                validation.feedback = flowValidation.message;
                return validation;
            }
        }

        // If all validations pass
        validation.isCorrect = true;
        validation.feedback = `Excellent! Your flowchart structure is correct with ${connectionCount} connections.`;
        validation.score = this.calculateScore(placedNodes, levelData);

        return validation;
    }

    validateFlowConnectivity(placedNodes) {
        const connections = this.room.flowchartManager.connections;
        
        // Check if START node has outgoing connections
        const startNodes = placedNodes.filter(node => node.type === 'oval' || node.type === 'start');
        if (startNodes.length >= 1) {
            const startNode = startNodes[0];
            const hasOutgoingConnection = connections.some(conn => conn.from === startNode.id);
            
            if (!hasOutgoingConnection && placedNodes.length > 1) {
                return {
                    isValid: false,
                    message: "Your START node must be connected to the next step in the flowchart!"
                };
            }
        }

        // Check if END node has incoming connections
        if (startNodes.length >= 2) {
            const endNode = startNodes[1];
            const hasIncomingConnection = connections.some(conn => conn.to === endNode.id);
            
            if (!hasIncomingConnection && placedNodes.length > 1) {
                return {
                    isValid: false,
                    message: "Your END node must be connected from the previous step in the flowchart!"
                };
            }
        }

        // Check for isolated nodes (nodes with no connections at all)
        if (placedNodes.length > 2) {
            const isolatedNodes = placedNodes.filter(node => {
                return !connections.some(conn => conn.from === node.id || conn.to === node.id);
            });

            if (isolatedNodes.length > 0) {
                return {
                    isValid: false,
                    message: `You have ${isolatedNodes.length} unconnected node(s). All flowchart elements must be connected with arrows!`
                };
            }
        }

        return { isValid: true };
    }

    calculateScore(placedNodes, levelData) {
        let score = 50; // Base score
        
        // Bonus for optimal node count
        const optimalNodes = Math.ceil((levelData.minNodes + levelData.maxNodes) / 2);
        if (placedNodes.length === optimalNodes) {
            score += 15;
        }
        
        // Bonus for proper node variety
        const uniqueTypes = new Set(placedNodes.map(node => node.type)).size;
        score += uniqueTypes * 5;
        
        // Bonus for logical positioning
        const positions = placedNodes.map(node => ({ x: node.x, y: node.y }));
        const spreadScore = this.calculateSpreadScore(positions);
        score += spreadScore;

        // Bonus for proper connections
        const connectionCount = this.room.flowchartManager.connections.length;
        const expectedConnections = Math.max(1, placedNodes.length - 1);
        if (connectionCount >= expectedConnections) {
            score += 15; // Good connectivity bonus
        }
        
        return Math.min(100, score);
    }

    calculateSpreadScore(positions) {
        if (positions.length < 2) return 0;
        
        let totalDistance = 0;
        for (let i = 0; i < positions.length - 1; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const dx = positions[i].x - positions[j].x;
                const dy = positions[i].y - positions[j].y;
                totalDistance += Math.sqrt(dx * dx + dy * dy);
            }
        }
        
        const avgDistance = totalDistance / (positions.length * (positions.length - 1) / 2);
        return Math.min(30, avgDistance / 10); // Scale appropriately
    }

    getHint(levelData, hintNumber) {
        const hints = [
            levelData.hint,
            "Remember: Ovals for start/end, rectangles for processes, diamonds for decisions, parallelograms for input/output",
            "Use the ARROW tool to connect your flowchart elements - this is required to advance!",
            "Try to arrange your shapes in a logical top-to-bottom or left-to-right flow",
            "Each flowchart should tell a clear story from start to finish with proper connections",
            "Make sure every node is connected - no isolated elements allowed!"
        ];
        
        return hints[Math.min(hintNumber - 1, hints.length - 1)] || "Connect all your nodes with arrows to complete the level!";
    }
}
