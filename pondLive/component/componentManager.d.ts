import {ComponentClass} from "./liveComponent";
import {LiveRouter, LiveSocket} from "../emitters";
import {PondResponse} from "../../pondSocket";

export declare class ComponentManager {
    readonly componentId: string;
    readonly component: ComponentClass;

    manageSocketRender(socket: LiveSocket<any>, router: LiveRouter, response: PondResponse): Promise<void>;
}
