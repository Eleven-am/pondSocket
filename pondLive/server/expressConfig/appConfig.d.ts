import {Express} from 'express';
import {Endpoint, EndpointHandler} from "../../../pondSocket";
import {PondPath} from "../../../pondBase";
import {PondLiveServerOptions} from "./express";
import {Route} from "../../component";

export interface PondLiveExpressApp extends Express {
    /**
     * @desc Creates an entry point for the pond live components
     * @param routes - The routes and components to be used by the server
     * @param options - The options to be used by the server
     *
     * @example
     * server.usePondLive({
     *     path: '/index',
     *     Component: Index
     * }, {
     *     path: '/',
     *     Component: App
     * }, {
     *     staticPath: '/home/pondLive/public'
     *     secret: 'test'
     * });
     */
    usePondLive(routes: Route[], options: PondLiveServerOptions): void;

    /**
     * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     *
     * @example
     * const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
     *    const { query } = parse(req.url || '');
     *    const { token } = query;
     *    if (!token)
     *       return res.reject("No token provided");
     *    res.accept({
     *       assign: {
     *           token
     *       }
     *    });
     * })
     */
    upgrade(path: PondPath, handler: EndpointHandler): Endpoint;
}

/**
 * @desc Creates a pond live server
 * @param app - The Express app to be used by the server
 * @constructor
 */
export declare const PondLive: (app: Express) => PondLiveExpressApp;
