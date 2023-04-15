import { PondMessage, PondResponse } from '../abstracts/abstractResponse';
import { PondAssigns } from '../channel/channelEngine';

type AuxiliaryData = {
    error?: { message: string, code: number };
    message?: { event: string, payload: PondMessage };
}

export type PondConnectionResponseHandler = (assigns: PondAssigns, aux: AuxiliaryData) => void;

export class ConnectionResponse extends PondResponse {
    private _hasExecuted = false;

    private readonly _handler: PondConnectionResponseHandler;

    constructor (handler: PondConnectionResponseHandler) {
        super();
        this._handler = handler;
    }

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public accept (assigns?: PondAssigns) {
        if (this._hasExecuted) {
            throw new Error('EndpointResponse: Message has already been processed');
        }

        this._hasExecuted = true;
        this._handler(assigns || {}, {});
    }

    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     */
    public reject (message?: string, errorCode?: number) {
        if (this._hasExecuted) {
            throw new Error('EndpointResponse: Message has already been processed');
        }

        this._hasExecuted = true;
        this._handler({}, {
            error: {
                message: message || 'Message rejected',
                code: errorCode || 403,
            },
        });
    }

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    public send (event: string, payload: PondMessage, assigns?: PondAssigns) {
        if (this._hasExecuted) {
            throw new Error('EndpointResponse: Message has already been processed');
        }

        this._hasExecuted = true;
        this._handler(assigns || {}, {
            message: {
                event,
                payload,
            },
        });
    }

    /**
     * @desc Resolves the request as sent with no further action
     */
    public end (): void {
        throw new Error('EndpointResponse: Cannot end a connection response');
    }
}
