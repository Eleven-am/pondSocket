"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondServer = void 0;
var http_1 = require("http");
var middleware_1 = require("./middleware");
var server_1 = require("../../../server");
var genServer_1 = require("../genServer");
var static_1 = require("../helpers/static");
var verbHandler_1 = require("./verbHandler");
var PondServer = /** @class */ (function () {
    function PondServer(server) {
        this._server = server || new http_1.Server();
        this._pondSocket = new server_1.PondSocket(server);
        this._middleware = new middleware_1.Middleware(this._server);
    }
    /**
     * @desc Adds a new Pond middleware to the server
     * @param middleware - the middleware to add
     */
    PondServer.prototype.use = function (middleware) {
        this._middleware.use(middleware);
    };
    /**
     * @desc Adds a new middleware to the server
     * @param middleware - the middleware to add
     */
    PondServer.prototype.useRaw = function (middleware) {
        this._middleware.useRaw(middleware);
    };
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
    PondServer.prototype.upgrade = function (path, handler) {
        return this._pondSocket.createEndpoint(path, handler);
    };
    /**
     * @desc Starts the server
     * @param port - the port to start the server on
     * @param callback - the callback to run when the server is started
     */
    PondServer.prototype.listen = function (port, callback) {
        return this._server.listen(port, callback);
    };
    /**
     * @desc Creates a Live Server from the provided routes
     * @param routes - the routes to create the server from
     * @param options - the options to create the server with
     */
    PondServer.prototype.usePondLive = function (routes, options) {
        var pondLiveMiddleware = (0, genServer_1.GenerateLiveServer)(routes, this._server, {
            secret: options.secret,
            cookie: options.cookie,
            htmlPath: options.index,
            providers: options.providers
        }).pondLiveMiddleware;
        this.useRaw(pondLiveMiddleware);
    };
    /**
     * @desc Adds a new static file endpoint to the server
     * @param path - the path to serve the files from
     * @param options - the options to serve the files with
     */
    PondServer.prototype.useStatic = function (path, options) {
        var middleware = (0, static_1.staticMiddleware)(__assign(__assign({}, options), { root: path }));
        this.use(middleware);
    };
    /**
     * @desc Adds a new GET endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    PondServer.prototype.get = function (path, handler) {
        verbHandler_1.verbHandler.call(this._middleware, path, 'GET', handler);
    };
    /**
     * @desc Adds a new POST endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    PondServer.prototype.post = function (path, handler) {
        verbHandler_1.verbHandler.call(this._middleware, path, 'POST', handler);
    };
    /**
     * @desc Adds a new PUT endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    PondServer.prototype.put = function (path, handler) {
        verbHandler_1.verbHandler.call(this._middleware, path, 'PUT', handler);
    };
    /**
     * @desc Adds a new DELETE endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    PondServer.prototype.delete = function (path, handler) {
        verbHandler_1.verbHandler.call(this._middleware, path, 'DELETE', handler);
    };
    /**
     * @desc Adds a new PATCH endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    PondServer.prototype.patch = function (path, handler) {
        verbHandler_1.verbHandler.call(this._middleware, path, 'PATCH', handler);
    };
    /**
     * @desc Adds a new HEAD endpoint to the server
     * @param path - the pattern to accept || can also be a regex
     * @param handler - the handler function to handle the request
     */
    PondServer.prototype.head = function (path, handler) {
        verbHandler_1.verbHandler.call(this._middleware, path, 'HEAD', handler);
    };
    /**
     * @desc Adds a CORS middleware to the server
     * @param options - the options to use for the CORS middleware
     */
    PondServer.prototype.useCors = function (options) {
        this.use(function (_, res, next) {
            res.applyCORS(options);
            next();
        });
    };
    return PondServer;
}());
exports.PondServer = PondServer;
