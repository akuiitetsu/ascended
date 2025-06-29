export class LevelGenerator {
    constructor(room) {
        this.room = room;
    }

    initializeLevel() {
        this.room.bugs = [];
        this.room.obstacles = [];
        this.room.powerUps = [];
        
        // Generate level layout
        switch(this.room.currentLevel) {
            case 1:
                this.generateBeginnerLevel();
                break;
            case 2:
                this.generateIntermediateLevel();
                break;
            case 3:
                this.generateAdvancedLevel();
                break;
        }
    }

    generateBeginnerLevel() {
        // Simple bugs scattered around
        this.room.bugs = [
            { x: 5, y: 2, type: 'syntax_error', health: 30, id: 1 },
            { x: 8, y: 4, type: 'type_error', health: 25, id: 2 },
            { x: 3, y: 6, type: 'syntax_error', health: 30, id: 3 }
        ];
        
        // Basic obstacles
        this.room.obstacles = [
            { x: 4, y: 3, type: 'wall' },
            { x: 6, y: 5, type: 'wall' },
            { x: 9, y: 2, type: 'wall' }
        ];
        
        // Power-ups
        this.room.powerUps = [
            { x: 10, y: 1, type: 'energy_boost', value: 20 },
            { x: 2, y: 4, type: 'health_pack', value: 25 }
        ];
    }

    generateIntermediateLevel() {
        this.room.bugs = [
            { x: 4, y: 1, type: 'logic_error', health: 40, id: 4 },
            { x: 7, y: 3, type: 'runtime_error', health: 50, id: 5 },
            { x: 2, y: 5, type: 'type_error', health: 25, id: 6 },
            { x: 9, y: 6, type: 'syntax_error', health: 30, id: 7 }
        ];
        
        this.room.obstacles = [
            { x: 3, y: 2, type: 'firewall' },
            { x: 5, y: 4, type: 'firewall' },
            { x: 8, y: 1, type: 'wall' },
            { x: 6, y: 6, type: 'wall' }
        ];
        
        this.room.powerUps = [
            { x: 10, y: 3, type: 'debug_tool', value: 30 },
            { x: 1, y: 2, type: 'energy_boost', value: 25 }
        ];
    }

    generateAdvancedLevel() {
        this.room.bugs = [
            { x: 3, y: 1, type: 'memory_leak', health: 60, id: 8 },
            { x: 6, y: 2, type: 'race_condition', health: 70, id: 9 },
            { x: 9, y: 4, type: 'buffer_overflow', health: 80, id: 10 },
            { x: 2, y: 6, type: 'logic_error', health: 40, id: 11 },
            { x: 8, y: 7, type: 'runtime_error', health: 50, id: 12 }
        ];
        
        this.room.obstacles = [
            { x: 4, y: 3, type: 'encrypted_wall' },
            { x: 7, y: 5, type: 'encrypted_wall' },
            { x: 5, y: 1, type: 'firewall' },
            { x: 10, y: 6, type: 'firewall' }
        ];
        
        this.room.powerUps = [
            { x: 11, y: 2, type: 'super_debug', value: 50 },
            { x: 1, y: 7, type: 'health_pack', value: 40 }
        ];
    }
}
