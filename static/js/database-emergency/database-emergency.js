// Import all modules using ES6 imports
import { SQLProcessor } from './sql-processor.js';
import { TerminalManager } from './terminal-manager.js';
import { BackupManager } from './backup-manager.js';
import { VerificationManager } from './verification-manager.js';

class Room4 {
    constructor(game) {
        this.game = game;
        this.corruptedTables = 8;
        this.recoveredTables = 0;
        this.dataIntegrity = 25; // %
        this.backupStatus = 'CORRUPTED';
        this.transactionLog = 'DAMAGED';
        this.currentStep = 'assessment';
        this.sqlCommands = [];
        this.sqlEditor = null;
        this.queryResults = [];
        this.tablesStatus = {
            'users': 'corrupted',
            'orders': 'corrupted', 
            'products': 'corrupted',
            'payments': 'corrupted',
            'inventory': 'corrupted',
            'customers': 'corrupted',
            'transactions': 'corrupted',
            'audit_log': 'corrupted'
        };
        
        // Command history
        this.commandHistory = [];
        this.commandHistoryIndex = -1;
        this.assessmentProgress = 0;
        
        // Initialize managers
        this.sqlProcessor = new SQLProcessor(this);
        this.terminalManager = new TerminalManager(this);
        this.backupManager = new BackupManager(this);
        this.verificationManager = new VerificationManager(this);
    }

    async init() {
        const response = await fetch('data/database-emergency.json');
        this.data = await response.json();
        
        // Try to initialize real database connection
        await this.sqlProcessor.initializeConnection();
        
        this.render();
    }

    render() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-database-x text-6xl text-red-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-red-400">DATABASE EMERGENCY</h2>
                    <p class="text-gray-300 mt-2">Critical data corruption detected - Emergency recovery required</p>
                </div>
                
                <div class="database-status grid grid-cols-3 gap-4 mb-6">
                    <div class="status-card bg-red-900 p-3 rounded text-center">
                        <i class="bi bi-exclamation-triangle text-red-400 text-xl"></i>
                        <p class="text-xs text-red-200">Corrupted Tables</p>
                        <p id="corrupted-count" class="text-lg font-bold text-red-100">${this.corruptedTables}/8</p>
                        <p class="text-xs text-red-300">Critical</p>
                    </div>
                    <div class="status-card bg-orange-900 p-3 rounded text-center">
                        <i class="bi bi-hdd text-orange-400 text-xl"></i>
                        <p class="text-xs text-orange-200">Data Integrity</p>
                        <p id="data-integrity" class="text-lg font-bold text-orange-100">${Math.round(this.dataIntegrity)}%</p>
                        <p class="text-xs ${this.dataIntegrity > 70 ? 'text-green-400' : 'text-red-400'}">
                            ${this.dataIntegrity > 70 ? 'Stable' : 'Critical'}
                        </p>
                    </div>
                    <div class="status-card bg-blue-900 p-3 rounded text-center">
                        <i class="bi bi-arrow-repeat text-blue-400 text-xl"></i>
                        <p class="text-xs text-blue-200">Recovery Progress</p>
                        <p id="recovery-progress" class="text-lg font-bold text-blue-100">${this.recoveredTables}/8</p>
                        <p class="text-xs text-blue-300">Tables Fixed</p>
                    </div>
                </div>

                <div class="step-content">
                    ${this.renderCurrentStep()}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderCurrentStep() {
        switch(this.currentStep) {
            case 'assessment':
                return this.terminalManager.renderAssessmentStep();
            case 'backup':
                return this.backupManager.renderBackupStep();
            case 'repair':
                return this.terminalManager.renderRepairStep();
            case 'verification':
                return this.verificationManager.renderVerificationStep();
            default:
                return '<div class="error">Unknown step</div>';
        }
    }

    setupEventListeners() {
        this.terminalManager.setupEventListeners();
        this.backupManager.setupEventListeners();
        this.verificationManager.setupEventListeners();
    }

    // Step progression methods
    proceedToBackup() {
        this.showMessage('Assessment complete! Proceeding to backup recovery...', 'info');
        this.currentStep = 'backup';
        this.assessmentProgress = 0;
        setTimeout(() => this.render(), 1500);
    }

    proceedToRepair() {
        this.showMessage('Backup restored! Proceeding to manual table repair...', 'info');
        this.currentStep = 'repair';
        setTimeout(() => this.render(), 1500);
    }

    proceedToVerification() {
        this.showMessage('Repairs complete! Proceeding to data verification...', 'info');
        this.currentStep = 'verification';
        setTimeout(() => this.render(), 1500);
    }

    // Utility methods
    updateStatusDisplays() {
        const integrityDisplay = document.getElementById('data-integrity');
        const progressDisplay = document.getElementById('recovery-progress');
        const corruptedDisplay = document.getElementById('corrupted-count');
        
        if (integrityDisplay) integrityDisplay.textContent = `${Math.round(this.dataIntegrity)}%`;
        if (progressDisplay) progressDisplay.textContent = `${this.recoveredTables}/8`;
        if (corruptedDisplay) corruptedDisplay.textContent = `${this.corruptedTables}/8`;
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-20 right-4 p-3 rounded z-50 animate-pulse`;
        
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
        }
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 3000);
    }

    databaseRecovered() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="database-recovered text-center p-8">
                <i class="bi bi-database-check text-8xl text-green-400 mb-4 animate-bounce"></i>
                <h2 class="text-3xl font-bold text-green-400 mb-4">DATABASE RECOVERED</h2>
                
                <div class="final-metrics grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-green-800 p-3 rounded">
                        <p class="text-green-200">Data Integrity</p>
                        <p class="text-xl font-bold text-green-400">${Math.round(this.dataIntegrity)}%</p>
                        <p class="text-xs text-green-300">✓ Restored</p>
                    </div>
                    <div class="bg-blue-800 p-3 rounded">
                        <p class="text-blue-200">Tables Recovered</p>
                        <p class="text-xl font-bold text-blue-400">${this.recoveredTables}/8</p>
                        <p class="text-xs text-blue-300">✓ Complete</p>
                    </div>
                    <div class="bg-purple-800 p-3 rounded">
                        <p class="text-purple-200">Commands Used</p>
                        <p class="text-xl font-bold text-purple-400">${this.sqlCommands.length}</p>
                        <p class="text-xs text-purple-300">✓ Expert Level</p>
                    </div>
                </div>
                
                <div class="recovery-report bg-gray-800 p-4 rounded mb-4">
                    <h4 class="font-bold text-gray-200 mb-2">💾 Database Recovery Report</h4>
                    <div class="text-left text-sm text-gray-300">
                        <p>✅ Database assessment completed using SQL diagnostics</p>
                        <p>✅ Backup recovery executed with optimal integrity selection</p>
                        <p>✅ All 8 critical tables manually repaired using REPAIR commands</p>
                        <p>✅ Data verification tests passed with full integrity</p>
                        <p>✅ All critical business data preserved and accessible</p>
                        <p>✅ Database performance restored to optimal levels</p>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            // Enhanced completion data for badge system
            const completionData = {
                score: Math.round(this.dataIntegrity),
                timeSpent: Date.now() - this.startTime,
                hintsUsed: 0,
                tablesRepaired: this.recoveredTables,
                sqlCommands: this.sqlCommands.length,
                dataIntegrity: Math.round(this.dataIntegrity),
                attempts: 1,
                databaseRecovery: true
            };
            
            this.game.roomCompleted(
                `Database emergency resolved through expert SQL recovery! All ${this.recoveredTables} tables recovered with ${Math.round(this.dataIntegrity)}% data integrity using hands-on database administration.`,
                completionData
            );
        }, 3000);
    }

    cleanup() {
        // Cleanup method without timer
    }
}

// Register the class globally
window.Room4 = Room4;

// Also export for potential module use
export { Room4 };