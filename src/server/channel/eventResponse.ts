import { ChannelEngine, InternalChannelEvent, PondAssigns, ServerActions } from './channelEngine';
import { ErrorTypes, SystemSender } from '../../enums';
import { PondMessage, PondResponse } from '../abstracts/abstractResponse';
import { PondPresence } from '../presence/presenceEngine';

export class EventResponse extends PondResponse {
    private readonly _event: InternalChannelEvent;

    private readonly _engine: ChannelEngine;

    private _hasExecuted = false;

    constructor (event: InternalChannelEvent, engine: ChannelEngine) {
        super();
        this._event = event;
        this._engine = engine;
    }

    /**
     * @desc Checks if the response has been sent
     */
    public get responseSent (): boolean {
        return this._hasExecuted;
    }

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public accept (assigns?: PondAssigns): EventResponse {
        this._manageAssigns(assigns);
        this._engine.sendMessage(this._event.sender, this._event.recipients, this._event.action, this._event.event, this._event.payload);
        this._hasExecuted = true;

        return this;
    }

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param message - the error message
     * @param errorCode - the error code
     * @param assigns - the data to assign to the client
     */
    public reject (message?: string, errorCode?: number, assigns?: PondAssigns): EventResponse {
        this._manageAssigns(assigns);
        const text = message || 'Unauthorized request';

        this._engine.sendMessage(SystemSender.CHANNEL, [this._event.sender], ServerActions.ERROR, ErrorTypes.UNAUTHORIZED_BROADCAST, {
            message: text,
            code: errorCode || 403,
        });

        this._hasExecuted = true;

        return this;
    }

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    public send (event: string, payload: PondMessage, assigns?: PondAssigns) {
        this._engine.sendMessage(SystemSender.CHANNEL, [this._event.sender], ServerActions.SYSTEM, event, payload);

        return this.accept(assigns);
    }

    /**
     * @desc Sends a message to all clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcast (event: string, payload: PondMessage): EventResponse {
        this._engine.sendMessage(this._event.sender, 'all_users', ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Sends a message to all clients in the channel except the client making the request
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcastFromUser (event: string, payload: PondMessage): EventResponse {
        this._engine.sendMessage(this._event.sender, 'all_except_sender', ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Sends a message to a set of clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    public sendToUsers (event: string, payload: PondMessage, userIds: string[]): EventResponse {
        this._engine.sendMessage(this._event.sender, userIds, ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Tracks a user's presence in the channel
     * @param presence - the initial presence data
     * @param userId - the id of the user to track
     */
    public trackPresence (presence: PondPresence, userId?: string): EventResponse {
        this._engine.trackPresence(userId || this._event.sender, presence);

        return this;
    }

    /**
     * @desc Updates a user's presence in the channel
     * @param presence - the updated presence data
     * @param userId - the id of the user to update
     */
    public updatePresence (presence: PondPresence, userId?: string): EventResponse {
        this._engine.updatePresence(userId || this._event.sender, presence);

        return this;
    }

    /**
     * @desc Removes a user's presence from the channel
     * @param userId - the id of the user to remove
     */
    public unTrackPresence (userId?: string): EventResponse {
        userId = userId || this._event.sender;
        try {
            this._engine.unTrackPresence(userId);
        } catch (e: any) {
            this._engine.sendMessage(SystemSender.CHANNEL, [userId], ServerActions.ERROR, ErrorTypes.PRESENCE_LEAVE_FAILED, {
                message: e.message,
                code: 500,
            });
        }

        return this;
    }

    /**
     * @desc Evicts a user from the channel
     * @param reason - the reason for the eviction
     * @param userId - the id of the user to evict,
     */
    public evictUser (reason: string, userId?: string): void {
        this._engine.kickUser(userId || this._event.sender, reason);
        this._hasExecuted = true;
    }

    /**
     * @desc Closes the channel from the server side for all clients
     * @param reason - the reason for closing the channel
     */
    public closeChannel (reason: string): void {
        this._engine.destroy(reason);
        this._hasExecuted = true;
    }

    /**
     * @desc Resolves the request as sent with no further action
     */
    public end (): void {
        this._hasExecuted = true;
    }

    /**
     * @desc Gets the event that triggered the response
     * @param assigns - the data to assign to the client
     * @private
     */
    private _manageAssigns (assigns?: PondAssigns): void {
        if (assigns) {
            this._engine.updateAssigns(this._event.sender, assigns);
        }
    }
}
