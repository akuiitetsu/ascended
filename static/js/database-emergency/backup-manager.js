export class BackupManager {
    constructor(room) {
        this.room = room;
        this.selectedBackup = null;
    }

    renderBackupStep() {
        return `
            <div class="backup-step">
                <h3 class="text-xl font-bold text-orange-400 mb-4">💾 Backup Recovery</h3>
                <p class="text-gray-300 mb-4">Select the optimal backup for data restoration</p>
                
                <div class="backup-options space-y-3 mb-4">
                    ${this.room.data.available_backups.map(backup => `
                        <div class="backup-item ${this.selectedBackup === backup.id ? 'selected bg-blue-800 border-blue-400' : 'bg-gray-800 hover:bg-gray-700'} 
                             border-2 ${this.selectedBackup === backup.id ? 'border-blue-400' : 'border-gray-600'} 
                             p-4 rounded cursor-pointer transition-colors" 
                             data-backup="${backup.id}">
                            <div class="grid grid-cols-6 gap-4 items-center">
                                <div class="backup-info">
                                    <div class="font-bold text-white">${backup.filename}</div>
                                    <div class="text-sm text-gray-400">${backup.date}</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-purple-300 font-bold">${backup.size}</div>
                                    <div class="text-xs text-gray-400">File Size</div>
                                </div>
                                <div class="text-center">
                                    <div class="integrity-bar bg-gray-700 rounded-full h-2 mb-1">
                                        <div class="bg-${this.getIntegrityColor(backup.integrity)} h-2 rounded-full" 
                                             style="width: ${backup.integrity}%"></div>
                                    </div>
                                    <div class="text-xs ${this.getIntegrityTextColor(backup.integrity)}">${backup.integrity}% Integrity</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-yellow-300 font-bold">${backup.tables_affected}</div>
                                    <div class="text-xs text-gray-400">Tables</div>
                                </div>
                                <div class="description">
                                    <div class="text-sm text-gray-300">${backup.description}</div>
                                </div>
                                <div class="selection-indicator text-center">
                                    ${this.selectedBackup === backup.id ? 
                                        '<i class="bi bi-check-circle-fill text-blue-400 text-2xl"></i>' : 
                                        '<i class="bi bi-circle text-gray-500 text-2xl"></i>'
                                    }
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="backup-analysis bg-gray-800 p-4 rounded mb-4">
                    <h4 class="font-bold text-gray-200 mb-3">📊 Backup Analysis</h4>
                    ${this.selectedBackup ? this.renderBackupAnalysis() : '<p class="text-gray-400">Select a backup to view detailed analysis</p>'}
                </div>
                
                <div class="control-buttons text-center">
                    <button id="execute-restore" class="btn-primary px-6 py-3 rounded mr-4" 
                            ${!this.selectedBackup ? 'disabled' : ''}>
                        <i class="bi bi-download"></i> Execute Restore
                    </button>
                    <button id="skip-backup" class="bg-red-600 hover:bg-red-500 px-6 py-3 rounded transition-colors">
                        <i class="bi bi-skip-forward"></i> Skip to Manual Repair
                    </button>
                </div>
            </div>
        `;
    }

    renderBackupAnalysis() {
        const backup = this.room.data.available_backups.find(b => b.id === this.selectedBackup);
        if (!backup) return '';

        return `
            <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p class="text-blue-300">Restore Time: <span class="text-white font-mono">~${Math.round(backup.size.replace('GB', '') * 2)} minutes</span></p>
                    <p class="text-green-300">Data Recovery: <span class="text-white font-mono">${backup.integrity}%</span></p>
                    <p class="text-yellow-300">Tables Affected: <span class="text-white font-mono">${backup.tables_affected}</span></p>
                </div>
                <div>
                    <p class="text-purple-300">Risk Level: <span class="text-white font-mono">${this.getBackupRisk(backup)}</span></p>
                    <p class="text-orange-300">Data Loss: <span class="text-white font-mono">${100 - backup.integrity}%</span></p>
                    <p class="text-red-300">Downtime: <span class="text-white font-mono">${this.getDowntimeEstimate(backup)}</span></p>
                </div>
                <div>
                    <p class="text-cyan-300">Recommendation: <span class="text-white font-mono">${this.getRecommendation(backup)}</span></p>
                    <p class="text-pink-300">Business Impact: <span class="text-white font-mono">${this.getBusinessImpact(backup)}</span></p>
                    <p class="text-lime-300">Success Probability: <span class="text-white font-mono">${backup.integrity}%</span></p>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Backup selection
        document.querySelectorAll('.backup-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectBackup(item.dataset.backup);
            });
        });

        document.getElementById('execute-restore')?.addEventListener('click', () => {
            this.executeRestore();
        });

        document.getElementById('skip-backup')?.addEventListener('click', () => {
            this.skipBackup();
        });
    }

    selectBackup(backupId) {
        this.selectedBackup = backupId;
        this.room.render();
    }

    executeRestore() {
        if (!this.selectedBackup) return;

        const backup = this.room.data.available_backups.find(b => b.id === this.selectedBackup);
        
        // Show restore progress
        this.showRestoreProgress(backup);
        
        // Simulate restore process
        setTimeout(() => {
            // Apply backup effects
            this.room.dataIntegrity = Math.max(this.room.dataIntegrity, backup.integrity);
            
            // Restore some tables based on backup quality
            const tablesToRestore = Math.floor((backup.integrity / 100) * 4);
            let restored = 0;
            
            Object.keys(this.room.tablesStatus).forEach(table => {
                if (restored < tablesToRestore && this.room.tablesStatus[table] === 'corrupted') {
                    this.room.tablesStatus[table] = 'recovered';
                    this.room.recoveredTables++;
                    this.room.corruptedTables--;
                    restored++;
                }
            });
            
            // Proceed to repair phase
            this.room.proceedToRepair();
        }, 3000);
    }

    skipBackup() {
        this.room.showMessage('Backup restore skipped. Proceeding to manual repair...', 'info');
        this.room.proceedToRepair();
    }

    showRestoreProgress(backup) {
        const content = document.querySelector('.step-content');
        content.innerHTML = `
            <div class="restore-progress text-center p-8">
                <i class="bi bi-download text-6xl text-blue-400 mb-4 animate-pulse"></i>
                <h3 class="text-2xl font-bold text-blue-400 mb-4">RESTORING BACKUP</h3>
                <div class="progress-info mb-4">
                    <p class="text-gray-300">Restoring: <span class="text-white font-mono">${backup.filename}</span></p>
                    <p class="text-gray-300">Expected Recovery: <span class="text-green-400 font-mono">${backup.integrity}%</span></p>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-4 mb-4">
                    <div class="bg-blue-600 h-4 rounded-full animate-pulse" style="width: 75%"></div>
                </div>
                <p class="text-blue-300">Validating data integrity...</p>
            </div>
        `;
    }

    getIntegrityColor(integrity) {
        if (integrity >= 80) return 'green-500';
        if (integrity >= 60) return 'yellow-500';
        return 'red-500';
    }

    getIntegrityTextColor(integrity) {
        if (integrity >= 80) return 'text-green-400';
        if (integrity >= 60) return 'text-yellow-400';
        return 'text-red-400';
    }

    getBackupRisk(backup) {
        if (backup.integrity >= 80) return 'LOW';
        if (backup.integrity >= 60) return 'MEDIUM';
        return 'HIGH';
    }

    getDowntimeEstimate(backup) {
        const size = parseFloat(backup.size.replace('GB', ''));
        return `${Math.round(size * 1.5)} minutes`;
    }

    getRecommendation(backup) {
        if (backup.integrity >= 90) return 'RECOMMENDED';
        if (backup.integrity >= 70) return 'ACCEPTABLE';
        return 'NOT RECOMMENDED';
    }

    getBusinessImpact(backup) {
        if (backup.integrity >= 85) return 'MINIMAL';
        if (backup.integrity >= 70) return 'MODERATE';
        return 'SEVERE';
    }
}
