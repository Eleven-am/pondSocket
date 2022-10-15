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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = exports.ContextManager = void 0;
var base_1 = require("../../base");
var emitters_1 = require("../emitters");
var ContextManager = /** @class */ (function () {
    function ContextManager(initialData) {
        this._database = new base_1.SimpleBase();
        this._name = Math.random().toString(36).substring(2, 15);
        this._managers = new base_1.SimpleBase();
        this._initialValue = initialData;
    }
    ContextManager.prototype.mount = function (socket, componentId) {
        return __awaiter(this, void 0, void 0, function () {
            var manager, doc, sub, ids;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        manager = this._managers.get(componentId);
                        if (manager === null)
                            return [2 /*return*/];
                        doc = this._database.getOrCreate(socket.clientId, function () {
                            return {
                                clientId: socket.clientId,
                                componentIds: [componentId],
                                data: _this._initialValue,
                                timer: null
                            };
                        });
                        sub = this._generateUnSubscribe(socket, componentId);
                        socket.addSubscription(sub);
                        ids = __spreadArray([], __read(doc.doc.componentIds), false).filter(function (id) { return id !== componentId; });
                        ids.push(componentId);
                        doc.updateDoc({
                            clientId: doc.doc.clientId,
                            componentIds: ids,
                            data: doc.doc.data,
                        });
                        return [4 /*yield*/, this._broadcastToComponentId(socket.clientId, componentId, doc.doc.data)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ContextManager.prototype.subscribe = function (manager) {
        var _this = this;
        var _a;
        var liveSocket = new emitters_1.LiveSocket('context', manager, function () { });
        var router = {};
        var verify = {
            contextId: this._name,
            data: this._initialValue,
            listensFor: []
        };
        (_a = manager.component.onContextChange) === null || _a === void 0 ? void 0 : _a.call({}, verify, liveSocket, router);
        if (verify.listensFor.some(function (id) { return id === _this._name; }))
            this._managers.set(manager.componentId, manager);
    };
    ContextManager.prototype.assign = function (socket, assigns) {
        return __awaiter(this, void 0, void 0, function () {
            var db, newDoc_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = this._getDoc(socket.clientId);
                        if (!db) return [3 /*break*/, 2];
                        newDoc_1 = Object.assign(__assign({}, db.doc.data), assigns);
                        db.updateDoc(__assign(__assign({}, db.doc), { data: newDoc_1 }));
                        return [4 /*yield*/, Promise.all(db.doc.componentIds.map(function (id) { return _this._broadcastToComponentId(socket.clientId, id, newDoc_1); }))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    ContextManager.prototype.get = function (socket) {
        var db = this._getDoc(socket.clientId);
        if (db)
            return Object.freeze(__assign({}, db.doc.data));
        return this._initialValue;
    };
    ContextManager.prototype.handleContextChange = function (context, handler) {
        if (context.listensFor)
            context.listensFor.push(this._name);
        else if (context.contextId === this._name)
            handler(context.data);
    };
    ContextManager.prototype._generateUnSubscribe = function (socket, componentId) {
        var _this = this;
        return {
            unsubscribe: function () {
                var doc = _this._getDoc(socket.clientId);
                if (doc) {
                    var ids = __spreadArray([], __read(doc.doc.componentIds), false).filter(function (id) { return id !== componentId; });
                    if (ids.length === 0)
                        doc.removeDoc();
                    else {
                        doc.updateDoc(__assign(__assign({}, doc.doc), { componentIds: ids }));
                    }
                }
            }
        };
    };
    ContextManager.prototype._broadcastToComponentId = function (clientId, componentId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var manager, peakData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        manager = this._managers.get(componentId);
                        if (!manager) return [3 /*break*/, 2];
                        peakData = {
                            contextId: this._name,
                            data: Object.freeze(__assign({}, data))
                        };
                        return [4 /*yield*/, manager.doc.handleContextChange(peakData, clientId)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    ContextManager.prototype._getDoc = function (clientId) {
        return this._database.get(clientId) || null;
    };
    return ContextManager;
}());
exports.ContextManager = ContextManager;
function createContext(initialData) {
    var contextManager = new ContextManager(initialData);
    return [
        {
            assign: contextManager.assign.bind(contextManager),
            get: contextManager.get.bind(contextManager),
            handleContextChange: contextManager.handleContextChange.bind(contextManager)
        },
        {
            subscribe: contextManager.subscribe.bind(contextManager),
            mount: contextManager.mount.bind(contextManager)
        }
    ];
}
exports.createContext = createContext;
