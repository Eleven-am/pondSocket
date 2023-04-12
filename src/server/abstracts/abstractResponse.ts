import { PondAssigns } from '../channel/channelEngine';

export type PondMessage = Record<string, any>;

export abstract class PondResponse {
    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     * @param assigns - the data to assign to the client
     */
    public abstract reject(message?: string, errorCode?: number, assigns?: PondAssigns): void

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    public abstract send(event: string, payload: PondMessage, assigns?: PondAssigns): void

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public abstract accept(assigns?: PondAssigns): void
}
