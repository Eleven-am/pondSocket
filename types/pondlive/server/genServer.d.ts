import { Server } from "http";
import { PondSocket } from "../../server";
import { ContextProvider } from "../broadcasters";
import { MiddleWareFunction } from "./helpers/chainLambda";
import { Authorizer } from "./helpers/authenticate";
import { Route } from "../component/liveComponent";
export interface ServerProps {
    secret?: string;
    cookie?: string;
    pondPath?: string;
    pondSocket?: PondSocket;
    htmlPath?: string;
    providers?: ContextProvider[];
    authenticator?: Authorizer;
}
export interface CsrfTokenObject {
    token: string;
    clientId: string;
    timestamp: number;
}
export interface GenerateLiveServerReturnType {
    pondSocket: PondSocket;
    pondLiveMiddleware: MiddleWareFunction;
}
/**
 * @desc Creates a pond live server
 * @param routes - The routes to be used by the server
 * @param server - The HTTP server to be used by the server
 * @param options - The options to be used by the server
 * @constructor
 */
export declare const GenerateLiveServer: (routes: Route[], server: Server, options?: ServerProps) => GenerateLiveServerReturnType;
