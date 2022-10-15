/// <reference types="node" />
import {Server} from "http";
import {MiddleWareFunction, PondMiddleware} from "../helpers/chainLambda";
import {EndpointHandler} from "../../../server";
import {PondPath} from "../../../pondbase";
import {ContextProvider} from "../../broadcasters";
import {Route} from "../../component/liveComponent";
import {StaticOptions} from "../helpers/static";
import {VerbRequest} from "./verbHandler";
import {CORSOptions} from "../helpers/pondResponse";

export interface PondLiveServerOptions {
    secret?: string;
    cookie?: string;
    index?: string;
    providers?: ContextProvider[];
}

export declare class PondServer {
    constructor(server?: Server);

    /**
     * @desc Adds a new Pond middleware to the server
     * @param middleware - the middleware to add
     */
    use(middleware: PondMiddleware): void;

    /**
     * @desc Adds a new middleware to the server
     * @param middleware - the middleware to add
     */
    useRaw(middleware: MiddleWareFunction): void;

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
    upgrade(path: PondPath, handler: EndpointHandler): import("../../../server").Endpoint;

    /**
     * @desc Starts the server
     * @param port - the port to start the server on
     * @param callback - the callback to run when the server is started
     */
    listen(port: number, callback: (port?: number) => void): Server;

    /**
     * @desc Creates a Live Server from the provided routes
     * @param routes - the routes to create the server from
     * @param options - the options to create the server with
     */
    usePondLive(routes: Route[], options: PondLiveServerOptions): void;

    /**
     * @desc Adds a new static file endpoint to the server
     * @param path - the path to serve the files from
     * @param options - the options to serve the files with
     */
    useStatic(path: string, options?: Omit<StaticOptions, 'root'>): void;

    /**
     * @desc Adds a new GET endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    get(path: string, handler: VerbRequest): void;

    /**
     * @desc Adds a new POST endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    post(path: string, handler: VerbRequest): void;

    /**
     * @desc Adds a new PUT endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    put(path: string, handler: VerbRequest): void;

    /**
     * @desc Adds a new DELETE endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    delete(path: string, handler: VerbRequest): void;

    /**
     * @desc Adds a new PATCH endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    patch(path: string, handler: VerbRequest): void;

    /**
     * @desc Adds a new HEAD endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    head(path: string, handler: VerbRequest): void;

    /**
     * @desc Adds a CORS middleware to the server
     * @param options - the options to use for the CORS middleware
     */
    useCors(options: CORSOptions): void;
}
