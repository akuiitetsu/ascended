-- Badge system tables
CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges (id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_id)
);

-- Insert default badges
INSERT OR IGNORE INTO badges (name, description, icon) VALUES
('First Steps', 'Complete your first level', '🚀'),
('Quick Learner', 'Complete 5 levels in one session', '⚡'),
('Room Explorer', 'Complete your first room', '🏆'),
('Flowchart Master', 'Complete the Flowchart Construction Lab', '🔄'),
('Networking Expert', 'Complete the Networking Nexus room', '🌐'),
('AI Systems Specialist', 'Complete the AI Systems room', '🤖'),
('Database Engineer', 'Complete the Database Emergency room', '💾'),
('Programming Master', 'Complete the Programming Crisis room', '💻'),
('Speed Demon', 'Complete a level in under 2 minutes', '💨'),
('Perfectionist', 'Complete 10 levels without any mistakes', '✨'),
('Marathon Runner', 'Play for 2 hours straight', '🏃'),
('All Rounder', 'Complete all 5 rooms', '🎯');

-- Level management tables
CREATE TABLE IF NOT EXISTS level_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    level_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON data for level configuration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, level_number)
);

-- Insert default levels from existing codebase
-- Room 1: Flowchart Construction Lab
INSERT OR IGNORE INTO level_data (room_id, level_number, name, data) VALUES 
(1, 1, 'Basic Start-End Flow', '{"taskType": "flowchart", "instruction": "Create a simple flowchart with START and END ovals", "hint": "Every flowchart needs a START and END oval", "minNodes": 2, "maxNodes": 3, "validationRules": {"mustHaveStart": true, "mustHaveEnd": true}}'),
(1, 2, 'Adding Process Steps', '{"taskType": "flowchart", "instruction": "Create a flowchart: OVAL → RECTANGLE → OVAL", "hint": "Use a rectangle (process) between your start and end ovals", "minNodes": 3, "maxNodes": 4, "validationRules": {"mustHaveStart": true, "mustHaveEnd": true, "mustHaveProcess": true}}'),
(1, 3, 'Decision Making', '{"taskType": "flowchart", "instruction": "Create: OVAL → DIAMOND → two RECTANGLES → OVAL", "hint": "Use a diamond for decisions that split into multiple paths", "minNodes": 5, "maxNodes": 6, "validationRules": {"mustHaveStart": true, "mustHaveEnd": true, "mustHaveDecision": true, "mustHaveMultipleProcesses": true}}'),
(1, 4, 'Input and Output', '{"taskType": "flowchart", "instruction": "Create a complete flowchart with PARALLELOGRAM → RECTANGLE → DIAMOND → PARALLELOGRAM", "hint": "Use parallelograms for input/output operations", "minNodes": 6, "maxNodes": 8, "validationRules": {"mustHaveStart": true, "mustHaveEnd": true, "mustHaveInput": true, "mustHaveProcess": true, "mustHaveDecision": true}}'),
(1, 5, 'Complex Flow Design', '{"taskType": "flowchart", "instruction": "Design a complete algorithm flowchart with loops and multiple decisions", "hint": "Use arrows to create loops and complex pathways between shapes", "minNodes": 8, "maxNodes": 12, "validationRules": {"mustHaveStart": true, "mustHaveEnd": true, "mustHaveMultipleDecisions": true, "mustHaveMultipleProcesses": true, "mustHaveInput": true, "complexFlow": true}}');

-- Room 2: Network Nexus
INSERT OR IGNORE INTO level_data (room_id, level_number, name, data) VALUES 
(2, 1, 'Power On: Topology Builder', '{"name": "Power On: Topology Builder", "story": "🏙️ The citys public information kiosks have gone dark! Citizens cant access emergency alerts or city services. You need to rebuild the basic network infrastructure from scratch.", "objective": "Build a simple network layout with end devices and routers", "character": "👨‍💻 Alex (Network Technician)", "taskType": "topology-builder", "instruction": "Place 2 PCs and 1 router, then connect them with straight-through cables", "hint": "Drag devices from the toolkit, then use cables to connect PC ports to router ports", "requiredDevices": [{"type": "pc", "count": 2}, {"type": "router", "count": 1}], "requiredConnections": 2}'),
(2, 2, 'IP Up: Address Assignment', '{"name": "IP Up: Address Assignment", "story": "🌐 The devices are connected but they cant communicate! Each device needs a unique IP address on the same network segment to establish communication.", "objective": "Assign IP addresses and confirm basic connectivity", "character": "🔧 Sarah (Systems Admin)", "taskType": "ip-assignment", "instruction": "Configure IP addresses in the same subnet and test connectivity with ping", "hint": "Use 192.168.1.0/24 network - assign .10, .11 to PCs and .1 to router", "requiredSubnet": "192.168.1.0/24", "deviceConfigs": [{"type": "pc", "ip": "192.168.1.10", "mask": "255.255.255.0"}, {"type": "pc", "ip": "192.168.1.11", "mask": "255.255.255.0"}, {"type": "router", "ip": "192.168.1.1", "mask": "255.255.255.0"}]}'),
(2, 3, 'Switch It On!', '{"name": "Switch It On!", "story": "⚡ The police terminal and CCTV station are flooding the router with local traffic. You need to add a switch to handle local communication more efficiently.", "objective": "Add a switch to improve local device communication", "character": "👮‍♀️ Officer Kim (Security Tech)", "taskType": "switch-optimization", "instruction": "Add a switch and connect PCs to it for faster local communication", "hint": "Connect PCs to switch first, then switch to router - observe improved local ping times", "requiredDevices": [{"type": "pc", "count": 2}, {"type": "switch", "count": 1}, {"type": "router", "count": 1}]}'),
(2, 4, 'Route Me Right', '{"name": "Route Me Right", "story": "🏢 The city has expanded! East district and West district need separate networks, but emergency services must communicate across both zones during crisis situations.", "objective": "Set static routes for inter-network communication", "character": "🚨 Captain Rodriguez (Emergency Coordinator)", "taskType": "static-routing", "instruction": "Configure static routes between two networks: 192.168.1.0/24 and 192.168.2.0/24", "hint": "Set up routes on both routers: R1 needs route to 192.168.2.0/24 via R2, and vice versa", "networks": [{"subnet": "192.168.1.0/24", "router": "R1"}, {"subnet": "192.168.2.0/24", "router": "R2"}]}'),
(2, 5, 'Command Central', '{"name": "Command Central", "story": "💻 City sensors are reporting critical data to command central, but the network is experiencing issues. You need to troubleshoot using command-line tools to diagnose and fix routing problems.", "objective": "Use CLI commands to troubleshoot and configure network routes", "character": "🎯 Commander Chen (Operations Chief)", "taskType": "cli-troubleshooting", "instruction": "Use CLI commands to check routes, diagnose issues, and add missing static routes", "hint": "Try show ip route, ping, and ip route add commands to fix connectivity", "cliCommands": ["show ip route", "ping 192.168.2.10", "traceroute 192.168.2.10", "ip route add 192.168.2.0/24 via 192.168.100.2"]}');

-- Room 3: AI Systems
INSERT OR IGNORE INTO level_data (room_id, level_number, name, data) VALUES 
(3, 1, 'Ethics Training', '{"taskType": "ai-training", "category": "Ethics", "instruction": "Train the AI to make ethical decisions by swiping cards", "hint": "Swipe right for ethical choices, left for unethical ones", "scenarios": [{"title": "Data Privacy", "description": "AI system wants to use personal data without consent", "is_ethical": false}, {"title": "Bias Detection", "description": "AI notices potential bias in training data", "is_ethical": true}, {"title": "Transparency", "description": "AI provides clear explanations for its decisions", "is_ethical": true}, {"title": "Harmful Content", "description": "AI generates content that could harm individuals", "is_ethical": false}, {"title": "Fair Treatment", "description": "AI treats all users equally regardless of background", "is_ethical": true}]}'),
(3, 2, 'Supervised Learning', '{"taskType": "ai-training", "category": "Supervised", "instruction": "Teach AI to recognize supervised learning examples", "hint": "Swipe right for supervised learning examples (labeled data)", "scenarios": [{"title": "Email Classification", "description": "Training with emails labeled as spam or not spam", "is_correct": true}, {"title": "Image Recognition", "description": "Training with images labeled with object names", "is_correct": true}, {"title": "Customer Clustering", "description": "Finding hidden groups in customer data", "is_correct": false}, {"title": "Price Prediction", "description": "Training with house features and known prices", "is_correct": true}, {"title": "Pattern Discovery", "description": "Finding unknown patterns in unlabeled data", "is_correct": false}]}'),
(3, 3, 'Reinforcement Learning', '{"taskType": "ai-training", "category": "Reinforcement", "instruction": "Identify reinforcement learning scenarios", "hint": "Swipe right for reward-based learning examples", "scenarios": [{"title": "Game Playing", "description": "AI gets points for winning and loses points for losing", "is_right": true}, {"title": "Robot Navigation", "description": "Robot gets rewards for reaching goals, penalties for obstacles", "is_right": true}, {"title": "Image Labeling", "description": "Training with pre-labeled image datasets", "is_right": false}, {"title": "Trading Bot", "description": "AI gets rewards for profitable trades, penalties for losses", "is_right": true}, {"title": "Data Classification", "description": "Training with known categories and examples", "is_right": false}]}'),
(3, 4, 'Unsupervised Learning', '{"taskType": "ai-training", "category": "Unsupervised", "instruction": "Recognize unsupervised learning patterns", "hint": "Swipe right for pattern discovery in unlabeled data", "scenarios": [{"title": "Customer Segmentation", "description": "Finding hidden customer groups without labels", "is_cluster": true}, {"title": "Anomaly Detection", "description": "Identifying unusual patterns in data", "is_cluster": true}, {"title": "Spam Detection", "description": "Training with emails labeled spam or not spam", "is_cluster": false}, {"title": "Market Basket Analysis", "description": "Finding items frequently bought together", "is_cluster": true}, {"title": "Medical Diagnosis", "description": "Training with symptoms and known diagnoses", "is_cluster": false}]}'),
(3, 5, 'Deep Learning', '{"taskType": "ai-training", "category": "Deep", "instruction": "Identify deep learning applications", "hint": "Swipe right for neural network-based solutions", "scenarios": [{"title": "Image Recognition", "description": "Using convolutional neural networks for image classification", "is_neural_net": true}, {"title": "Language Translation", "description": "Using transformer networks to translate languages", "is_neural_net": true}, {"title": "Simple Regression", "description": "Using linear regression to predict house prices", "is_neural_net": false}, {"title": "Speech Recognition", "description": "Using recurrent neural networks for speech-to-text", "is_neural_net": true}, {"title": "Decision Trees", "description": "Using rule-based trees for classification", "is_neural_net": false}]}');

-- Room 4: Database Emergency
INSERT OR IGNORE INTO level_data (room_id, level_number, name, data) VALUES 
(4, 1, 'Database Assessment', '{"taskType": "sql-query", "instruction": "Assess database corruption using SQL commands", "hint": "Use PRAGMA integrity_check and SELECT statements to examine tables", "requiredCommands": ["PRAGMA integrity_check", "SELECT COUNT(*) FROM users", "SHOW TABLES"], "successCriteria": {"commandsExecuted": 3, "tablesAnalyzed": true}}'),
(4, 2, 'Backup Recovery', '{"taskType": "sql-query", "instruction": "Recover data from backup using SQL restoration commands", "hint": "Use backup restoration and data verification queries", "requiredCommands": ["RESTORE FROM backup_file", "SELECT * FROM recovered_tables", "VERIFY DATA"], "successCriteria": {"backupRestored": true, "dataVerified": true}}'),
(4, 3, 'Manual Repair', '{"taskType": "sql-query", "instruction": "Manually repair corrupted tables using REPAIR commands", "hint": "Use REPAIR TABLE and UPDATE statements to fix data integrity", "requiredCommands": ["REPAIR TABLE users", "UPDATE corrupted_data", "CHECK TABLE"], "successCriteria": {"tablesRepaired": true, "integrityRestored": true}}'),
(4, 4, 'Data Verification', '{"taskType": "sql-query", "instruction": "Verify database integrity and completeness", "hint": "Run comprehensive checks on all recovered data", "requiredCommands": ["SELECT verification_queries", "CHECK CONSTRAINTS", "VALIDATE FOREIGN_KEYS"], "successCriteria": {"allTablesVerified": true, "constraintsValid": true}}'),
(4, 5, 'Recovery Complete', '{"taskType": "sql-query", "instruction": "Complete database recovery and generate recovery report", "hint": "Generate final status report and confirm all systems operational", "requiredCommands": ["GENERATE REPORT", "CONFIRM RECOVERY", "ENABLE PRODUCTION"], "successCriteria": {"recoveryComplete": true, "systemsOnline": true}}');

-- Room 5: Programming Crisis
INSERT OR IGNORE INTO level_data (room_id, level_number, name, data) VALUES 
(5, 1, 'Basic Navigation', '{"taskType": "code-debug", "instruction": "Navigate the grid using basic movement commands", "hint": "Use move(), turn_left(), turn_right() to reach the target", "language": "python", "startCode": "# Move to the target\\n# Available commands: move(), turn_left(), turn_right()\\n\\n", "successCriteria": {"targetReached": true, "codeExecuted": true}}'),
(5, 2, 'Loop Control', '{"taskType": "code-debug", "instruction": "Use loops to navigate efficiently", "hint": "Use for or while loops to reduce repetitive commands", "language": "python", "startCode": "# Use loops to move efficiently\\n# Try: for i in range(3): move()\\n\\n", "successCriteria": {"loopsUsed": true, "targetReached": true}}'),
(5, 3, 'Conditional Logic', '{"taskType": "code-debug", "instruction": "Add conditions to handle different scenarios", "hint": "Use if statements to check conditions and make decisions", "language": "python", "startCode": "# Use if statements for conditional movement\\n# Try: if front_is_clear(): move()\\n\\n", "successCriteria": {"conditionsUsed": true, "targetReached": true}}'),
(5, 4, 'Bug Elimination', '{"taskType": "code-debug", "instruction": "Debug code to eliminate system bugs", "hint": "Find and fix syntax errors, logic errors, and runtime errors", "language": "python", "startCode": "# Debug this code to eliminate bugs\\nfor i in range(5)\\n    move()\\n    if bug_present():\\n        eliminate_bug\\n\\n", "successCriteria": {"bugsFixed": true, "codeExecutes": true}}'),
(5, 5, 'Advanced Programming', '{"taskType": "code-debug", "instruction": "Write complex code with functions and error handling", "hint": "Use functions, try-except blocks, and advanced programming concepts", "language": "python", "startCode": "# Write advanced code with functions\\ndef navigate_safely():\\n    try:\\n        # Your code here\\n        pass\\n    except Exception as e:\\n        handle_error(e)\\n\\n", "successCriteria": {"functionsUsed": true, "errorHandling": true, "targetReached": true}}');

-- Update schema version
UPDATE system_info SET value = '2.0' WHERE key = 'schema_version';
