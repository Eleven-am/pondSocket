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
exports.createContext = exports.ContextDistributor = void 0;
var pondBase_1 = require("../../pondBase");
var emitters_1 = require("../emitters");
var ContextDistributor = /** @class */ (function () {
    function ContextDistributor(initialValue) {
        this._initialValue = initialValue;
        this._managers = new Set();
        this._contextId = Math.random().toString(36).substring(2, 15);
        this._database = new pondBase_1.SimpleBase();
    }
    ContextDistributor.prototype.subscribe = function (manager) {
        var _this = this;
        var _a;
        var liveSocket = new emitters_1.LiveSocket('context', manager, function () {
        });
        var router = {};
        var verify = {
            contextId: this._contextId,
            data: this._initialValue,
            listensFor: []
        };
        (_a = manager.component.onContextChange) === null || _a === void 0 ? void 0 : _a.call({}, verify, liveSocket, router);
        if (verify.listensFor.some(function (id) { return id === _this._contextId; }))
            this._managers.add(manager.componentId);
    };
    ContextDistributor.prototype.mount = function (socket) {
        var _this = this;
        if (!this._managers.has(socket.componentId))
            return null;
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
        var wrappedSub = this._generateUnSubscribe(socket, sub);
        socket.addSubscription(wrappedSub);
        return {
            get: function () {
                return {
                    contextId: _this._contextId,
                    data: _this.get(socket)
                };
            }
        };
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
            mount: contextManager.mount.bind(contextManager)
        }
    ];
}
exports.createContext = createContext;
