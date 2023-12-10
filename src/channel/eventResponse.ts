import { ChannelEngine, BroadcastEvent } from './channel';
import { PondResponse } from '../abstracts/abstractResponse';
import { SystemSender, ServerActions, ErrorTypes, ChannelReceiver } from '../enums';
import { ChannelError } from '../errors/pondError';
import type { PondAssigns, PondMessage, PondPresence } from '../types';

export class EventResponse extends PondResponse {
    readonly #event: BroadcastEvent;

    readonly #engine: ChannelEngine;

    #executed: boolean;

    constructor (event: BroadcastEvent, engine: ChannelEngine) {
        super();
        this.#event = event;
        this.#engine = engine;
        this.#executed = false;
    }

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public accept (assigns?: PondAssigns): EventResponse {
        this.#manageAssigns(assigns);
        this.#engine.sendMessage(this.#event.sender, this.#event.recipients, this.#event.action, this.#event.event, this.#event.payload);

        return this;
    }

    /**
     * @desc Rejects the request and optionally assigns data to the client
     * @param message - the error message
     * @param errorCode - the error code
     * @param assigns - the data to assign to the client
     */
    public reject (message?: string, errorCode?: number, assigns?: PondAssigns): EventResponse {
        this.#manageAssigns(assigns);
        const text = message || 'Unauthorized request';

        this.#engine.sendMessage(SystemSender.CHANNEL, [this.#event.sender], ServerActions.ERROR, ErrorTypes.UNAUTHORIZED_BROADCAST, {
            message: text,
            code: errorCode || 403,
        });

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
        this.#engine.sendMessage(SystemSender.CHANNEL, [this.#event.sender], ServerActions.SYSTEM, event, payload);
    }

    /**
     * @desc Sends a message to all clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcast (event: string, payload: PondMessage): EventResponse {
        this.#engine.sendMessage(this.#event.sender, ChannelReceiver.ALL_USERS, ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Sends a message to all clients in the channel except the client making the request
     * @param event - the event to send
     * @param payload - the payload to send
     */
    public broadcastFromUser (event: string, payload: PondMessage): EventResponse {
        this.#engine.sendMessage(this.#event.sender, ChannelReceiver.ALL_EXCEPT_SENDER, ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Sends a message to a set of clients in the channel
     * @param event - the event to send
     * @param payload - the payload to send
     * @param userIds - the ids of the clients to send the message to
     */
    public sendToUsers (event: string, payload: PondMessage, userIds: string[]): EventResponse {
        this.#engine.sendMessage(this.#event.sender, userIds, ServerActions.BROADCAST, event, payload);

        return this;
    }

    /**
     * @desc Tracks a user's presence in the channel
     * @param presence - the initial presence data
     * @param userId - the id of the user to track
     */
    public trackPresence (presence: PondPresence, userId = this.#event.sender): EventResponse {
        this.#engine.presenceEngine.trackPresence(userId, presence);

        return this;
    }

    /**
     * @desc Updates a user's presence in the channel
     * @param presence - the updated presence data
     * @param userId - the id of the user to update
     */
    public updatePresence (presence: PondPresence, userId = this.#event.sender): EventResponse {
        this.#engine.presenceEngine.updatePresence(userId, presence);

        return this;
    }

    /**
     * @desc Removes a user's presence from the channel
     * @param userId - the id of the user to remove
     */
    public unTrackPresence (userId = this.#event.sender): EventResponse {
        this.#engine.presenceEngine.removePresence(userId);

        return this;
    }

    /**
     * @desc Evicts a user from the channel
     * @param reason - the reason for the eviction
     * @param userId - the id of the user to evict,
     */
    public evictUser (reason: string, userId = this.#event.sender): void {
        this.#engine.kickUser(userId, reason);
    }

    /**
     * @desc Closes the channel from the server side for all clients
     * @param reason - the reason for closing the channel
     */
    public closeChannel (reason: string): void {
        this.#engine.destroy(reason);
    }

    /**
     * @desc Gets the event that triggered the response
     * @param assigns - the data to assign to the client
     * @private
     */
    #manageAssigns (assigns?: PondAssigns): void {
        this.#performChecks();
        if (assigns) {
            this.#engine.updateAssigns(this.#event.sender, assigns);
        }
    }

    /**
     * @desc Performs checks to ensure the response has not been executed
     * @private
     */
    #performChecks (): void {
        if (this.#executed) {
            const message = 'Event response has already been executed';
            const code = 403;

            throw new ChannelError(message, code, this.#engine.name);
        }

        this.#executed = true;
    }
}
