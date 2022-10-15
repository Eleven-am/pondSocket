"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var contextManager_1 = require("./contextManager");
var emitters_1 = require("../emitters");
var pondsocket_1 = require("../../pondsocket");
var createChannel = function () {
    var removeDoc = jest.fn();
    var channel = new pondsocket_1.Channel('TEST', removeDoc);
    return { channel: channel, removeDoc: removeDoc };
};
var createManager = function () {
    var channel = createChannel().channel;
    var component = {
        onContextChange: jest.fn(),
    };
    var manager = {
        component: component,
        handleContextChange: jest.fn(),
        componentId: '123'
    };
    var removeDoc = jest.fn();
    var socket = new emitters_1.LiveSocket('123', manager, removeDoc);
    socket.upgradeToWebsocket(channel);
    return { socket: socket, manager: manager, removeDoc: removeDoc };
};
describe('ContextManager', function () {
    it('should create a new context', function () {
        var contextManager = new contextManager_1.ContextDistributor({});
        expect(contextManager).toBeDefined();
    });
    it('should assign a component to a context', function () {
        // during initialization, the context manager will attempt to subscribe
        // component managers to itself
        var contextManager = new contextManager_1.ContextDistributor({});
        var secondManager = new contextManager_1.ContextDistributor({});
        expect(contextManager['_managers'].size).toBe(0);
        expect(secondManager['_managers'].size).toBe(0);
        var entered = jest.fn();
        var managerHandler = jest.fn();
        // it does this by relying on it's handleContextChange method
        // which sits at the other end of the component manager's handleContextChange method
        // inside the components onContextChange method
        var manager = createManager().manager;
        manager.component.onContextChange = function (data) {
            entered();
            contextManager.handleContextChange(data, managerHandler);
        };
        // the component manager will then call the context manager's subscribe method
        // which will add the component manager to the context manager's list of managers
        contextManager.subscribe(manager);
        secondManager.subscribe(manager);
        expect(contextManager['_managers'].size).toBe(1);
        // For efficiency, the context manager will only add the component manager
        // to it's list of managers if the component manager is listening for the context
        // this is determined by the context manager's handleContextChange method
        // which is called by the component manager's handleContextChange method
        // during the subscribe process
        expect(entered).toHaveBeenCalled();
        expect(managerHandler).not.toHaveBeenCalled();
        // The second context would not accept the component manager
        // because the component manager is not listening for the second context
        expect(secondManager['_managers'].size).toBe(0);
    });
    it('should mount a socket to a context if the component is listening for the context', function () {
        var contextManager = new contextManager_1.ContextDistributor({});
        var _a = createManager(), socket = _a.socket, manager = _a.manager;
        var handler = jest.fn();
        manager.handleContextChange = handler;
        manager.component.onContextChange = function (data) {
            contextManager.handleContextChange(data, function () { });
        };
        contextManager.subscribe(manager);
        expect(handler).not.toHaveBeenCalled();
        // Once the component manager is subscribed to the context manager
        // When a socket is mounted to the component manager,
        // The context manager will mount the socket to the context
        contextManager.mount(socket);
        expect(contextManager['_database'].size).toBe(1);
        // The context manager will then call the component manager's handleContextChange method
        // with the initial context data
        expect(handler).toHaveBeenCalled();
    });
    it('should not mount a socket to a context if the component is not listening for the context', function () {
        var contextManager = new contextManager_1.ContextDistributor({});
        var contextManager2 = new contextManager_1.ContextDistributor({});
        var _a = createManager(), socket = _a.socket, manager = _a.manager;
        var handler = jest.fn();
        manager.component.onContextChange = function (data) {
            contextManager.handleContextChange(data, handler);
        };
        // The component manager is not subscribed to the context manager
        // so the context manager will not mount the socket to the context
        contextManager.mount(socket);
        expect(contextManager2['_database'].size).toBe(0);
        // The context manager will not call the component manager's handleContextChange method
        expect(handler).not.toHaveBeenCalled();
        // When a socket is destroyed, the context manager will remove the socket from the context
        socket.destroy();
        expect(contextManager2['_database'].size).toBe(0);
    });
    it('should assign data to the context', function () {
        var contextManager = new contextManager_1.ContextDistributor({});
        var _a = createManager(), socket = _a.socket, manager = _a.manager;
        var handler = jest.fn();
        manager.component.onContextChange = function (data) {
            contextManager.handleContextChange(data, handler);
        };
        manager.handleContextChange = function (data) {
            manager.component.onContextChange(data);
        };
        contextManager.subscribe(manager);
        contextManager.mount(socket);
        expect(handler).toHaveBeenCalled(); // initial data is used for initial context
        handler.mockClear();
        // The context manager will call the component manager's handleContextChange method
        // with the new context data
        contextManager.assign(socket, { test: 'test' });
        expect(handler).toHaveBeenCalledWith({ test: 'test' });
    });
    it('should return the current context data', function () {
        var contextManager = new contextManager_1.ContextDistributor({});
        var _a = createManager(), socket = _a.socket, manager = _a.manager;
        manager.component.onContextChange = function (data) {
            contextManager.handleContextChange(data, function () { });
        };
        manager.handleContextChange = function (data) {
            manager.component.onContextChange(data);
        };
        contextManager.subscribe(manager);
        contextManager.mount(socket);
        expect(contextManager.get(socket)).toEqual({});
        contextManager.assign(socket, { test: 'test' });
        expect(contextManager.get(socket)).toEqual({ test: 'test' });
    });
    it('should remove a socket from the context', function () {
        var _a, _b;
        var contextManager = new contextManager_1.ContextDistributor({});
        var _c = createManager(), socket = _c.socket, manager = _c.manager;
        var _d = createManager(), manager2 = _d.manager, socket2 = _d.socket;
        var handler = jest.fn();
        manager2.componentId = '456'; // assign a different id to the second manager
        manager.component.onContextChange = function (data) {
            contextManager.handleContextChange(data, handler);
        };
        manager.handleContextChange = function (data) {
            manager.component.onContextChange(data);
        };
        manager2.component.onContextChange = function (data) {
            contextManager.handleContextChange(data, handler);
        };
        manager2.handleContextChange = function (data) {
            manager2.component.onContextChange(data);
        };
        contextManager.subscribe(manager);
        contextManager.subscribe(manager2);
        contextManager.mount(socket);
        contextManager.mount(socket2);
        // use jest fake timers to test the setTimeout
        jest.useFakeTimers();
        // Both sockets are mounted to the context under a single client id
        // Both component managers are listening for the context
        expect(contextManager['_database'].size).toBe(1);
        expect(handler).toHaveBeenCalledTimes(2); // initial data is used for initial context for both component managers
        expect(contextManager.get(socket)).toEqual({});
        handler.mockClear();
        // when a new data is assigned to the context, both component managers will be notified
        contextManager.assign(socket, { test: 'test' });
        expect(handler).toHaveBeenCalledTimes(2);
        expect(contextManager.get(socket)).toEqual({ test: 'test' });
        expect(contextManager.get(socket2)).toEqual({ test: 'test' });
        expect((_a = contextManager['_database'].get(socket.clientId)) === null || _a === void 0 ? void 0 : _a.doc['_subscribers'].size).toBe(2);
        handler.mockClear();
        // when a socket is destroyed, the context manager will remove the socket from the context
        socket.destroy();
        jest.runAllTimers();
        expect(contextManager['_database'].size).toBe(1);
        expect((_b = contextManager['_database'].get(socket2.clientId)) === null || _b === void 0 ? void 0 : _b.doc['_subscribers'].size).toBe(1);
        // when the second socket is destroyed, the context manager will remove the client id from the context
        socket2.destroy();
        // The context manager gives the context 10 seconds to be used again before removing it
        // This is to prevent the context from being removed and recreated if the component is quickly mounted and unmounted
        jest.runAllTimers();
        expect(contextManager['_database'].size).toBe(0);
    });
    it('should be able to always get the updated context data', function () {
        var contextManager = new contextManager_1.ContextDistributor({});
        var _a = createManager(), socket = _a.socket, manager = _a.manager;
        manager.component.onContextChange = function (data) {
            contextManager.handleContextChange(data, function () { });
        };
        manager.handleContextChange = function (data) {
            manager.component.onContextChange(data);
        };
        contextManager.subscribe(manager);
        var getter = contextManager.mount(socket);
        expect(getter === null || getter === void 0 ? void 0 : getter.get().data).toEqual({});
        contextManager.assign(socket, { test: 'test' });
        expect(getter === null || getter === void 0 ? void 0 : getter.get().data).toEqual({ test: 'test' });
    });
    it('should be created using a create context function', function () {
        var _a = __read((0, contextManager_1.createContext)({}), 2), consumer = _a[0], provider = _a[1];
        expect(consumer.get).toBeDefined();
        expect(consumer.assign).toBeDefined();
        expect(provider.subscribe).toBeDefined();
        expect(provider.mount).toBeDefined();
        expect(consumer.handleContextChange).toBeDefined();
    });
});
