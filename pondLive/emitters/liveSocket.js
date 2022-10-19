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
exports.LiveSocket = void 0;
var liveRouter_1 = require("./liveRouter");
var pondBase_1 = require("../../pondBase");
var pondSocket_1 = require("../../pondSocket");
var LiveSocket = /** @class */ (function () {
    function LiveSocket(clientId, manager, remove) {
        this._liveContext = {};
        this.clientId = clientId;
        this._subscriptions = [];
        this._manager = manager;
        this._channel = null;
        this._isWebsocket = false;
        this._remove = remove;
        this._timer = null;
    }
    Object.defineProperty(LiveSocket.prototype, "isWebsocket", {
        /**
         * @desc The type of the live socket.
         */
        get: function () {
            return this._isWebsocket;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LiveSocket.prototype, "context", {
        /**
         * @desc The live context.
         */
        get: function () {
            this._clearTimer();
            var result = __assign({}, this._liveContext);
            return Object.freeze(result);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Assigns a value to the live context.
     * @param assign - The data to assign.
     */
    LiveSocket.prototype.assign = function (assign) {
        var _this = this;
        if (!this._isWebsocket) {
            this._clearTimer();
            this._liveContext = __assign(__assign({}, this._liveContext), assign);
            return;
        }
        this._reRender(function () {
            _this._liveContext = Object.assign(_this._liveContext, assign);
        });
    };
    /**
     * @desc Emits an event on the browser window.
     * @param event - The event name.
     * @param data - The data to emit.
     */
    LiveSocket.prototype.emit = function (event, data) {
        this._clearTimer();
        if (this._channel)
            this._channel.broadcast('emit', { event: event, data: data });
    };
    /**
     * @desc Destroys the live socket.
     */
    LiveSocket.prototype.destroy = function (force) {
        var _this = this;
        if (force === void 0) { force = false; }
        if (!force) {
            this._clearTimer();
            this._timer = setTimeout(function () {
                _this._subscriptions.forEach(function (s) { return s.subscription.unsubscribe(); });
                _this._subscriptions.length = 0;
                _this._remove();
            }, 5000);
        }
        else {
            this._subscriptions.forEach(function (s) { return s.subscription.unsubscribe(); });
            this._subscriptions.length = 0;
            this._remove();
        }
    };
    /**
     * @desc Creates a socket response object.
     */
    LiveSocket.prototype.createResponse = function () {
        this._clearTimer();
        var response = this._createPondResponse();
        var router = new liveRouter_1.LiveRouter(response);
        return { response: response, router: router };
    };
    /**
     * @desc Upgrades the live socket to a websocket.
     * @param channel - The websocket channel.
     */
    LiveSocket.prototype.upgradeToWebsocket = function (channel) {
        this._clearTimer();
        this._isWebsocket = true;
        this._channel = channel;
    };
    /**
     * @desc Handles a message from a Broadcast channel.
     * @param info - The message info.
     */
    LiveSocket.prototype.onMessage = function (info) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._reRender(function (component, router) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!router)
                                            return [2 /*return*/];
                                        return [4 /*yield*/, ((_a = component.onInfo) === null || _a === void 0 ? void 0 : _a.call(this._liveContext, info, this, router))];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @desc Handles the context change of a context manager.
     * @param context - The new context.
     */
    LiveSocket.prototype.onContextChange = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._reRender(function (component, router) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, ((_a = component.onContextChange) === null || _a === void 0 ? void 0 : _a.call(this._liveContext, context, this, router))];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @desc Subscribes to a context provider.
     * @param provider - The context provider.
     */
    LiveSocket.prototype.subscribeToContextManager = function (provider) {
        var data = provider.pullContext(this);
        var isPresent = this._subscriptions.some(function (s) { return s.contextType === 'CONTEXT_PROVIDER' && s.contextId === data.contextId; });
        if (isPresent)
            return;
        var subscription = provider.mountSocket(this);
        this._subscriptions.push({ subscription: subscription, contextType: 'CONTEXT_PROVIDER', contextId: data.contextId });
    };
    /**
     * @desc Subscribes to a broadcast channel.
     * @param channel - The broadcast channel to subscribe to.
     * @param contextId - The context id of the channel.
     */
    LiveSocket.prototype.subscribeToBroadcastChannel = function (channel, contextId) {
        var isPresent = this._subscriptions.some(function (s) { return s.contextType === 'BROADCAST_CHANNEL' && s.contextId === contextId; });
        if (isPresent)
            return;
        var subscription = channel.mountSocket(this);
        this._subscriptions.push({ subscription: subscription, contextType: 'BROADCAST_CHANNEL', contextId: contextId });
    };
    /**
     * @desc Handles the upload complete event from the file uploader.
     * @param uploadEvent - The upload event.
     */
    LiveSocket.prototype.onUpload = function (uploadEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._reRender(function (component, router) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                (_a = component.onUpload) === null || _a === void 0 ? void 0 : _a.call(this._liveContext, uploadEvent, this, router);
                                return [2 /*return*/];
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @desc Creates a socket response object.
     */
    LiveSocket.prototype._createPondResponse = function () {
        var _this = this;
        if (!this._channel)
            throw new pondBase_1.PondError("Cannot create a pond response without a websocket.", 500, "PondError");
        var assigns = {
            assigns: {}, presence: {}, channelData: {}
        };
        var resolver = function (data) {
            if (data.error)
                throw new pondBase_1.PondError(data.error.errorMessage, data.error.errorCode, 'PondError');
            else if (data.message && _this._channel)
                _this._channel.broadcast(data.message.event, data.message.payload);
            return;
        };
        return new pondSocket_1.PondResponse(this._channel, assigns, resolver);
    };
    /**
     * @desc Clears the timer.
     * @private
     */
    LiveSocket.prototype._clearTimer = function () {
        if (this._timer)
            clearTimeout(this._timer);
    };
    /**
     * @desc Re-renders the component.
     * @param callback - The callback to run before re-rendering.
     * @private
     */
    LiveSocket.prototype._reRender = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var response, router;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._clearTimer();
                        if (!this._isWebsocket)
                            return [2 /*return*/];
                        response = this._createPondResponse();
                        router = new liveRouter_1.LiveRouter(response);
                        return [4 /*yield*/, this._manager.manageSocketRender(this, router, response, function (component) {
                                callback(component, router);
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return LiveSocket;
}());
exports.LiveSocket = LiveSocket;
