/* eslint-disable import/no-unresolved */
import { Express } from 'express';

import { EndpointHandler, Endpoint, PondPath } from './types';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
interface PondSocketExpressApp extends Express {

    /**
     * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to authenticate the socket
     * @example
     * const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
     *    const token = req.query.token;
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
 * @desc Creates a pond socket server
 * @param app - The Express app to be used by the server
 * @constructor
 */
declare const PondSocket: (app: Express) => PondSocketExpressApp;

export default PondSocket;
