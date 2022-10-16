/// <reference types="node" />
import {IncomingMessage} from "http";
import {Broadcast} from "../../../pondbase";
import {UploadMessage} from "./UploadMessage";
import {PondResponse} from "../helpers/pondResponse";

export interface UploadBusboyEvent {
    message: UploadMessage;
    event: string;
    componentId: string;
    clientId: string;
}

interface BusBoyManagerProps {
    broadcaster: Broadcast<UploadBusboyEvent, void>;
    event: string;
    componentId: string;
    clientId: string;
}

export declare type BusBoyManager = (req: IncomingMessage, res: PondResponse, props: BusBoyManagerProps) => void;
/**
 * @desc This function is used to handle the upload of files to the server.
 * @param req - The request object from the http server.
 * @param res - The response object from the http server.
 * @param props - The props for the busboy manager.
 */
export declare const busBoyManager: BusBoyManager;
export {};
