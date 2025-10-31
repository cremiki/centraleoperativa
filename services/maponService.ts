import { Unit, Alarm, HistoricalDataPoint, User, Role, Report, ReportType, Client } from '../types';
import { apiProxy } from './apiProxy';

// MOCK DATA
const mockUsers: User[] = [
    { id: 1, name: 'Dante Salvetti', email: 'dante.salvetti@piramislocator.com', password: 'Piramis2025@', role: Role.OPERATOR },
    { id: 2, name: 'Miki Cresci', email: 'miki.cresci@piramislocator.com', password: 'Piramis2025@', role: Role.ADMINISTRATOR },
];

const mockDrivers = ['Luigi Bianchi', 'Marco Neri', 'Paolo Blu', 'Sergio Leone', 'Anna Rossi', 'Carlo Verdi'];
const mockDriverPhones = ['+39 333 1234567', '+39 338 7654321', '+39 335 1122334', '+39 347 5566778', '+39 349 8899001', '+39 340 1212121'];

const formatDateTimeForMapon = (date: Date): string => {
    return date.toISOString().slice(0, 19) + "Z";
};

class MaponService {
    private users: User[];
    private reports: Report[];
    private unitsCache: Unit[] = [];
    
    constructor() {
        this.users = mockUsers;
        this.reports = [];
    }
    
    async login(email: string, password: string): Promise<User | null> {
        console.log(`Attempting login for email: ${email}`);
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();
        
        const user = this.users.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.password === cleanPassword);
        
        if (user) {
            console.log("Login successful for:", user.name);
            const { password, ...userWithoutPassword } = user;
            return Promise.resolve(userWithoutPassword);
        }
        console.log("Login failed");
        return Promise.resolve(null);
    }

    async getUnits(): Promise<Unit[]> {
        const maponApiUrl = `https://mapon.com/api/v1/unit/list.json?include=can,fuel,drivers,supply_voltage,relays,ignition,io_din`;

        try {
            // Fetch live data from Mapon and custom overrides from our KV store in parallel
            const [apiResponse, unitOverridesResponse] = await Promise.all([
                apiProxy.get(maponApiUrl),
                apiProxy.post({ action: 'get_unit_overrides' })
            ]);

            const unitOverrides = new Map<number, Partial<Unit>>(unitOverridesResponse.data || []);
            const clients = await this.getClients();

            if (apiResponse.data && Array.isArray(apiResponse.data.units)) {
                const liveUnits: Unit[] = apiResponse.data.units.map((apiUnit: any, index: number) => {
                    const client = clients[index % clients.length];
                    const lastUpdate = apiUnit.last_update ? new Date(apiUnit.last_update).toISOString() : new Date(0).toISOString();
                    const ignitionState = apiUnit.ignition?.state === 1 || false;
                    const driverIsReal = !!apiUnit.drivers?.[0]?.name;

                    const baseUnit: Unit = {
                        unit_id: apiUnit.unit_id,
                        number: apiUnit.number || apiUnit.label || `Veicolo ${apiUnit.unit_id}`,
                        model: apiUnit.vehicle_title || 'Modello sconosciuto',
                        last_data_update: lastUpdate,
                        location: {
                            lat: apiUnit.lat || 0,
                            lng: apiUnit.lng || 0,
                            address: `Lat: ${apiUnit.lat}, Lng: ${apiUnit.lng}`,
                        },
                        ignition: ignitionState,
                        speed: apiUnit.speed || 0,
                        clientId: client.id,
                        driver: apiUnit.drivers?.[0]?.name || mockDrivers[index % mockDrivers.length],
                        driverPhone: mockDriverPhones[index % mockDrivers.length],
                        can: apiUnit.can,
                        fuel: apiUnit.fuel,
                        drivers: apiUnit.drivers,
                        supply_voltage: apiUnit.supply_voltage,
                        relays: apiUnit.relays,
                        io_din: apiUnit.io_din,
                        isMock: !driverIsReal,
                    };
                    
                    const overrides = unitOverrides.get(baseUnit.unit_id);
                    return { ...baseUnit, ...overrides };
                });
                this.unitsCache = liveUnits;
                return liveUnits;
            }
            
            console.error('Proxy response is not in the expected Mapon format for units:', apiResponse);
            throw new Error('Received an unexpected data format for units.');

        } catch (error) {
            console.error('Error processing units from API Proxy:', error);
            throw error; 
        }
    }
    
    async updateUnit(unitData: Partial<Unit>): Promise<void> {
        if (!unitData.unit_id) {
            return Promise.reject(new Error("Unit ID is required to update a unit."));
        }
        await apiProxy.post({ action: 'save_unit_override', payload: unitData });
    }

    async getAlarms(from: Date, till: Date): Promise<Alarm[]> {
        const fromFormatted = formatDateTimeForMapon(from);
        const tillFormatted = formatDateTimeForMapon(till);
    
        // Include both address and location data in the API call.
        const maponApiUrl = `https://mapon.com/api/v1/alert/list.json?from=${fromFormatted}&till=${tillFormatted}&include=address,location`;
    
        try {
            const apiResponse = await apiProxy.get(maponApiUrl);
            
            // The API response for alerts is an object with a "data" property containing the array of alerts.
            if (apiResponse && Array.isArray(apiResponse.data)) {
                const alertsList: any[] = apiResponse.data;
    
                return alertsList.map((apiAlert: any) => {
                    // Combine the message and address for a more informative notification.
                    const messageParts = [];
                    if (apiAlert.msg) messageParts.push(apiAlert.msg.trim());
                    if (apiAlert.address) messageParts.push(apiAlert.address.trim());
                    const message = messageParts.join(' - ') || 'No message provided';
                    
                    return {
                        // A unique ID is generated from the unit ID and timestamp as the API doesn't provide one.
                        id: `${apiAlert.unit_id}-${apiAlert.time}`,
                        deviceId: apiAlert.unit_id,
                        timestamp: new Date(apiAlert.time).toISOString(), // Mapon 'time' field
                        type: apiAlert.alert_type || 'Unknown Type', // Mapon 'alert_type' field
                        message: message, // Combined message and address
                        location: {
                            // Provide fallback coordinates if location data is missing from the response.
                            lat: apiAlert.lat || 0,
                            lng: apiAlert.lng || 0
                        }
                    };
                });
            }
            
            console.warn('Received an unexpected data format for alarms, or no alarms found in window:', apiResponse);
            return [];
    
        } catch (error) {
            console.error('Error processing alarms from API Proxy:', error);
            throw error;
        }
    }
    
    getUsers(): Promise<User[]> {
        return Promise.resolve(this.users.map(u => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
        }));
    }

    updateUser(user: User): Promise<User> {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index > -1) {
            const existingPassword = this.users[index].password;
            this.users[index] = { ...this.users[index], ...user, password: user.password || existingPassword };
        } else {
            this.users.push({ ...user, id: user.id || Date.now(), password: user.password || "password" });
        }
        const { password, ...userWithoutPassword } = user;
        return Promise.resolve(userWithoutPassword);
    }

    deleteUser(userId: number): Promise<void> {
        this.users = this.users.filter(u => u.id !== userId);
        return Promise.resolve();
    }
    
    async getClients(): Promise<Client[]> {
        const response = await apiProxy.post({ action: 'get_clients' });
        return response.data || [];
    }
    
    async updateClient(client: Client): Promise<Client> {
       const response = await apiProxy.post({ action: 'save_client', payload: client });
       return response.data;
    }

    async deleteClient(clientId: number): Promise<void> {
        await apiProxy.post({ action: 'delete_client', payload: { id: clientId } });
    }
    
    getUnitHistory(unitId: number, from: Date, to: Date): Promise<HistoricalDataPoint[]> {
        return new Promise(resolve => {
            const history: HistoricalDataPoint[] = [];
            const startUnit = this.unitsCache.find(u => u.unit_id === unitId);
            if (!startUnit) return resolve([]);

            let { lat, lng } = startUnit.location;
            const totalMinutes = (to.getTime() - from.getTime()) / 60000;
            
            for (let i = 0; i < totalMinutes; i += 5) {
                const timestamp = new Date(from.getTime() + i * 60000).toISOString();
                const ignition = Math.random() > 0.2;
                const speed = ignition ? Math.floor(Math.random() * 90) + 10 : 0;
                if(ignition) {
                    lat += (Math.random() - 0.5) * 0.01;
                    lng += (Math.random() - 0.5) * 0.01;
                }
                history.push({ timestamp, location: { lat, lng }, speed, ignition });
            }
            resolve(history);
        });
    }

    getReports(): Promise<Report[]> {
        return Promise.resolve([...this.reports]);
    }

    generateReport(type: ReportType, dateRange: { from: string; to: string }, deviceIds: number[]): Promise<Report> {
         return new Promise(resolve => {
            let data: any;
            switch (type) {
                case ReportType.MILEAGE:
                    data = deviceIds.map(id => ({ deviceId: id, deviceName: this.unitsCache.find(u=>u.unit_id === id)?.number, mileage: Math.floor(Math.random() * 500) + 50 }));
                    break;
                case ReportType.WORKING_HOURS:
                    data = deviceIds.map(id => ({ deviceId: id, deviceName: this.unitsCache.find(u=>u.unit_id === id)?.number, hours: Math.floor(Math.random() * 40) + 10 }));
                    break;
                case ReportType.ALARM_FREQUENCY:
                    data = deviceIds.map(id => ({ deviceId: id, deviceName: this.unitsCache.find(u=>u.unit_id === id)?.number, sos: Math.floor(Math.random() * 3), speeding: Math.floor(Math.random() * 10) }));
                    break;
            }
            const newReport: Report = {
                id: `REPORT-${Date.now()}`,
                type,
                dateRange,
                deviceIds,
                generatedAt: new Date().toISOString(),
                data,
            };
            this.reports.unshift(newReport);
            resolve(newReport);
        });
    }
}

export const maponService = new MaponService();
