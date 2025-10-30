import { Unit, Alarm, HistoricalDataPoint, User, Role, Report, ReportType, Client } from '../types';
import { apiProxy } from './apiProxy';

// MOCK DATA
const mockClients: Client[] = [
    { id: 101, company: 'Logistics Inc.', contactPerson: 'Mario Rossi', phone: '+39 02 1234567', email: 'mario.rossi@logistics.inc' },
    { id: 102, company: 'Transporti Veloci', contactPerson: 'Giulia Verdi', phone: '+39 06 7654321', email: 'giulia.verdi@transportiveloci.it' },
    { id: 103, company: 'Courier Express', contactPerson: 'Luca Gialli', phone: '+39 055 9876543', email: 'luca.gialli@courierexpress.com' },
    { id: 104, company: 'Alpine Haulers', contactPerson: 'Franco Moro', phone: '+39 011 4567890', email: 'franco.moro@alpinehaulers.com' }
];

const mockUsers: User[] = [
    { id: 1, name: 'Dante Salvetti', email: 'dante.salvetti@piramislocator.com', password: 'Piramis2025@', role: Role.OPERATOR },
    { id: 2, name: 'Miki Cresci', email: 'miki.cresci@piramislocator.com', password: 'Piramis2025@', role: Role.ADMINISTRATOR },
];

const mockDrivers = ['Luigi Bianchi', 'Marco Neri', 'Paolo Blu', 'Sergio Leone', 'Anna Rossi', 'Carlo Verdi'];
const mockDriverPhones = ['+39 333 1234567', '+39 338 7654321', '+39 335 1122334', '+39 347 5566778', '+39 349 8899001', '+39 340 1212121'];

const formatDateTimeForMapon = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

class MaponService {
    private users: User[];
    private clients: Client[];
    private reports: Report[];
    private unitsCache: Unit[] = [];

    constructor() {
        this.users = mockUsers;
        this.clients = mockClients;
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

    // The apiKey is no longer needed here. The backend proxy handles it.
    async getUnits(): Promise<Unit[]> {
        const maponApiUrl = `https://mapon.com/api/v1/unit/list.json?include=can,fuel,drivers,supply_voltage,relays,ignition,io_din`;

        try {
            // The call to apiProxy no longer needs the key.
            const apiResponse = await apiProxy.get(maponApiUrl);

            if (apiResponse.data && Array.isArray(apiResponse.data.units)) {
                const liveUnits: Unit[] = apiResponse.data.units.map((apiUnit: any, index: number) => {
                    const client = this.clients[index % this.clients.length];
                    const lastUpdate = apiUnit.last_update ? new Date(apiUnit.last_update).toISOString() : new Date(0).toISOString();
                    const ignitionState = apiUnit.ignition?.state === 1 || false;
                    const driverIsReal = !!apiUnit.drivers?.[0]?.name;

                    return {
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

    // The apiKey is no longer needed here. The backend proxy handles it.
    async getAlarms(from: Date, till: Date): Promise<Alarm[]> {
        const fromFormatted = formatDateTimeForMapon(from);
        const tillFormatted = formatDateTimeForMapon(till);

        const maponApiUrl = `https://mapon.com/api/v1/alert/list.json?from=${fromFormatted}&till=${tillFormatted}&include=address`;

        try {
            const apiResponse = await apiProxy.get(maponApiUrl);
            
            let allAlarmsInWindow: Alarm[] = [];

            if (apiResponse.data && typeof apiResponse.data.alerts === 'object' && apiResponse.data.alerts !== null) {
                const alertsData = apiResponse.data.alerts;
                const alertsList = Array.isArray(alertsData) ? alertsData : Object.values(alertsData);

                allAlarmsInWindow = alertsList.map((apiAlert: any) => ({
                    id: apiAlert.alert_id.toString(),
                    deviceId: apiAlert.unit_id,
                    timestamp: new Date(apiAlert.datetime).toISOString(),
                    type: apiAlert.type_name || 'Unknown Type',
                    message: apiAlert.address || 'No address provided',
                    location: {
                        lat: apiAlert.lat,
                        lng: apiAlert.lng
                    }
                }));
            }
            
            return allAlarmsInWindow;

        } catch (error) {
            console.error('Error processing alarms from API Proxy:', error);
            throw error;
        }
    }
    
    // USER MANAGEMENT (MOCK)
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
    
    // CLIENT MANAGEMENT (MOCK)
    getClients(): Promise<Client[]> {
        return Promise.resolve([...this.clients]);
    }
    
    updateClient(client: Client): Promise<Client> {
        const index = this.clients.findIndex(c => c.id === client.id);
        if (index > -1) {
            this.clients[index] = client;
        } else {
            this.clients.push({ ...client, id: client.id || Date.now() });
        }
        return Promise.resolve(client);
    }

    deleteClient(clientId: number): Promise<void> {
        this.clients = this.clients.filter(c => c.id !== clientId);
        return Promise.resolve();
    }
    
    // MOCK history, reports etc.
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
