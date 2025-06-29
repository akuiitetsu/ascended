export class WaveManager {
    constructor(room) {
        this.room = room;
    }

    getWaveDifficulty() {
        const difficulties = ['Reconnaissance', 'Probing', 'Infiltration', 'Assault', 'Full Invasion'];
        return difficulties[Math.min(this.room.wave - 1, difficulties.length - 1)];
    }

    getAttacksThisWave() {
        return Math.min(this.room.currentWaveAttacks, this.room.attacksPerWave);
    }

    shouldSpawnAttack() {
        if (!this.room.isDefending) return false;
        if (this.room.currentWaveAttacks >= this.room.attacksPerWave) return false;
        
        const spawnRate = this.room.attackManager.getAttackSpawnRate();
        return Math.random() < spawnRate;
    }

    checkWaveCompletion() {
        // Check if current wave is complete
        if (this.room.currentWaveAttacks >= this.room.attacksPerWave && 
            this.room.attackManager.attacks.length === 0) {
            this.completeWave();
        }
    }

    completeWave() {
        this.room.wave++;
        this.room.currentWaveAttacks = 0;
        
        // Increase attacks per wave for higher difficulty
        this.room.attacksPerWave = Math.min(30, 8 + (this.room.wave - 1) * 3);
        
        // Play wave complete sound
        this.room.audioManager.playSound('wave_complete');
        
        if (this.room.wave > this.room.maxWaves) {
            // All waves completed
            this.room.defenseComplete();
        } else {
            // Show wave completion message
            this.showWaveComplete();
            
            // Brief pause between waves
            setTimeout(() => {
                if (this.room.isDefending) {
                    this.room.updateDisplay(); // Update display for new wave
                }
            }, 2000);
        }
    }

    showWaveComplete() {
        const gameArea = document.getElementById('defense-game');
        
        const waveMessage = document.createElement('div');
        waveMessage.className = 'absolute text-green-400 font-bold text-2xl animate-pulse';
        waveMessage.style.left = '50%';
        waveMessage.style.top = '50%';
        waveMessage.style.transform = 'translate(-50%, -50%)';
        waveMessage.style.zIndex = '25';
        waveMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        waveMessage.style.padding = '20px';
        waveMessage.style.borderRadius = '10px';
        waveMessage.style.border = '2px solid #10b981';
        waveMessage.innerHTML = `
            <div class="text-center">
                <div class="text-3xl mb-2">🛡️</div>
                <div>WAVE ${this.room.wave - 1} REPELLED!</div>
                <div class="text-sm mt-2">Preparing for Wave ${this.room.wave}...</div>
            </div>
        `;
        
        gameArea.appendChild(waveMessage);
        
        setTimeout(() => {
            waveMessage.remove();
        }, 2000);
    }

    resetWave() {
        this.room.wave = 1;
        this.room.currentWaveAttacks = 0;
        this.room.attacksPerWave = 8;
    }
}

export class LevelManager {
    constructor(room) {
        this.room = room;
        this.levels = [
            {
                id: 1,
                name: "Coffee Shop Opening Day",
                scenario: "☕ Sarah's Coffee Corner",
                story: "Sarah is opening her first coffee shop and needs a simple process flowchart for her opening day routine. Help her create a basic flow that shows how she starts and ends her day.",
                instruction: "Create Sarah's opening day flowchart: START → END (with proper connections)",
                hint: "Every business process needs a clear beginning and end. Use oval shapes for START and END points.",
                character: "👩‍💼 Sarah (Coffee Shop Owner)",
                context: "Small business startup - Day 1 operations",
                requiredNodes: ['oval', 'oval'],
                minNodes: 2,
                maxNodes: 3,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustBeConnected: true
                }
            },
            {
                id: 2,
                name: "Pizza Delivery Process",
                scenario: "🍕 Tony's Pizza Palace",
                story: "Tony needs to train new delivery drivers with a clear process flowchart. Help him create a flowchart showing: receiving an order, preparing the pizza, and completing delivery.",
                instruction: "Create Tony's delivery process: START → Receive Order → Prepare Pizza → Deliver → END",
                hint: "Use rectangles for action steps (processes) like 'Receive Order' and 'Prepare Pizza'",
                character: "👨‍🍳 Tony (Pizza Shop Manager)",
                context: "Food service operations - Employee training",
                requiredNodes: ['oval', 'rectangle', 'rectangle', 'oval'],
                minNodes: 4,
                maxNodes: 5,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustHaveProcess: true,
                    mustBeConnected: true
                }
            },
            {
                id: 3,
                name: "Customer Service Decision Tree",
                scenario: "📞 Tech Support Helpdesk",
                story: "Emma runs a tech support team and needs a decision flowchart for handling customer calls. Create a flowchart that routes customers based on whether they have a technical issue or billing question.",
                instruction: "Create Emma's support flowchart: START → Check Issue Type → [Technical Support OR Billing Department] → END",
                hint: "Use a diamond shape for decisions that split the process into different paths",
                character: "👩‍💻 Emma (Support Manager)",
                context: "Customer service operations - Call routing",
                requiredNodes: ['oval', 'diamond', 'rectangle', 'rectangle', 'oval'],
                minNodes: 5,
                maxNodes: 7,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustHaveDecision: true,
                    mustHaveMultipleProcesses: true,
                    mustBeConnected: true
                }
            },
            {
                id: 4,
                name: "Online Order Processing System",
                scenario: "🛒 E-commerce Warehouse",
                story: "Marcus manages an online store warehouse. He needs a comprehensive flowchart showing customer input, order processing, inventory checking, and shipping confirmation output.",
                instruction: "Create Marcus's order system: START → Input (Customer Order) → Process Order → Check Inventory → Output (Shipping Confirmation) → END",
                hint: "Use parallelograms for inputs (customer data) and outputs (confirmations, receipts)",
                character: "📦 Marcus (Warehouse Manager)",
                context: "E-commerce operations - Order fulfillment",
                requiredNodes: ['oval', 'parallelogram', 'rectangle', 'diamond', 'parallelogram', 'oval'],
                minNodes: 6,
                maxNodes: 8,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustHaveInput: true,
                    mustHaveProcess: true,
                    mustHaveDecision: true,
                    mustBeConnected: true
                }
            },
            {
                id: 5,
                name: "Hospital Patient Care Protocol",
                scenario: "🏥 St. Mary's Emergency Department",
                story: "Dr. Jennifer needs a complex flowchart for patient triage in the emergency room. The system must handle patient registration, multiple severity assessments, different treatment paths, and discharge procedures with feedback loops.",
                instruction: "Create Dr. Jennifer's triage protocol: Multiple decision points, treatment loops, and comprehensive patient flow management",
                hint: "Create loops using arrows that go back to previous steps. Use multiple diamonds for different severity checks.",
                character: "👩‍⚕️ Dr. Jennifer (ER Director)",
                context: "Healthcare operations - Emergency triage",
                requiredNodes: ['oval', 'parallelogram', 'rectangle', 'diamond', 'diamond', 'rectangle', 'parallelogram', 'oval'],
                minNodes: 8,
                maxNodes: 12,
                validationRules: {
                    mustHaveStart: true,
                    mustHaveEnd: true,
                    mustHaveMultipleDecisions: true,
                    mustHaveMultipleProcesses: true,
                    mustHaveInput: true,
                    complexFlow: true,
                    mustBeConnected: true
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
            validation.feedback = `${levelData.character} needs at least ${levelData.minNodes} flowchart elements. You have ${placedNodes.length}.`;
            return validation;
        }

        // Check maximum nodes
        if (placedNodes.length > levelData.maxNodes) {
            validation.isCorrect = false;
            validation.feedback = `Too complex for ${levelData.scenario}! Maximum is ${levelData.maxNodes} elements. You have ${placedNodes.length}.`;
            return validation;
        }

        // Check if connections exist when required
        const connectionCount = this.room.flowchartManager.connections.length;
        const minimumConnections = Math.max(1, placedNodes.length - 1);

        if (placedNodes.length >= 2 && connectionCount === 0) {
            validation.isCorrect = false;
            validation.feedback = `${levelData.character} needs you to connect the flowchart elements with arrows! Use the arrow tool to show the process flow.`;
            return validation;
        }

        if (connectionCount < minimumConnections - 2) {
            validation.isCorrect = false;
            validation.feedback = `${levelData.scenario} needs better process flow! You have ${connectionCount} connections but need at least ${minimumConnections - 1} to connect the workflow properly.`;
            return validation;
        }

        // Validate node types with scenario context
        const rules = levelData.validationRules;

        if (rules.mustHaveStart && !nodeTypes.includes('oval') && !nodeTypes.includes('start')) {
            validation.isCorrect = false;
            validation.feedback = `Missing START point! ${levelData.character}'s process needs a clear beginning (oval shape).`;
            return validation;
        }

        if (rules.mustHaveEnd && (nodeTypes.filter(type => type === 'oval' || type === 'start').length < 2)) {
            validation.isCorrect = false;
            validation.feedback = `Missing END point! ${levelData.character}'s process needs a clear conclusion (oval shape).`;
            return validation;
        }

        if (rules.mustHaveProcess && !nodeTypes.includes('rectangle') && !nodeTypes.includes('process')) {
            validation.isCorrect = false;
            validation.feedback = `Missing PROCESS step! ${levelData.scenario} needs action rectangles to show what work gets done.`;
            return validation;
        }

        if (rules.mustHaveDecision && !nodeTypes.includes('diamond') && !nodeTypes.includes('decision')) {
            validation.isCorrect = false;
            validation.feedback = `Missing DECISION point! ${levelData.character} needs a diamond shape to show where choices are made.`;
            return validation;
        }

        if (rules.mustHaveInput && !nodeTypes.includes('parallelogram') && !nodeTypes.includes('input')) {
            validation.isCorrect = false;
            validation.feedback = `Missing INPUT/OUTPUT! ${levelData.scenario} needs parallelograms to show data coming in or going out.`;
            return validation;
        }

        if (rules.mustHaveMultipleProcesses && nodeTypes.filter(type => type === 'rectangle').length < 2) {
            validation.isCorrect = false;
            validation.feedback = `${levelData.character} needs multiple PROCESS steps (rectangles) to handle this complex workflow.`;
            return validation;
        }

        if (rules.mustHaveMultipleDecisions && nodeTypes.filter(type => type === 'diamond').length < 2) {
            validation.isCorrect = false;
            validation.feedback = `${levelData.scenario} requires multiple DECISION points (diamonds) for proper workflow routing.`;
            return validation;
        }

        // Validate flow connectivity for higher levels
        if (levelData.id > 1) {
            const flowValidation = this.validateFlowConnectivity(placedNodes);
            if (!flowValidation.isValid) {
                validation.isCorrect = false;
                validation.feedback = `${levelData.character} says: "${flowValidation.message}"`;
                return validation;
            }
        }

        // If all validations pass - provide scenario-specific success feedback
        validation.isCorrect = true;
        validation.feedback = `Excellent! ${levelData.character} approves this ${levelData.scenario} flowchart with ${connectionCount} connections. The process flow is clear and professional!`;
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
        const scenarioHints = [
            levelData.hint,
            `${levelData.character} reminds you: Ovals for start/end, rectangles for tasks, diamonds for decisions, parallelograms for data`,
            `${levelData.scenario} requires connected workflow! Use the ARROW tool to link your flowchart elements - this is essential for any business process!`,
            `${levelData.character} suggests: Try arranging your shapes in a logical top-to-bottom or left-to-right flow that tells the story clearly`,
            `For ${levelData.scenario}: Each flowchart should tell a complete story from start to finish with proper connections between all steps`,
            `${levelData.character} needs help: Make sure every flowchart element is connected with arrows - no isolated steps allowed in real business processes!`
        ];
        
        return scenarioHints[Math.min(hintNumber - 1, scenarioHints.length - 1)] || `${levelData.character} says: Connect all your flowchart elements with arrows to complete the ${levelData.scenario} process!`;
    }
}
