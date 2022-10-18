import {ComponentClass} from "./liveComponent";
import {ContextProvider, PeakData} from "../broadcasters";
import {PondChannel, PondResponse} from "../../pondsocket";
import {Broadcast} from "../../pondbase";
import {LiveRouter, LiveSocket} from "../emitters";
import {Express} from "express";
import {UploadBusboyEvent} from "../server/upload/busboy";

export interface IComponentManagerProps {
    parentId: string;
    uploadPath: string;
    pond: PondChannel;
    chain: Express;
    secret: string;
    uploadPubSub: Broadcast<UploadBusboyEvent, void>;
    htmlPath?: string;
    providers: ContextProvider[];
}

export declare class ComponentManager {
    readonly componentId: string;
    readonly component: ComponentClass;

    constructor(path: string, component: ComponentClass, props: IComponentManagerProps);

    handleInfo(info: any, socket: LiveSocket<any>, router: LiveRouter, res: PondResponse): Promise<void>;

    handleContextChange(context: PeakData, liveSocket: LiveSocket<any>, router: LiveRouter, response: PondResponse): Promise<void>;
}
