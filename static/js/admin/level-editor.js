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
        
        // Add existing levels data directly in the code
        this.existingLevelsData = {
            1: [ // Flowchart Lab
                {
                    level_number: 1,
                    name: "Basic Decision Making",
                    data: {
                        name: "Basic Decision Making",
                        story: "Welcome to the Flowchart Lab! Dr. Flow needs your help to create a simple decision-making flowchart for the university's admission process.",
                        objective: "Create a flowchart that shows how to determine if a student is admitted based on their GPA and test scores.",
                        character: "Dr. Flow",
                        taskType: "flowchart",
                        instruction: "Drag nodes from the toolbar and connect them to create a flowchart. Start with the given Start node and end with the End node.",
                        hint: "Use decision nodes to check conditions like 'GPA >= 3.0' and process nodes for actions like 'Admit Student'.",
                        flowchartData: {
                            startNode: { id: 'start', type: 'start', text: 'Start', x: 100, y: 50 },
                            endNode: { id: 'end', type: 'end', text: 'End', x: 100, y: 400 },
                            nodes: [
                                { id: 'input1', type: 'process', text: 'Get Student GPA', x: 100, y: 120 },
                                { id: 'decision1', type: 'decision', text: 'GPA >= 3.0?', x: 100, y: 200 }
                            ],
                            connections: [
                                { from: 'start', to: 'input1' },
                                { from: 'input1', to: 'decision1' }
                            ]
                        },
                        successCriteria: {
                            requiredNodes: ['start', 'decision', 'process', 'end'],
                            minConnections: 3
                        }
                    }
                },
                {
                    level_number: 2,
                    name: "Loop Processing",
                    data: {
                        name: "Loop Processing",
                        story: "Dr. Flow has a more complex task: create a flowchart that processes multiple student applications in a loop.",
                        objective: "Design a flowchart that reads student data repeatedly until there are no more applications to process.",
                        character: "Dr. Flow",
                        taskType: "flowchart",
                        instruction: "Create a loop structure that processes multiple students. Include initialization, condition checking, and loop increment.",
                        hint: "Use a loop structure with a counter or condition to process multiple items. Don't forget initialization and increment steps.",
                        flowchartData: {
                            startNode: { id: 'start', type: 'start', text: 'Start', x: 100, y: 50 },
                            endNode: { id: 'end', type: 'end', text: 'End', x: 100, y: 500 },
                            nodes: [],
                            connections: []
                        },
                        successCriteria: {
                            requiredNodes: ['start', 'decision', 'process', 'end'],
                            hasLoop: true,
                            minConnections: 5
                        }
                    }
                }
            ],
            2: [ // Network Nexus
                {
                    level_number: 1,
                    name: "Basic Network Setup",
                    data: {
                        name: "Basic Network Setup",
                        story: "The campus network is down! Net Admin Sarah needs your help to rebuild the basic network infrastructure.",
                        objective: "Connect computers to create a simple local area network with proper routing.",
                        character: "Net Admin Sarah",
                        taskType: "topology-builder",
                        instruction: "Drag network devices and connect them with cables to create a functional network topology.",
                        hint: "Start with a router, add a switch, then connect computers. Remember to configure IP addresses!",
                        requiredDevices: ["router", "switch", "computer", "computer"],
                        requiredConnections: 3,
                        successCriteria: {
                            hasRouter: true,
                            hasSwitch: true,
                            computerCount: 2,
                            allConnected: true
                        }
                    }
                },
                {
                    level_number: 2,
                    name: "VLAN Configuration",
                    data: {
                        name: "VLAN Configuration",
                        story: "The network needs to be segmented for security. Sarah needs you to set up VLANs to separate different departments.",
                        objective: "Create a network with multiple VLANs to isolate traffic between departments.",
                        character: "Net Admin Sarah",
                        taskType: "topology-builder",
                        instruction: "Set up managed switches and configure VLANs to separate network traffic by department.",
                        hint: "Use managed switches and assign different VLAN IDs to different ports. Don't forget the trunk links!",
                        requiredDevices: ["router", "managed-switch", "computer", "computer", "computer"],
                        requiredConnections: 5,
                        successCriteria: {
                            hasVLANs: true,
                            vlanCount: 2,
                            hasTrunkLink: true
                        }
                    }
                }
            ],
            3: [ // AI Systems
                {
                    level_number: 1,
                    name: "Basic Classification",
                    data: {
                        name: "Basic Classification",
                        story: "Dr. AI needs help training a machine learning model to classify student performance based on study habits.",
                        objective: "Train a decision tree classifier to predict student grades based on study time and attendance.",
                        character: "Dr. AI",
                        taskType: "ai-training",
                        instruction: "Select training data and configure the decision tree algorithm to classify students into grade categories.",
                        hint: "Look for patterns in the data. Students with high study time and attendance usually get better grades.",
                        dataset: [
                            { studyTime: 5, attendance: 95, grade: "A" },
                            { studyTime: 3, attendance: 80, grade: "B" },
                            { studyTime: 1, attendance: 60, grade: "C" }
                        ],
                        algorithm: "decision-tree",
                        successCriteria: {
                            accuracy: 0.8,
                            trainingComplete: true
                        }
                    }
                },
                {
                    level_number: 2,
                    name: "Neural Network Basics",
                    data: {
                        name: "Neural Network Basics",
                        story: "Dr. AI wants to explore more advanced AI. Help design a simple neural network for pattern recognition.",
                        objective: "Configure a basic neural network to recognize handwritten digits.",
                        character: "Dr. AI",
                        taskType: "ai-training",
                        instruction: "Set up the neural network layers and training parameters for digit recognition.",
                        hint: "Start with a simple architecture: input layer, one hidden layer, and output layer. Adjust learning rate as needed.",
                        dataset: [],
                        algorithm: "neural-network",
                        successCriteria: {
                            accuracy: 0.85,
                            epochs: 10,
                            hasHiddenLayer: true
                        }
                    }
                }
            ],
            4: [ // Database Crisis
                {
                    level_number: 1,
                    name: "Emergency Data Recovery",
                    data: {
                        name: "Emergency Data Recovery",
                        story: "The university database has been corrupted! DB Admin Mike needs you to write SQL queries to recover critical student information.",
                        objective: "Write SQL queries to extract and verify student enrollment data from the backup database.",
                        character: "DB Admin Mike",
                        taskType: "sql-query",
                        instruction: "Use SELECT statements to retrieve student information. Check the data integrity and identify any inconsistencies.",
                        hint: "Start with a simple SELECT * FROM students query, then filter and sort the results as needed.",
                        database: "emergency_db",
                        tables: ["students", "enrollments", "courses"],
                        expectedQuery: "SELECT student_id, first_name, last_name, enrollment_date FROM students WHERE status = 'active' ORDER BY enrollment_date",
                        successCriteria: {
                            queryCorrect: true,
                            dataRetrieved: true,
                            noErrors: true
                        }
                    }
                },
                {
                    level_number: 2,
                    name: "Data Relationship Analysis",
                    data: {
                        name: "Data Relationship Analysis",
                        story: "Mike needs to analyze the relationships between students, courses, and grades to identify data integrity issues.",
                        objective: "Write complex JOIN queries to analyze data relationships and find inconsistencies.",
                        character: "DB Admin Mike",
                        taskType: "sql-query",
                        instruction: "Use JOIN operations to combine data from multiple tables and identify orphaned records or missing relationships.",
                        hint: "Use INNER JOIN to find matching records, LEFT JOIN to find missing relationships, and aggregate functions to summarize data.",
                        database: "emergency_db",
                        tables: ["students", "enrollments", "courses", "grades"],
                        expectedQuery: "SELECT s.student_id, s.first_name, c.course_name, g.grade FROM students s JOIN enrollments e ON s.student_id = e.student_id JOIN courses c ON e.course_id = c.course_id LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id",
                        successCriteria: {
                            usesJoins: true,
                            dataIntegrityChecked: true,
                            relationshipsAnalyzed: true
                        }
                    }
                }
            ],
            5: [ // Programming Crisis
                {
                    level_number: 1,
                    name: "Debug the Login System",
                    data: {
                        name: "Debug the Login System",
                        story: "The university's login system is broken! Students can't access their accounts. Code Monkey Dave needs your help to find and fix the bugs.",
                        objective: "Debug the Python login function to restore access to student accounts.",
                        character: "Code Monkey Dave",
                        taskType: "code-debug",
                        instruction: "Examine the code, identify the bugs, and fix them. Test your solution to ensure it works correctly.",
                        hint: "Look for common Python errors: indentation, variable names, comparison operators, and logic errors.",
                        code: `def check_login(username, password):
    valid_users = {
        'student1': 'pass123',
        'student2': 'mypass',
        'admin': 'admin123'
    }
    
    if username in valid_users:
        if password = valid_users[username]:  # Bug: assignment instead of comparison
            return True
        else:
            return False
    else:
        return False`,
                        language: "python",
                        bugs: [
                            { line: 8, type: "syntax", description: "Assignment operator used instead of comparison" }
                        ],
                        successCriteria: {
                            syntaxCorrect: true,
                            logicCorrect: true,
                            testsPass: true
                        }
                    }
                },
                {
                    level_number: 2,
                    name: "Fix the Grade Calculator",
                    data: {
                        name: "Fix the Grade Calculator",
                        story: "The automatic grade calculator is producing wrong results! Dave needs you to debug the algorithm that calculates student final grades.",
                        objective: "Debug the grade calculation function to ensure accurate grade computation.",
                        character: "Code Monkey Dave",
                        taskType: "code-debug",
                        instruction: "Find and fix the bugs in the grade calculation algorithm. Make sure it handles all edge cases correctly.",
                        hint: "Check for division by zero, incorrect weight calculations, and proper rounding of final grades.",
                        code: `def calculate_final_grade(assignments, exams, participation):
    assignment_avg = sum(assignments) / len(assignments)
    exam_avg = sum(exams) / len(exams)
    
    # Weights: 40% assignments, 50% exams, 10% participation
    final_grade = assignment_avg * 0.4 + exam_avg * 0.5 + participation * 0.01  # Bug: wrong participation weight
    
    if final_grade >= 90:
        return 'A'
    elif final_grade >= 80:
        return 'B'
    elif final_grade >= 70:
        return 'C'
    elif final_grade >= 60:
        return 'D'
    else:
        return 'F'`,
                        language: "python",
                        bugs: [
                            { line: 6, type: "logic", description: "Participation weight should be 0.1, not 0.01" }
                        ],
                        successCriteria: {
                            calculationCorrect: true,
                            weightsCorrect: true,
                            edgeCasesHandled: true
                        }
                    }
                }
            ]
        };
        
        this.existingLevels = null; // Cache for codebase levels
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadLevelsForRoom(this.currentRoom);
        this.initTabs();
        this.updateRoomInfo(this.currentRoom);
        this.renderTemplateLevels();
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

        // Show templates button
        document.getElementById('show-templates-btn')?.addEventListener('click', () => {
            this.toggleTemplateLevels();
        });

        // Refresh levels button
        document.getElementById('refresh-levels-btn')?.addEventListener('click', () => {
            this.loadLevelsForRoom(this.currentRoom);
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

        // Existing levels modal handlers
        document.getElementById('cancel-existing')?.addEventListener('click', () => {
            this.hideExistingLevelsModal();
        });

        document.getElementById('close-existing')?.addEventListener('click', () => {
            this.hideExistingLevelsModal();
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
        
        // Update active room tab
        document.querySelectorAll('.room-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-room="${roomId}"]`).classList.add('active');
        
        // Update room information display
        this.updateRoomInfo(roomId);
        
        // Load levels for new room
        this.loadLevelsForRoom(roomId);
        this.clearEditor();
        
        // Update template levels display
        this.renderTemplateLevels();
    }

    updateRoomInfo(roomId) {
        const roomData = {
            1: {
                icon: 'bi-diagram-3',
                name: 'Flowchart Lab',
                description: 'Interactive flowchart creation and validation'
            },
            2: {
                icon: 'bi-diagram-2', 
                name: 'Network Nexus',
                description: 'Network configuration and management'
            },
            3: {
                icon: 'bi-robot',
                name: 'AI Systems',
                description: 'AI training through card-based learning'
            },
            4: {
                icon: 'bi-database-x',
                name: 'Database Crisis',
                description: 'SQL query writing and database management'
            },
            5: {
                icon: 'bi-bug',
                name: 'Programming Crisis',
                description: 'Code debugging and programming logic'
            }
        };

        const room = roomData[roomId];
        if (room) {
            document.getElementById('room-icon').className = `bi ${room.icon} text-purple-400 mr-2`;
            document.getElementById('room-name').textContent = room.name;
            document.getElementById('room-description').textContent = room.description;
        }
    }

    renderTemplateLevels() {
        const templateLevels = this.existingLevelsData[this.currentRoom] || [];
        const container = document.getElementById('template-levels-list');
        
        if (templateLevels.length === 0) {
            container.innerHTML = `
                <div class="text-xs text-gray-400 text-center py-2">
                    No template levels available
                </div>
            `;
            return;
        }

        container.innerHTML = templateLevels.map((level, index) => `
            <div class="template-level-item bg-gray-700 border border-gray-600 rounded p-2 hover:bg-gray-650 transition-colors cursor-pointer"
                 data-template-index="${index}">
                <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center">
                            <span class="text-xs font-medium text-white">Level ${level.level_number}</span>
                            <span class="ml-2 px-1 py-0.5 bg-blue-600 text-xs rounded">Template</span>
                        </div>
                        <p class="text-xs text-blue-300 truncate mt-1">${level.name}</p>
                        <p class="text-xs text-gray-400">${level.data?.character || 'Unknown'}</p>
                    </div>
                    <div class="flex flex-col space-y-1 ml-2">
                        <button class="preview-template-btn bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs transition-colors"
                                data-template-index="${index}" title="Preview Template">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="import-template-btn bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-xs transition-colors"
                                data-template-index="${index}" title="Import to Database">
                            <i class="bi bi-download"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Bind template level events
        this.bindTemplateLevelEvents();
    }

    bindTemplateLevelEvents() {
        // Preview template buttons
        document.querySelectorAll('.preview-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateIndex = parseInt(e.target.closest('button').dataset.templateIndex);
                this.previewTemplateLevel(templateIndex);
            });
        });

        // Import template buttons
        document.querySelectorAll('.import-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateIndex = parseInt(e.target.closest('button').dataset.templateIndex);
                this.importTemplateLevel(templateIndex);
            });
        });

        // Template level item click (for preview)
        document.querySelectorAll('.template-level-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const templateIndex = parseInt(e.currentTarget.dataset.templateIndex);
                    this.previewTemplateLevel(templateIndex);
                }
            });
        });
    }

    toggleTemplateLevels() {
        const container = document.getElementById('template-levels-list');
        const button = document.getElementById('show-templates-btn');
        
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            button.innerHTML = '<i class="bi bi-eye-slash"></i> Hide';
            this.renderTemplateLevels();
        } else {
            container.classList.add('hidden');
            button.innerHTML = '<i class="bi bi-eye"></i> Show';
        }
    }

    previewTemplateLevel(templateIndex) {
        const templateLevels = this.existingLevelsData[this.currentRoom] || [];
        const level = templateLevels[templateIndex];
        
        if (!level) return;

        // Create a simplified preview modal
        const previewModal = document.createElement('div');
        previewModal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        previewModal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-blue-400">Template Preview: ${level.name}</h3>
                    <button class="close-preview text-gray-400 hover:text-white text-xl">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div><span class="text-gray-400">Level:</span> ${level.level_number}</div>
                        <div><span class="text-gray-400">Task Type:</span> ${level.data?.taskType || 'Unknown'}</div>
                        <div><span class="text-gray-400">Character:</span> ${level.data?.character || 'Not specified'}</div>
                        <div><span class="text-gray-400">Room:</span> ${this.getRoomName(this.currentRoom)}</div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-green-400 mb-2">Story</h4>
                        <p class="text-sm text-gray-300 bg-gray-700 p-3 rounded">${level.data?.story || 'No story provided'}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-purple-400 mb-2">Objective</h4>
                        <p class="text-sm text-gray-300 bg-gray-700 p-3 rounded">${level.data?.objective || 'No objective specified'}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-yellow-400 mb-2">Instructions</h4>
                        <p class="text-sm text-gray-300 bg-gray-700 p-3 rounded">${level.data?.instruction || 'No instructions provided'}</p>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="close-preview bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition-colors">
                        Close
                    </button>
                    <button class="import-from-preview bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition-colors" data-template-index="${templateIndex}">
                        <i class="bi bi-download"></i> Import This Level
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(previewModal);

        // Bind close events
        previewModal.querySelectorAll('.close-preview').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(previewModal);
            });
        });

        // Bind import from preview
        previewModal.querySelector('.import-from-preview').addEventListener('click', (e) => {
            const templateIndex = parseInt(e.target.dataset.templateIndex);
            document.body.removeChild(previewModal);
            this.importTemplateLevel(templateIndex);
        });
    }

    async importTemplateLevel(templateIndex) {
        const templateLevels = this.existingLevelsData[this.currentRoom] || [];
        const level = templateLevels[templateIndex];
        
        if (!level) return;

        try {
            // Get the next level number for this room
            const levels = this.levels[this.currentRoom] || [];
            const nextLevelNumber = levels.length > 0 ? Math.max(...levels.map(l => l.level_number)) + 1 : 1;

            const levelData = {
                room_id: this.currentRoom,
                level_number: nextLevelNumber,
                name: level.name,
                data: level.data
            };

            const response = await fetch('/api/admin/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(levelData)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.showMessage(`Template "${level.name}" imported successfully`, 'success');
                
                // Reload levels for current room
                await this.loadLevelsForRoom(this.currentRoom);
                
                // Auto-select the new level
                const newLevel = this.levels[this.currentRoom]?.find(l => l.id === result.level_id);
                if (newLevel) {
                    this.selectLevel(newLevel.id);
                }
            } else {
                this.showMessage(result.message || 'Failed to import template', 'error');
            }
        } catch (error) {
            console.error('Import template level error:', error);
            this.showMessage('Failed to import template', 'error');
        }
    }

    renderLevelsList() {
        const listContainer = document.getElementById('levels-list');
        const levels = this.levels[this.currentRoom] || [];
        
        // Update level count in room info
        const countElement = document.getElementById('room-level-count');
        if (countElement) {
            countElement.textContent = `${levels.length} level${levels.length !== 1 ? 's' : ''}`;
        }
        
        if (levels.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center text-gray-400 py-4">
                    <i class="bi bi-inbox text-2xl mb-2"></i>
                    <p class="text-sm">No database levels found</p>
                    <div class="mt-3 space-y-2">
                        <button class="w-full text-green-400 hover:text-green-300 text-sm bg-gray-700 hover:bg-gray-600 py-2 rounded transition-colors" onclick="levelEditor.populateDefaultLevels()">
                            <i class="bi bi-download"></i> Load Defaults
                        </button>
                        <button class="w-full text-blue-400 hover:text-blue-300 text-sm bg-gray-700 hover:bg-gray-600 py-2 rounded transition-colors" onclick="levelEditor.toggleTemplateLevels()">
                            <i class="bi bi-collection"></i> View Templates
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Sort levels by level_number to ensure proper ordering
        const sortedLevels = levels.sort((a, b) => (a.level_number || 0) - (b.level_number || 0));

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
                         data-level-id="${level.id}" data-level-number="${level.level_number || 1}">
                        <div class="drag-handle flex-shrink-0 mr-3">
                            <i class="bi bi-grip-vertical"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center">
                                <div class="min-w-0 flex-1">
                                    <h3 class="font-bold text-blue-300">Level ${level.level_number || 1}</h3>
                                    <p class="text-sm text-gray-300 truncate">${level.name || 'Untitled Level'}</p>
                                    <p class="text-xs text-gray-400">${(level.data && level.data.taskType) || 'No task type'}</p>
                                </div>
                                <div class="text-xs text-gray-400 flex-shrink-0 ml-3">
                                    <div>Updated: ${level.updated_at ? new Date(level.updated_at).toLocaleDateString() : 'Unknown'}</div>
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

            // Get the next level number for this room - ensure it's always incremental
            const levels = this.levels[this.currentRoom] || [];
            let nextLevelNumber = 1;
            
            if (levels.length > 0) {
                // Find the highest level number and add 1
                const maxLevelNumber = Math.max(...levels.map(l => l.level_number || 0));
                nextLevelNumber = maxLevelNumber + 1;
            }

            // Get proper template for current room with all required fields
            const baseTemplate = this.roomTemplates[this.currentRoom] || {};
            const roomName = this.getRoomName(this.currentRoom);
            
            // Create comprehensive level data with proper defaults
            const levelData = {
                room_id: this.currentRoom,
                level_number: nextLevelNumber,
                name: name.trim(),
                data: {
                    name: name.trim(),
                    story: baseTemplate.story || `Welcome to ${roomName}! Complete this level to progress through your training.`,
                    objective: baseTemplate.objective || `Complete the ${baseTemplate.taskType || 'task'} to finish this level.`,
                    character: this.getDefaultCharacter(this.currentRoom),
                    taskType: baseTemplate.taskType || 'basic',
                    instruction: baseTemplate.instruction || `Use the interface to complete the ${baseTemplate.taskType || 'task'}.`,
                    hint: baseTemplate.hint || `Need help? Look for clues in the instructions and try different approaches.`,
                    ...this.getRoomSpecificDefaults(this.currentRoom),
                    successCriteria: baseTemplate.successCriteria || {}
                }
            };

            console.log('Creating level with data:', levelData);

            const response = await fetch('/api/admin/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(levelData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
                this.showMessage('Level created successfully', 'success');
                this.hideCreateLevelModal();
                
                // Reload levels for current room to get updated data
                await this.loadLevelsForRoom(this.currentRoom);
                
                // Auto-select the new level if it exists
                setTimeout(() => {
                    const newLevel = this.levels[this.currentRoom]?.find(l => l.id === result.level_id);
                    if (newLevel) {
                        this.selectLevel(newLevel.id);
                    }
                }, 100);
            } else {
                this.showMessage(result.message || 'Failed to create level', 'error');
            }
        } catch (error) {
            console.error('Create level error:', error);
            this.showMessage(`Failed to create level: ${error.message}`, 'error');
        }
    }

    offerManualTemplateCreation() {
        const confirmed = confirm(
            'Would you like to create a basic level template manually?\n\n' +
            'This will create a new level with the default template for the current room.'
        );
        
        if (confirmed) {
            this.createLevelFromTemplate();
        }
    }

    createLevelFromTemplate() {
        // Auto-create a level using the room template
        const template = this.roomTemplates[this.currentRoom] || {};
        const roomName = this.getRoomName(this.currentRoom);
        
        // Generate a default name
        const levels = this.levels[this.currentRoom] || [];
        const nextLevelNumber = levels.length > 0 ? Math.max(...levels.map(l => l.level_number || 0)) + 1 : 1;
        const defaultName = `${roomName} Level ${nextLevelNumber}`;
        
        // Pre-fill the create modal with template data
        this.showCreateLevelModal();
        
        // Set the default name
        setTimeout(() => {
            const nameInput = document.querySelector('#create-level-form input[name="name"]');
            if (nameInput) {
                nameInput.value = defaultName;
            }
        }, 100);
        
        this.showMessage(`Template ready for ${roomName}. Customize the name and create the level.`, 'info');
    }

    async loadLevelsForRoom(roomId) {
        try {
            const response = await fetch(`/api/admin/levels/${roomId}`);
            
            if (!response.ok) {
                // Handle 404 or other HTTP errors gracefully
                if (response.status === 404) {
                    console.warn(`No levels endpoint found for room ${roomId}`);
                    this.levels[roomId] = [];
                    this.renderLevelsList();
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.levels[roomId] = data.levels || [];
                this.renderLevelsList();
                console.log(`Loaded ${this.levels[roomId].length} levels for room ${roomId}`);
            } else {
                console.warn(`API returned non-success status: ${data.message}`);
                // Initialize empty levels array if API returns non-success
                this.levels[roomId] = [];
                this.renderLevelsList();
            }
        } catch (error) {
            console.error('Load levels error:', error);
            this.showMessage('Could not load existing levels - starting with empty state', 'info');
            // Initialize empty levels array on error
            this.levels[roomId] = [];
            this.renderLevelsList();
        }
    }

    async populateDefaultLevels() {
        const confirmed = confirm(
            'This will populate the database with default level templates. ' +
            'These are basic templates that you can customize. ' +
            'If levels already exist, this operation will not overwrite them. Continue?'
        );
        
        if (!confirmed) return;

        try {
            const response = await fetch('/api/admin/levels/populate-defaults', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.status === 'success' || result.status === 'info') {
                this.showMessage(result.message, result.status === 'success' ? 'success' : 'info');
                // Reload levels for current room
                await this.loadLevelsForRoom(this.currentRoom);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Populate defaults error:', error);
            // If populate defaults fails, offer manual template creation
            this.showMessage('Populate defaults not available. You can create levels manually using templates.', 'warning');
            this.offerManualTemplateCreation();
        }
    }

    getDefaultCharacter(roomId) {
        const characters = {
            1: 'Flowchart Master',
            2: 'Net Admin',
            3: 'AI Trainer',
            4: 'DB Admin',
            5: 'Code Monkey'
        };

        return characters[roomId] || 'Instructor';
    }

    getRoomSpecificDefaults(roomId) {
        switch (roomId) {
            case 1: // Flowchart Lab
                return {
                    flowchartData: {
                        startNode: { id: 'start', type: 'start', text: 'Start', x: 100, y: 50 },
                        endNode: { id: 'end', type: 'end', text: 'End', x: 100, y: 300 },
                        nodes: [],
                        connections: []
                    }
                };
            case 2: // Network Nexus
                return {
                    requiredDevices: ['router', 'switch', 'computer'],
                    requiredConnections: 2,
                    networkTopology: {
                        devices: [],
                        connections: []
                    }
                };
            case 3: // AI Systems
                return {
                    dataset: [],
                    algorithm: 'decision-tree',
                    trainingRounds: 3,
                    category: 'basic'
                };
            case 4: // Database Crisis
                return {
                    database: 'sample_db',
                    tables: ['users', 'orders'],
                    expectedQuery: 'SELECT * FROM users;',
                    difficulty: 'beginner'
                };
            case 5: // Programming Crisis
                return {
                    code: 'def example():\n    # Your code here\n    pass',
                    language: 'python',
                    bugs: [],
                    playerStart: { x: 1, y: 6 }
                };
            default:
                return {};
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

            // Ensure the name in the data matches the input
            levelData.name = name;

            const updateData = {
                name: name,
                data: levelData
            };

            console.log('Saving level:', this.selectedLevel.id, updateData);

            const response = await fetch(`/api/admin/levels/${this.selectedLevel.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
                this.showMessage('Level saved successfully', 'success');
                
                // Update local data
                this.selectedLevel.name = name;
                this.selectedLevel.data = levelData;
                this.selectedLevel.updated_at = new Date().toISOString();
                
                // Update the level in the levels array
                const levelIndex = this.levels[this.currentRoom].findIndex(l => l.id === this.selectedLevel.id);
                if (levelIndex !== -1) {
                    this.levels[this.currentRoom][levelIndex] = { ...this.selectedLevel };
                }
                
                // Refresh the levels list to show updated data
                this.renderLevelsList();
                
                // Re-select the current level to maintain editor state
                setTimeout(() => {
                    this.selectLevel(this.selectedLevel.id);
                }, 100);
            } else {
                this.showMessage(result.message || 'Failed to save level', 'error');
            }
        } catch (error) {
            console.error('Save level error:', error);
            this.showMessage(`Failed to save level: ${error.message}`, 'error');
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
            console.log('Deleting level:', this.selectedLevel.id);

            const response = await fetch(`/api/admin/levels/${this.selectedLevel.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
                this.showMessage('Level deleted successfully', 'success');
                
                // Remove the level from local data
                const levelIndex = this.levels[this.currentRoom].findIndex(l => l.id === this.selectedLevel.id);
                if (levelIndex !== -1) {
                    this.levels[this.currentRoom].splice(levelIndex, 1);
                }
                
                // Clear editor and reload levels to ensure consistency
                this.clearEditor();
                await this.loadLevelsForRoom(this.currentRoom);
            } else {
                this.showMessage(result.message || 'Failed to delete level', 'error');
            }
        } catch (error) {
            console.error('Delete level error:', error);
            this.showMessage(`Failed to delete level: ${error.message}`, 'error');
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

            console.log('Importing levels:', requestData);

            const response = await fetch('/api/admin/import-levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

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
            this.showMessage(`Failed to import levels: ${error.message}`, 'error');
        }
    }

    async exportLevels() {
        try {
            console.log('Exporting levels for room:', this.currentRoom);

            const response = await fetch(`/api/admin/export-levels/${this.currentRoom}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (response.headers.get('content-type')?.includes('application/json')) {
                // Handle JSON response (likely an error)
                const result = await response.json();
                this.showMessage(result.message || 'Failed to export levels', 'error');
                return;
            }

            // Handle file download
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
        } catch (error) {
            console.error('Export levels error:', error);
            this.showMessage(`Failed to export levels: ${error.message}`, 'error');
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

    // ...existing code...
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