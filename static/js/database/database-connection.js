export class DatabaseConnection {
    constructor() {
        this.baseUrl = '/ascended_prototype/api/database.php';
        this.isConnected = false;
    }

    async connect() {
        try {
            const response = await fetch(`${this.baseUrl}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            this.isConnected = result.success;
            return result;
        } catch (error) {
            console.error('Database connection failed:', error);
            return {
                success: false,
                error: 'Connection failed: ' + error.message
            };
        }
    }

    async executeQuery(sql, params = []) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const response = await fetch(`${this.baseUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sql, params })
            });
            
            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: 'Query failed: ' + error.message
            };
        }
    }

    async getTableStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/table-status`, {
                method: 'GET'
            });
            
            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get table status: ' + error.message
            };
        }
    }

    async repairTable(tableName) {
        try {
            const response = await fetch(`${this.baseUrl}/repair-table`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tableName })
            });
            
            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: 'Table repair failed: ' + error.message
            };
        }
    }

    disconnect() {
        this.isConnected = false;
        console.log('Database disconnected');
    }
}
