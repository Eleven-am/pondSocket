import {ResponsePicker} from "../pondBase";
import {PondMessage, SendResponse} from "./types";

export declare abstract class PondResponse<T extends ResponsePicker = ResponsePicker.CHANNEL> {
    /**
     * @desc Rejects the request with the given error message
     * @param message - the error message
     * @param errorCode - the error code
     */
    abstract reject(message?: string, errorCode?: number): void;

    /**
     * @desc Emits a direct message to the client
     * @param event - the event name
     * @param payload - the payload to send
     * @param assigns - the data to assign to the client
     */
    abstract send(event: string, payload: PondMessage, assigns?: Partial<SendResponse<T>>): void;

    /**
     * @desc Accepts the request and optionally assigns data to the client
     * @param assigns - the data to assign to the client
     */
    abstract accept(assigns?: Partial<SendResponse<T>>): void;
}
