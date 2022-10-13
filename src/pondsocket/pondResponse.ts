import { PondError, RejectPromise, ResponsePicker } from "../pondbase";
import { PondMessage, PondResponseAssigns, ResponseResolver, SendResponse } from "./types";

export class PondResponse<T extends ResponsePicker = ResponsePicker.CHANNEL> {
    private _executed: boolean;
    private readonly _data: any;
    private readonly _isChannel: boolean;
    private readonly _assigns: SendResponse<T>;
    private _message: { event: string, payload: PondMessage } | undefined;
    private _error: Omit<RejectPromise<any>, 'data'> | undefined;
    private readonly resolver: (value: ResponseResolver<T>) => void;

    constructor(
        data: any, assigns: SendResponse<T>,
        resolver: (value: ResponseResolver<T>) => void,
        isChannel: boolean = true,
    ) {
        this._executed = false;
        this._data = data;
        this.resolver = resolver;
        this._assigns = assigns;
        this._isChannel = isChannel;
    }

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    public send(event: string, payload: PondMessage, assigns?: Partial<SendResponse<T>>) {
        this._message = {
            event: event,
            payload: payload,
        }

        return this._execute(assigns);
    }

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    public accept(assigns?: Partial<SendResponse<T>>) {
        return this._execute(assigns);
    }

    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     */
    public reject(message?: string, errorCode?: number) {
        message = message || (this._isChannel ? 'Message' : 'Connection') + ' rejected';
        errorCode = errorCode || 403;
        this._error = {
            errorMessage: message,
            errorCode: errorCode,
        }

        return this._execute({});
    }

    /**
     * @desc Executes the response callback
     * @param assigns - the data to assign to the client
     * @private
     */
    private _execute(assigns?: Partial<SendResponse<T>>) {
        if (!this._executed) {
            this._executed = true;
            const data: ResponseResolver<T> = {
                assigns: this._mergeAssigns(assigns),
                message: this._message,
                error: this._error,
            };
            this.resolver(data);

        } else
            throw new PondError('Response has already been sent', 500, this._data);
    }

    /**
     * @desc Merges the assigns with the default assigns
     * @param data - the data to merge
     * @private
     */
    private _mergeAssigns(data?: Partial<SendResponse<T>>) {
        if (data === undefined)
            return this._assigns;

        const otherAssigns = data as PondResponseAssigns;
        const newAssigns = this._assigns as PondResponseAssigns;
        const presence = {...newAssigns.presence, ...otherAssigns.presence};
        const channelData = {...newAssigns.channelData, ...otherAssigns.channelData};
        const assigns = {...newAssigns.assigns, ...otherAssigns.assigns};

        return {
            presence: presence,
            channelData: channelData,
            assigns: assigns,
        } as SendResponse<T>;
    }
}
