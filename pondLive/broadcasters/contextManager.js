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
exports.createContext = exports.ContextDistributor = void 0;
var pondBase_1 = require("../../pondBase");
var ContextDistributor = /** @class */ (function () {
    function ContextDistributor(initialValue) {
        this._initialValue = initialValue;
        this._managers = new Set();
        this._contextId = Math.random().toString(36).substring(2, 15);
        this._database = new pondBase_1.SimpleBase();
    }
    ContextDistributor.prototype.subscribe = function (componentId, component) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var liveSocket, router, verify;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        liveSocket = {};
                        router = {};
                        verify = {
                            contextId: this._contextId,
                            data: this._initialValue,
                            listensFor: []
                        };
                        return [4 /*yield*/, ((_a = component.onContextChange) === null || _a === void 0 ? void 0 : _a.call({}, verify, liveSocket, router))];
                    case 1:
                        _b.sent();
                        if (verify.listensFor.some(function (id) { return id === _this._contextId; }))
                            this._managers.add(componentId);
                        return [2 /*return*/, this._managers.has(componentId)];
                }
            });
        });
    };
    ContextDistributor.prototype.mountSocket = function (socket) {
        var _this = this;
        var doc = this._database.getOrCreate(socket.clientId, function () {
            return new pondBase_1.Subject(_this._initialValue);
        });
        var sub = doc.doc.subscribe(function (data) {
            var peakData = {
                contextId: _this._contextId,
                data: Object.freeze(__assign({}, data))
            };
            socket.onContextChange(peakData);
        });
        return this._generateUnSubscribe(socket, sub);
    };
    ContextDistributor.prototype.assign = function (socket, assigns) {
        var doc = this._database.get(socket.clientId);
        if (doc) {
            var newDoc = Object.assign(__assign({}, doc.doc.value), assigns);
            doc.doc.publish(newDoc);
        }
    };
    ContextDistributor.prototype.get = function (socket) {
        var doc = this._database.get(socket.clientId);
        if (doc)
            return Object.freeze(__assign({}, doc.doc.value));
        return Object.freeze(__assign({}, this._initialValue));
    };
    ContextDistributor.prototype.pullContext = function (socket) {
        var data = this.get(socket);
        var peakData = {
            contextId: this._contextId,
            data: data
        };
        return peakData;
    };
    ContextDistributor.prototype.handleContextChange = function (context, handler) {
        if (context.listensFor)
            context.listensFor.push(this._contextId);
        else if (context.contextId === this._contextId)
            handler(context.data);
    };
    ContextDistributor.prototype._generateUnSubscribe = function (socket, subscription) {
        var _this = this;
        return {
            unsubscribe: function () {
                subscription.unsubscribe();
                var doc = _this._database.get(socket.clientId);
                if (doc && doc.doc.observers.size === 0)
                    doc.removeDoc();
            }
        };
    };
    return ContextDistributor;
}());
exports.ContextDistributor = ContextDistributor;
function createContext(initialData) {
    var contextManager = new ContextDistributor(initialData);
    return [
        {
            assign: contextManager.assign.bind(contextManager),
            get: contextManager.get.bind(contextManager),
            handleContextChange: contextManager.handleContextChange.bind(contextManager)
        },
        {
            subscribe: contextManager.subscribe.bind(contextManager),
            pullContext: contextManager.pullContext.bind(contextManager),
            mountSocket: contextManager.mountSocket.bind(contextManager)
        }
    ];
}
exports.createContext = createContext;
