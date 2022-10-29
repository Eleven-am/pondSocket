"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondSocket = void 0;
var http_1 = require("http");
var ws_1 = require("ws");
var pondBase_1 = require("../pondBase");
var endpoint_1 = require("./endpoint");
var socketMiddleWare_1 = require("./socketMiddleWare");
var PondSocket = /** @class */ (function (_super) {
    __extends(PondSocket, _super);
    function PondSocket(server, socketServer) {
        var _this = _super.call(this) || this;
        _this._server = server || new http_1.Server();
        _this._socketServer = socketServer || new ws_1.WebSocketServer({ noServer: true });
        _this._socketChain = new socketMiddleWare_1.SocketMiddleWare(_this._server);
        _this._init();
        return _this;
    }
    /**
     * @desc Specifies the port to listen on
     * @param port - the port to listen on
     * @param callback - the callback to call when the server is listening
     */
    PondSocket.prototype.listen = function (port, callback) {
        return this._server.listen(port, callback);
    };
    /**
     * @desc adds a middleware to the server
     * @param middleware - the middleware to add
     */
    PondSocket.prototype.useOnUpgrade = function (middleware) {
        this._socketChain.use(middleware);
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
    PondSocket.prototype.createEndpoint = function (path, handler) {
        var _this = this;
        var endpoint = new endpoint_1.Endpoint(this._socketServer, handler);
        this._socketChain.use(function (req, socket, head, next) {
            var address = req.url || "";
            var dataEndpoint = _this.generateEventRequest(path, address);
            if (!dataEndpoint)
                return next();
            endpoint.authoriseConnection(req, socket, head, dataEndpoint);
        });
        return endpoint;
    };
    /**
     * @desc Makes sure that every client is still connected to the pond
     * @param server - WebSocket server
     */
    PondSocket.prototype._pingClients = function (server) {
        server.on("connection", function (ws) {
            ws.isAlive = true;
            ws.on("pong", function () {
                ws.isAlive = true;
            });
        });
        var interval = setInterval(function () {
            server.clients.forEach(function (ws) {
                if (ws.isAlive === false)
                    return ws.terminate();
                ws.isAlive = false;
                ws.ping();
            });
        }, 30 * 1000);
        server.on("close", function () { return clearInterval(interval); });
    };
    /**
     * @desc Initializes the server
     */
    PondSocket.prototype._init = function () {
        var _this = this;
        this._server.on("error", function (error) {
            throw new Error(error.message);
        });
        this._server.on("listening", function () {
            _this._pingClients(_this._socketServer);
        });
    };
    return PondSocket;
}(pondBase_1.BaseClass));
exports.PondSocket = PondSocket;
