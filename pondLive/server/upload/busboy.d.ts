import {UploadMessage} from "./";
import {Broadcast} from "../../../pondBase";
import {Request, Response} from "express";

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

export declare type BusBoyManager = (req: Request, res: Response, props: BusBoyManagerProps) => void;
/**
 * @desc This function is used to handle the upload of files to the server.
 * @param req - The request object from the http server.
 * @param res - The response object from the http server.
 * @param props - The props for the busboy manager.
 */
export declare const busBoyManager: BusBoyManager;
export {};
