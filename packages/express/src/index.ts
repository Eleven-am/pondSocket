import { createServer } from 'http';

import PondSocket from '@eleven-am/pondsocket';
import type { ConnectionResponse, Endpoint, PondPath, IncomingConnection } from '@eleven-am/pondsocket/types';
// eslint-disable-next-line import/no-unresolved
import { Express } from 'express';

interface Options {
    redisUrl?: string;
    db?: number;
}

// eslint-disable-next-line import/no-unresolved

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        export interface Application {
            upgrade<Path extends string>(path: PondPath<Path>, handler: (request: IncomingConnection<Path>, response: ConnectionResponse) => void | Promise<void>): Endpoint;
        }
    }
}

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
    upgrade<Path extends string>(path: PondPath<Path>, handler: (request: IncomingConnection<Path>, response: ConnectionResponse) => void | Promise<void>): Endpoint;
}

/**
 * @desc Creates a pond socket server
 * @param app - The Express app to be used by the server
 * @param redisUrl - The redis url to be used by the server
 * @param db - The db number to be used by the server
 * @constructor
 */
const pondSocket = (app: Express, { redisUrl, db }: Options = {}): PondSocketExpressApp => {
    const server = createServer(app);
    const pondSocket = new PondSocket({
        server,
        redisUrl,
        db,
    });

    app.upgrade = (path, handler) => pondSocket.createEndpoint(path, handler);
    app.listen = (...args: any[]) => pondSocket.listen(...args);

    return app as PondSocketExpressApp;
};

export default pondSocket;
