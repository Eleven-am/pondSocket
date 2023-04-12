import { createServer } from 'http';

// eslint-disable-next-line import/no-unresolved
import { Express } from 'express';

import { EndpointHandler, Endpoint } from '../endpoint/endpoint';
import { PondSocket as PondSocketServer } from '../server/pondSocket';
import { PondPath } from '../utils/matchPattern';


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
export const PondSocket = (app: Express): PondSocketExpressApp => {
    const server = createServer(app);
    const pondSocket = new PondSocketServer(server);

    app.upgrade = (path: PondPath, handler: EndpointHandler) => pondSocket.createEndpoint(path, handler);

    return app as PondSocketExpressApp;
};
