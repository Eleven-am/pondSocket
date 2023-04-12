
export enum PresenceEventTypes {
    JOIN = 'JOIN',
    LEAVE = 'LEAVE',
    UPDATE = 'UPDATE'
}

export enum ServerActions {
    PRESENCE = 'PRESENCE',
    SYSTEM = 'SYSTEM',
    BROADCAST = 'BROADCAST',
    ERROR = 'ERROR',
}

export enum ClientActions {
    JOIN_CHANNEL = 'JOIN_CHANNEL',
    LEAVE_CHANNEL = 'LEAVE_CHANNEL',
    BROADCAST = 'BROADCAST',
}
