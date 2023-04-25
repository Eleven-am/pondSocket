import { PresenceEventTypes } from '../enums';

export class PondError {
    public message: string;

    public code: number;

    constructor (message: string, code: number) {
        this.code = code;
        this.message = message;
    }
}

export class EndpointError extends PondError {}

export class ChannelError extends EndpointError {
    public channel: string;

    constructor (message: string, code: number, channel: string) {
        super(message, code);
        this.channel = channel;
    }
}

export class PresenceError extends ChannelError {
    public event: PresenceEventTypes;

    constructor (message: string, code: number, channel: string, event: PresenceEventTypes) {
        super(message, code, channel);
        this.event = event;
    }
}
