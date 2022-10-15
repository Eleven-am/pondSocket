import {ComponentClass} from "./liveComponent";
import {LiveRouter, LiveSocket} from "../index";
import {ContextProvider, PeakData} from "../broadcasters";
import {PondChain} from "../server/helpers/chainLambda";
import {PondChannel, PondResponse} from "../../pondsocket";

export interface IComponentManagerProps {
    parentId: string;
    pond: PondChannel;
    chain: PondChain;
    secret: string;
    htmlPath?: string;
    providers: ContextProvider[];
}

export declare class ComponentManager {
    readonly componentId: string;
    readonly component: ComponentClass;

    constructor(path: string, component: ComponentClass, props: IComponentManagerProps);

    handleInfo(info: any, socket: LiveSocket<any>, router: LiveRouter, res: PondResponse): Promise<void>;

    handleContextChange(context: PeakData, clientId: string): Promise<void>;
}
