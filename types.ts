export interface Client {
    id: number;
    company: string;
    contactPerson: string;
    phone: string;
    email: string;
}

export interface FuelInfo {
    litres: number;
    percentage: number;
}

export interface DriverInfo {
    name: string;
    id: string;
}

export interface Unit {
    unit_id: number;
    number: string; // Vehicle registration or identifier
    model: string;
    last_data_update: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    ignition: boolean;
    speed: number;
    clientId: number; // Link to the client
    driver: string;
    driverPhone?: string;
    
    // New detailed fields
    can?: Record<string, any>;
    fuel?: FuelInfo;
    drivers?: DriverInfo[];
    supply_voltage?: number;
    relays?: Record<string, boolean>;
    io_din?: Record<string, boolean>;
    isMock?: boolean;
}

export interface Alarm {
    id: string;
    deviceId: number;
    timestamp: string;
    type: string;
    message: string;
    location: {
        lat: number;
        lng: number;
    };
}

export enum TicketStatus {
    OPEN = 'Open',
    IN_PROGRESS = 'In Progress',
    RESOLVED = 'Resolved',
    CLOSED = 'Closed'
}

export interface TicketHistoryItem {
    status: TicketStatus;
    timestamp: string;
    notes: string;
    author: string;
}

export interface Ticket {
    id: string;
    alarmId: string;
    deviceId: number;
    deviceName: string;
    status: TicketStatus;
    createdAt: string;
    summary: string;
    history: TicketHistoryItem[];
}

export interface HistoricalDataPoint {
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    speed: number;
    ignition: boolean;
}

export enum ReportType {
    MILEAGE = 'Mileage',
    WORKING_HOURS = 'Working Hours',
    ALARM_FREQUENCY = 'Alarm Frequency',
}

export interface Report {
    id: string;
    type: ReportType;
    generatedAt: string;
    dateRange: { from: string; to: string };
    deviceIds: number[];
    data: any;
}

export enum Role {
    OPERATOR = 'Operator',
    ADMINISTRATOR = 'Administrator',
}

export interface User {
    id: number;
    name: string;
    email: string;
    password?: string; // Should not be sent to client, but needed for mock login
    role: Role;
}

export interface AlarmSound {
    id: string;
    name: string;
    data: string;
}

export interface PredefinedNote {
    id: string;
    label: string;
    text: string;
}
