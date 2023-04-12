import { SocketCache } from './pondChannel';
import { PondMessage, PondResponse } from '../abstracts/abstractResponse';
import { ChannelEngine, PondAssigns } from '../channel/channelEngine';
import { PondPresence } from '../presence/presenceEngine';

export class JoinResponse extends PondResponse {
    private _hasExecuted: boolean;

    private readonly _user: SocketCache;

    private readonly _engine: ChannelEngine;

    constructor (user: SocketCache, engine: ChannelEngine) {
        super();
        this._user = user;
        this._engine = engine;
        this._hasExecuted = false;
    }

    public get responseSent (): boolean {
        return this._hasExecuted;
    }

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public accept (assigns?: PondAssigns): JoinResponse {
        this._hasExecuted = true;
        assigns = { ...assigns,
            ...this._user.assigns };
        this._engine.addUser(this._user.clientId, assigns!, (event) => {
            this._user.socket.send(JSON.stringify(event));
        });

        return this;
    }

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param message - the error message
     * @param errorCode - the error code
     */
    public reject (message?: string, errorCode?: number): JoinResponse {
        this._hasExecuted = true;
        const text = `Request to join channel ${this._engine.name} rejected: ${message || 'Unauthorized request'}`;

        this._user.socket.send(JSON.stringify({
            event: 'POND_ERROR',
            payload: { message: text,
                code: errorCode || 403 },
            channelName: this._engine.name,
        }));

        return this;
    }

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    public send (event: string, payload: PondMessage, assigns?: PondAssigns) {
        this.accept(assigns);
        this._engine.sendMessage('channel', [this._user.clientId], event, payload);

        return this;
    }

    /**
     * @desc Emits a message to all clients in the channel
     * @param event - the event name
     * @param payload - the payload to send
     */
    public broadcast (event: string, payload: PondMessage): JoinResponse {
        this._engine.sendMessage(this._user.clientId, 'all_users', event, payload);

        return this;
    }

    /**
     * @desc Emits a message to all clients in the channel except the sender
     * @param event - the event name
     * @param payload - the payload to send
     */
    public broadcastFromUser (event: string, payload: PondMessage): JoinResponse {
        this._engine.sendMessage(this._user.clientId, 'all_except_sender', event, payload);

        return this;
    }

    /**
     * @desc Emits a message to a specific set of clients
     * @param event - the event name
     * @param payload  - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    public sendToUsers (event: string, payload: PondMessage, userIds: string[]): JoinResponse {
        this._engine.sendMessage(this._user.clientId, userIds, event, payload);

        return this;
    }

    /**
     * @desc tracks the presence of a client
     * @param presence - the presence data to track
     */
    public trackPresence (presence: PondPresence): JoinResponse {
        this._engine.trackPresence(this._user.clientId, presence);

        return this;
    }
}
