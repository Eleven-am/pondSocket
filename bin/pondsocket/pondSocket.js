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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondSocket = void 0;
var http_1 = require("http");
var ws_1 = require("ws");
var pondbase_1 = require("../pondbase");
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
     * @desc Rejects the client's connection
     * @param error - Reason for rejection
     */
    PondSocket._rejectClient = function (error) {
        var errorMessage = error.errorMessage, errorCode = error.errorCode, socket = error.data;
        socket.write("HTTP/1.1 ".concat(errorCode, " ").concat(errorMessage, "\r\n\r\n"));
        socket.destroy();
    };
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
        this._socketChain.use(function (req, socket, head, next) { return __awaiter(_this, void 0, void 0, function () {
            var address, dataEndpoint;
            return __generator(this, function (_a) {
                address = req.url || "";
                dataEndpoint = this.generateEventRequest(path, address);
                if (!dataEndpoint)
                    return [2 /*return*/, next()];
                endpoint.authoriseConnection(req, socket, head, dataEndpoint)
                    .catch(function (error) { return PondSocket._rejectClient(error); });
                return [2 /*return*/];
            });
        }); });
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
        }, 30000);
        server.on("close", function () { return clearInterval(interval); });
    };
    /**
     * @desc Initializes the server
     */
    PondSocket.prototype._init = function () {
        var _this = this;
        this._server.on("error", function (error) {
            throw new pondbase_1.PondError("Server error", 500, { error: error });
        });
        this._server.on("listening", function () {
            _this._pingClients(_this._socketServer);
        });
    };
    return PondSocket;
}(pondbase_1.BaseClass));
exports.PondSocket = PondSocket;
