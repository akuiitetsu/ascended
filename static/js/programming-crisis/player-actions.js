export class PlayerActions {
    constructor(room) {
        this.room = room;
    }

    executeMove(direction) {
        if (this.room.player.energy < 2) {
            return { success: false, message: 'Not enough energy to move!' };
        }
        
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        
        const delta = directions[direction];
        const newX = this.room.player.x + delta.x;
        const newY = this.room.player.y + delta.y;
        
        // Check bounds
        if (newX < 0 || newX >= this.room.gridManager.gridWidth || newY < 0 || newY >= this.room.gridManager.gridHeight) {
            return { success: false, message: 'Cannot move outside the grid!' };
        }
        
        // Check for obstacles
        const obstacle = this.room.obstacles.find(obs => obs.x === newX && obs.y === newY);
        if (obstacle) {
            return { success: false, message: `Cannot move through ${obstacle.type}!` };
        }
        
        // Check for bugs
        const bug = this.room.bugs.find(bug => bug.x === newX && bug.y === newY);
        if (bug) {
            return { success: false, message: 'Cannot move into a bug! Use attack() instead.' };
        }
        
        // Move player
        this.room.player.x = newX;
        this.room.player.y = newY;
        this.room.player.energy -= 2;
        
        // Check for power-ups
        const powerUpIndex = this.room.powerUps.findIndex(pu => pu.x === newX && pu.y === newY);
        if (powerUpIndex > -1) {
            const powerUp = this.room.powerUps[powerUpIndex];
            this.collectPowerUp(powerUp);
            this.room.powerUps.splice(powerUpIndex, 1);
        }
        
        return { success: true };
    }

    executeAttack(direction) {
        if (this.room.player.energy < 5) {
            return { success: false, message: 'Not enough energy to attack!' };
        }
        
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        
        const delta = directions[direction];
        const targetX = this.room.player.x + delta.x;
        const targetY = this.room.player.y + delta.y;
        
        // Find bug at target position
        const bugIndex = this.room.bugs.findIndex(bug => bug.x === targetX && bug.y === targetY);
        if (bugIndex === -1) {
            return { success: false, message: 'No bug found in that direction!' };
        }
        
        const bug = this.room.bugs[bugIndex];
        const damage = 25 + Math.floor(Math.random() * 15); // 25-40 damage
        
        bug.health -= damage;
        this.room.player.energy -= 5;
        
        this.room.showMessage(`Dealt ${damage} damage to ${bug.type}!`, 'success');
        
        if (bug.health <= 0) {
            this.room.bugs.splice(bugIndex, 1);
            this.room.bugsDefeated++;
            this.room.player.energy += 10; // Bonus energy for defeating bug
            this.room.showMessage(`${bug.type} defeated! +10 energy`, 'success');
        }
        
        return { success: true };
    }

    executeScan() {
        if (this.room.player.energy < 3) {
            return { success: false, message: 'Not enough energy to scan!' };
        }
        
        this.room.player.energy -= 3;
        
        // Show information about nearby objects
        let scanInfo = 'Scan results:\n';
        
        // Check adjacent cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = this.room.player.x + dx;
                const y = this.room.player.y + dy;
                
                if (x < 0 || x >= this.room.gridManager.gridWidth || y < 0 || y >= this.room.gridManager.gridHeight) continue;
                
                const bug = this.room.bugs.find(b => b.x === x && b.y === y);
                if (bug) {
                    scanInfo += `• Bug at (${x},${y}): ${bug.type} (${bug.health} HP)\n`;
                }
                
                const obstacle = this.room.obstacles.find(o => o.x === x && o.y === y);
                if (obstacle) {
                    scanInfo += `• Obstacle at (${x},${y}): ${obstacle.type}\n`;
                }
                
                const powerUp = this.room.powerUps.find(p => p.x === x && p.y === y);
                if (powerUp) {
                    scanInfo += `• Power-up at (${x},${y}): ${powerUp.type}\n`;
                }
            }
        }
        
        this.room.showMessage(scanInfo || 'No objects detected nearby.', 'info');
        return { success: true };
    }

    executeWait() {
        this.room.player.energy = Math.min(50, this.room.player.energy + 5);
        this.room.showMessage('Resting... +5 energy', 'info');
        return { success: true };
    }

    executeCollect() {
        const powerUp = this.room.powerUps.find(pu => pu.x === this.room.player.x && pu.y === this.room.player.y);
        if (!powerUp) {
            return { success: false, message: 'No items to collect at this position!' };
        }
        
        this.collectPowerUp(powerUp);
        const index = this.room.powerUps.indexOf(powerUp);
        this.room.powerUps.splice(index, 1);
        
        return { success: true };
    }

    executeUseItem(itemName) {
        const itemIndex = this.room.player.inventory.findIndex(item => item.type === itemName);
        if (itemIndex === -1) {
            return { success: false, message: `No ${itemName} in inventory!` };
        }
        
        const item = this.room.player.inventory[itemIndex];
        
        switch (item.type) {
            case 'health_pack':
                this.room.player.health = Math.min(100, this.room.player.health + item.value);
                this.room.showMessage(`Used ${item.type}! +${item.value} health`, 'success');
                break;
            case 'energy_boost':
                this.room.player.energy = Math.min(50, this.room.player.energy + item.value);
                this.room.showMessage(`Used ${item.type}! +${item.value} energy`, 'success');
                break;
            default:
                this.room.showMessage(`Used ${item.type}!`, 'success');
        }
        
        this.room.player.inventory.splice(itemIndex, 1);
        this.room.updateInventoryDisplay();
        
        return { success: true };
    }

    // New condition checking methods for advanced code execution
    checkBugNearby(direction) {
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        
        const delta = directions[direction];
        const targetX = this.room.player.x + delta.x;
        const targetY = this.room.player.y + delta.y;
        
        return this.room.bugs.some(bug => bug.x === targetX && bug.y === targetY);
    }

    checkCanMove(direction) {
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        
        const delta = directions[direction];
        const newX = this.room.player.x + delta.x;
        const newY = this.room.player.y + delta.y;
        
        // Check bounds
        if (newX < 0 || newX >= this.room.gridManager.gridWidth || newY < 0 || newY >= this.room.gridManager.gridHeight) {
            return false;
        }
        
        // Check for obstacles
        const obstacle = this.room.obstacles.find(obs => obs.x === newX && obs.y === newY);
        if (obstacle) return false;
        
        // Check for bugs
        const bug = this.room.bugs.find(bug => bug.x === newX && bug.y === newY);
        if (bug) return false;
        
        return true;
    }

    checkPowerUpNearby() {
        return this.room.powerUps.some(pu => 
            pu.x === this.room.player.x && pu.y === this.room.player.y
        );
    }

    checkHealthLow() {
        return this.room.player.health < 30;
    }

    checkEnergyLow() {
        return this.room.player.energy < 15;
    }

    checkHasItem(itemType) {
        return this.room.player.inventory.some(item => item.type === itemType);
    }

    getBugsRemaining() {
        return this.room.bugs.length;
    }

    getPlayerPosition() {
        return { x: this.room.player.x, y: this.room.player.y };
    }

    collectPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'health_pack':
                this.room.player.inventory.push({ type: 'health_pack', value: powerUp.value });
                this.room.showMessage(`Collected health pack (+${powerUp.value})`, 'success');
                break;
            case 'energy_boost':
                this.room.player.inventory.push({ type: 'energy_boost', value: powerUp.value });
                this.room.showMessage(`Collected energy boost (+${powerUp.value})`, 'success');
                break;
            default:
                this.room.player.inventory.push(powerUp);
                this.room.showMessage(`Collected ${powerUp.type}`, 'success');
        }
        
        this.room.updateInventoryDisplay();
    }
}
