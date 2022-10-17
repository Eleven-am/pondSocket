"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentManager = void 0;
var index_1 = require("../index");
var index_2 = require("../index");
var fs = __importStar(require("fs"));
var path_1 = __importDefault(require("path"));
var pondsocket_1 = require("../../pondsocket");
var index_3 = require("../index");
var pondbase_1 = require("../../pondbase");
var UploadAuthoriseMessage_1 = require("../server/upload/UploadAuthoriseMessage");
var ComponentManager = /** @class */ (function () {
    function ComponentManager(path, component, props) {
        var _this = this;
        this._base = new pondbase_1.BaseClass();
        this._path = path.replace(/\/{2,}/g, '/');
        this._parentId = props.parentId;
        this.componentId = this._base.nanoId();
        this.component = component;
        this._pond = props.pond;
        this._chain = props.chain;
        this._sockets = new pondbase_1.SimpleBase();
        this._initialiseManager();
        this._setupUploadHandler(props.uploadPubSub);
        this._htmlPath = props.htmlPath;
        this._secret = props.secret;
        var contexts = __spreadArray(__spreadArray([], __read(component.providers), false), __read(props.providers), false);
        contexts.forEach(function (context) { return context.subscribe(_this); });
        this._providers = contexts;
        this._innerManagers = (component.routes || []).map(function (route) { return new ComponentManager("".concat(path).concat(route.path), new route.Component(), {
            parentId: _this.componentId,
            pond: _this._pond,
            chain: _this._chain,
            htmlPath: props.htmlPath,
            uploadPubSub: props.uploadPubSub,
            providers: contexts,
            secret: props.secret
        }); });
    }
    ComponentManager.prototype.handleInfo = function (info, socket, router, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var document;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        document = this._sockets.get(socket.clientId);
                        if (!document)
                            return [2 /*return*/, socket.destroy()];
                        return [4 /*yield*/, ((_a = this.component.onInfo) === null || _a === void 0 ? void 0 : _a.call(socket.context, info, socket, router))];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this._pushToClient(router, document, 'updated', res)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentManager.prototype._handleUpload = function (uploadMessage, clientId, event) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var document, _b, router, response, uploadEvent;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        document = this._sockets.get(clientId);
                        if (!document || !document.doc.socket.isWebsocket) {
                            uploadMessage.files.forEach(function (file) { return file.destroy(); });
                            throw new pondbase_1.PondError('Client not found', 404, clientId);
                        }
                        _b = document.doc.socket.createResponse(), router = _b.router, response = _b.response;
                        uploadEvent = {
                            type: event,
                            files: uploadMessage.files,
                        };
                        (_a = this.component.onUpload) === null || _a === void 0 ? void 0 : _a.call(document.doc.socket.context, uploadEvent, document.doc.socket, router);
                        return [4 /*yield*/, this._pushToClient(router, document, 'updated', response)];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentManager.prototype._handleUploadAuthorise = function (authorizer, clientId, event, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var router, document, socket, eventRequest;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.component.onUploadRequest || !this.component.onUpload) {
                            authorizer.sendError('Upload not supported');
                            return [2 /*return*/];
                        }
                        router = new index_2.LiveRouter(res);
                        document = this._sockets.get(clientId);
                        if (!document) {
                            authorizer.sendError('Client not found');
                            return [2 /*return*/];
                        }
                        socket = document.doc.socket;
                        eventRequest = {
                            type: event,
                            message: authorizer,
                        };
                        (_a = this.component.onUploadRequest) === null || _a === void 0 ? void 0 : _a.call(socket.context, eventRequest, socket, router);
                        return [4 /*yield*/, this._pushToClient(router, document, 'updated', res)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentManager.prototype.handleContextChange = function (context, liveSocket, router, response) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var document;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        document = this._sockets.get(liveSocket.clientId);
                        if (!document)
                            throw new pondbase_1.PondError('Client not found', 404, liveSocket.clientId);
                        return [4 /*yield*/, ((_a = this.component.onContextChange) === null || _a === void 0 ? void 0 : _a.call(document.doc.socket.context, context, document.doc.socket, router))];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this._pushToClient(router, document, 'updated', response)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentManager.prototype._render = function (data, clientId, router) {
        return __awaiter(this, void 0, void 0, function () {
            var document, socket, mountContext, peakData, innerHtml, _a, _b, manager, event_1, rendered_1, e_1_1, renderRoutes, rendered;
            var e_1, _c;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        document = this._sockets.getOrCreate(clientId, function (doc) {
                            return {
                                socket: new index_1.LiveSocket(clientId, _this, doc.removeDoc.bind(doc)), rendered: (0, index_3.html)(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""]))), timer: null,
                            };
                        });
                        socket = document.doc.socket;
                        mountContext = {
                            params: data.params, path: data.address, query: data.query
                        };
                        peakData = this._providers.map(function (context) { return context.mount(socket); });
                        if (!this.component.mount) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.component.mount(mountContext, socket, router)];
                    case 1:
                        _d.sent();
                        _d.label = 2;
                    case 2:
                        innerHtml = null;
                        _d.label = 3;
                    case 3:
                        _d.trys.push([3, 8, 9, 10]);
                        _a = __values(this._innerManagers), _b = _a.next();
                        _d.label = 4;
                    case 4:
                        if (!!_b.done) return [3 /*break*/, 7];
                        manager = _b.value;
                        event_1 = this._base.getLiveRequest(manager._path, data.address);
                        if (!event_1) return [3 /*break*/, 6];
                        return [4 /*yield*/, manager._render(event_1, clientId, router)];
                    case 5:
                        rendered_1 = _d.sent();
                        if (rendered_1) {
                            innerHtml = rendered_1;
                            return [3 /*break*/, 7];
                        }
                        _d.label = 6;
                    case 6:
                        _b = _a.next();
                        return [3 /*break*/, 4];
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 10];
                    case 9:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 10:
                        peakData.forEach(function (peakData) {
                            if (peakData)
                                socket.mountContext(peakData.get(), router);
                        });
                        if (router.sentResponse)
                            return [2 /*return*/, null];
                        renderRoutes = function () { return _this._createRouter((innerHtml === null || innerHtml === void 0 ? void 0 : innerHtml.rendered) || (0, index_3.html)(templateObject_2 || (templateObject_2 = __makeTemplateObject([""], [""]))), _this.componentId, (innerHtml === null || innerHtml === void 0 ? void 0 : innerHtml.path) || ''); };
                        return [4 /*yield*/, this._renderComponent(document, renderRoutes)];
                    case 11:
                        rendered = _d.sent();
                        return [2 /*return*/, {
                                path: this.componentId, rendered: rendered
                            }];
                }
            });
        });
    };
    ComponentManager.prototype._handleEvent = function (event, clientId, router, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._onEvent(clientId, router, res, 'updated', function (socket) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, ((_a = this.component.onEvent) === null || _a === void 0 ? void 0 : _a.call(socket.context, event, socket, router))];
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
    ComponentManager.prototype._handleRendered = function (clientId, router, res, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._onEvent(clientId, router, res, 'rendered', function (socket) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        socket.upgradeToWebsocket(channel);
                                        return [4 /*yield*/, ((_a = this.component.onRendered) === null || _a === void 0 ? void 0 : _a.call(socket.context, socket, router))];
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
    ComponentManager.prototype._handleUnmount = function (clientId) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var socket;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        socket = this._sockets.get(clientId);
                        if (!socket)
                            return [2 /*return*/];
                        return [4 /*yield*/, ((_a = this.component.onUnmount) === null || _a === void 0 ? void 0 : _a.call(socket.doc.socket.context, socket.doc.socket))];
                    case 1:
                        _b.sent();
                        socket.doc.socket.destroy();
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentManager.prototype._renderHtml = function (renderedHtml, headers) {
        var _this = this;
        return new Promise(function (resolve) {
            fs.readFile(_this._htmlPath || '', "utf8", function (err, data) {
                if (err)
                    return resolve("\n                            <!DOCTYPE html>\n                            <html lang=\"en\">\n                                <head>\n                                    <meta charset=\"UTF-8\">\n                                    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n                                    <title>".concat(headers.pageTitle || 'PondLive', "</title>\n                                </head>\n                                <body>\n                                    ").concat(renderedHtml.toString(), "\n                                    <script src=\"/pondLive.js\" defer=\"\"></script>\n                                </body>\n                            </html>"));
                resolve(data.replace(/<title>(.*?)<\/title>/, " <title>".concat(headers.pageTitle || 'PondLive', "</title>"))
                    .replace('<body>', "<body>\n                                    ".concat(renderedHtml.toString(), "\n                                    <script src=\"/pondLive.js\" defer=\"\"></script>\n                               ")));
            });
        });
    };
    ComponentManager.prototype._onEvent = function (clientId, router, res, responseEvent, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var document;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = this._sockets.get(clientId);
                        if (!document)
                            throw new pondbase_1.PondError('Client not found', 404, clientId);
                        return [4 /*yield*/, callback(document.doc.socket)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._pushToClient(router, document, responseEvent, res)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentManager.prototype._pushToClient = function (router, document, responseEvent, res) {
        return __awaiter(this, void 0, void 0, function () {
            var renderRoutes, previousRender, renderContext, htmlData, previous, difference;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (router.sentResponse)
                            return [2 /*return*/];
                        renderRoutes = function () { return _this._createRouter((0, index_3.html)(templateObject_3 || (templateObject_3 = __makeTemplateObject([""], [""]))), _this.componentId, 'BREAK'); };
                        previousRender = document.doc.rendered;
                        return [4 /*yield*/, this._renderComponent(document, renderRoutes)];
                    case 1:
                        renderContext = _a.sent();
                        htmlData = this._createRouter(renderContext, this._parentId, this.componentId);
                        if (responseEvent === 'updated') {
                            previous = this._createRouter(previousRender);
                            difference = previous.differentiate(htmlData);
                            if (this._base.isObjectEmpty(difference))
                                return [2 /*return*/];
                            res.send(responseEvent, { rendered: difference, path: this.componentId, headers: router.headers });
                        }
                        else {
                            res.send(responseEvent, {
                                rendered: htmlData.getParts(), path: this.componentId, headers: router.headers
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentManager.prototype._renderComponent = function (document, renderRoutes) {
        return __awaiter(this, void 0, void 0, function () {
            var renderContext, css, styleObject, rendered, finalHtml;
            return __generator(this, function (_a) {
                renderContext = renderRoutes;
                css = (0, index_3.CssGenerator)(this._parentId);
                styleObject = this.component.manageStyles ? this.component.manageStyles.call(document.doc.socket.context, css) : {
                    string: (0, index_3.html)(templateObject_4 || (templateObject_4 = __makeTemplateObject([""], [""]))), classes: {}
                };
                rendered = this.component.render.call(document.doc.socket.context, renderContext, styleObject.classes);
                finalHtml = (0, index_3.html)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", "", ""], ["", "", ""])), styleObject.string, rendered);
                document.updateDoc({
                    socket: document.doc.socket, rendered: finalHtml
                });
                return [2 /*return*/, finalHtml];
            });
        });
    };
    ComponentManager.prototype._initialiseHTTPManager = function () {
        var _this = this;
        this._chain.use(function (request, response, next) { return __awaiter(_this, void 0, void 0, function () {
            var extension, csrfToken, method, _a, clientId, token, eventRequest, resolver;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        extension = path_1.default.extname(request.url);
                        if (extension !== '')
                            return [2 /*return*/, next()];
                        csrfToken = request.getHeader('x-csrf-token');
                        method = request.method;
                        _a = request.data, clientId = _a.clientId, token = _a.token;
                        if (!(method === 'GET' && clientId && token)) return [3 /*break*/, 4];
                        eventRequest = this._base.getLiveRequest(this._path, request.url);
                        resolver = this._base.generateEventRequest(this._path, request.url);
                        if (!(resolver && csrfToken)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._handleCSRFRequest(resolver, csrfToken, clientId, response, next)];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        if (!(eventRequest && !csrfToken)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._handleInitialRequest(eventRequest, clientId, response, next)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4:
                        next();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    ComponentManager.prototype._initialiseSocketManager = function () {
        var _this = this;
        this._pond.on("mount/".concat(this.componentId), function (req, res, channel) { return __awaiter(_this, void 0, void 0, function () {
            var router, sub;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        router = new index_2.LiveRouter(res);
                        return [4 /*yield*/, this._handleRendered(req.client.clientAssigns.clientId, router, res, channel)];
                    case 1:
                        _a.sent();
                        sub = channel.subscribe(function (data) {
                            if ((data.action === pondsocket_1.ServerActions.PRESENCE && data.event === 'LEAVE_CHANNEL') || (data.event === "unmount/".concat(_this.componentId))) {
                                _this._handleUnmount(req.client.clientAssigns.clientId);
                                sub.unsubscribe();
                            }
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        this._pond.on("update/".concat(this.componentId), function (req, res, channel) { return __awaiter(_this, void 0, void 0, function () {
            var router, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        router = new index_2.LiveRouter(res);
                        return [4 /*yield*/, this._handleRendered(req.client.clientAssigns.clientId, router, res, channel)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        throw e_2;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this._pond.on("event/".concat(this.componentId), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var router, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        router = new index_2.LiveRouter(res);
                        return [4 /*yield*/, this._handleEvent(req.message, req.client.clientAssigns.clientId, router, res)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_3 = _a.sent();
                        throw e_3;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this._pond.on("unmount/".concat(this.componentId), function (req) { return __awaiter(_this, void 0, void 0, function () {
            var e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._handleUnmount(req.client.clientAssigns.clientId)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_4 = _a.sent();
                        throw e_4;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this._pond.on("".concat(this.componentId, "/upload/token"), function (req, res, channel) { return __awaiter(_this, void 0, void 0, function () {
            var files, identifier, authorizer;
            var _a;
            return __generator(this, function (_b) {
                if (req.message.files && req.message.files.length > 0 && ((_a = req.message.metadata) === null || _a === void 0 ? void 0 : _a.identifier) && req.message.type) {
                    files = req.message.files;
                    identifier = req.message.metadata.identifier;
                    authorizer = new UploadAuthoriseMessage_1.UploadAuthoriseMessage(files, identifier, req.client.clientAssigns.clientId, channel);
                    this._handleUploadAuthorise(authorizer, req.client.clientAssigns.clientId, req.message.type, res);
                }
                return [2 /*return*/];
            });
        }); });
    };
    ComponentManager.prototype._initialiseManager = function () {
        this._initialiseHTTPManager();
        this._initialiseSocketManager();
    };
    ComponentManager.prototype._setupUploadHandler = function (pubsub) {
        var _this = this;
        if (this.component.onUpload)
            pubsub.subscribe(function (data) {
                if (data.componentId === _this.componentId)
                    _this._handleUpload(data.message, data.clientId, data.event);
            });
    };
    ComponentManager.prototype._createRouter = function (innerRoute, parentId, componentId) {
        if (parentId === void 0) { parentId = this._parentId; }
        if (componentId === void 0) { componentId = this.componentId; }
        return (0, index_3.html)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n            <div id=\"", "\" pond-router=\"", "\">", "</div>"], ["\n            <div id=\"", "\" pond-router=\"", "\">", "</div>"])), parentId, componentId, innerRoute);
    };
    ComponentManager.prototype._handleInitialRequest = function (request, clientId, response, next) {
        return __awaiter(this, void 0, void 0, function () {
            var router, htmlData, headers, html_1, htmlString;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        router = new index_2.LiveRouter(response);
                        return [4 /*yield*/, this._render(request, clientId, router)];
                    case 1:
                        htmlData = _a.sent();
                        if (router.sentResponse)
                            return [2 /*return*/];
                        if (!htmlData) return [3 /*break*/, 3];
                        headers = router.headers;
                        html_1 = this._createRouter(htmlData.rendered);
                        return [4 /*yield*/, this._renderHtml(html_1, headers)];
                    case 2:
                        htmlString = _a.sent();
                        return [2 /*return*/, response.html(htmlString)];
                    case 3:
                        next();
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentManager.prototype._handleCSRFRequest = function (request, csrfToken, clientId, response, next) {
        return __awaiter(this, void 0, void 0, function () {
            var router, data, htmlData, headers, html_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        router = new index_2.LiveRouter(response);
                        data = this._base.decrypt(this._secret, csrfToken);
                        if (!data || data.clientId !== clientId) {
                            response.status(403, 'Invalid CSRF Token')
                                .json({
                                error: 'Invalid CSRF token'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this._render(request, clientId, router)];
                    case 1:
                        htmlData = _a.sent();
                        if (router.sentResponse)
                            return [2 /*return*/];
                        if (htmlData) {
                            headers = router.headers;
                            if (headers.pageTitle)
                                response.setHeader('x-page-title', headers.pageTitle);
                            if (headers.flashMessage)
                                response.setHeader('x-flash-message', headers.flashMessage);
                            response.setHeader('x-router-container', '#' + this._parentId);
                            html_2 = this._createRouter(htmlData.rendered);
                            return [2 /*return*/, response.html(html_2.toString())];
                        }
                        next();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ComponentManager;
}());
exports.ComponentManager = ComponentManager;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
