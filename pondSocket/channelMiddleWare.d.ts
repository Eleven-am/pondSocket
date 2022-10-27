import {PondAssigns, PondPresence} from "./types";
import {Channel} from "./channel";
import {PondResponse} from "./pondResponse";
import {default_t} from "../pondBase";

export declare type ChannelEvent = {
    client: {
        clientId: string;
        clientAssigns: PondAssigns;
        clientPresence: PondPresence;
    };
    channel: Channel;
    payload: default_t;
    event: string;
};

export declare type IncomingMiddlewareRequest = {
    channelName: string;
    event: string;
    message: default_t;
    client: {
        clientId: string;
        clientAssigns: PondAssigns;
        clientPresence: PondPresence;
    };
};

export declare type ChannelHandler = (req: IncomingMiddlewareRequest, res: PondResponse, channel: Channel) => void | Promise<void>;
