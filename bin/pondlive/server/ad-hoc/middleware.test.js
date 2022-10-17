"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var middleware_1 = require("./middleware");
describe('Middleware', function () {
    it('should create a middleware class', function () {
        var server = (0, http_1.createServer)();
        var middleware = new middleware_1.Middleware(server);
        expect(middleware).toBeInstanceOf(middleware_1.Middleware);
    });
    it('should add a middleware', function () {
        var server = (0, http_1.createServer)();
        var middleware = new middleware_1.Middleware(server);
        var middlewareFn = jest.fn();
        middleware.useRaw(middlewareFn);
        expect(middleware.stack).toContain(middlewareFn);
    });
    it('should call all middleware', function () {
        var server = (0, http_1.createServer)();
        var middleware = new middleware_1.Middleware(server);
        var middlewareFn = jest.fn();
        middleware.useRaw(function (_req, _res, next) {
            middlewareFn();
            next();
        });
        middleware.useRaw(function (_req, _res, next) {
            middlewareFn();
            next();
        });
        middleware.useRaw(function (_req, _res, next) {
            middlewareFn();
            next();
        });
        middleware.use(function (_req, _res, next) {
            middlewareFn();
            next();
        });
        middleware.use(function (_req, _res, next) {
            middlewareFn();
            next();
        });
        middleware.use(function (_req, _res, next) {
            middlewareFn();
            next();
        });
        var req = {
            headers: {},
            callbacks: [],
            parseBody: jest.fn(),
            on: jest.fn(function (event, callback) {
                if (event === 'end')
                    req.callbacks.push(callback);
            }),
            emit: jest.fn(function () {
                req.callbacks.forEach(function (callback) { return callback(); });
            }),
        };
        var response = {
            writeHead: jest.fn(),
            end: jest.fn(),
        };
        middleware['_execute'](req, response);
        req.emit();
        expect(middlewareFn).toBeCalledTimes(6);
        expect(response.writeHead).toBeCalledWith(404, { 'Content-Type': 'text/plain' });
        expect(response.end).toBeCalledWith('404 Not Found');
        expect(req.on).toBeCalledTimes(3); // it is called during the creation of the first middleware
        // it is however called on three different events (data, end, error)
        middlewareFn.mockClear();
        req.callbacks = [];
        req.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        server.emit('request', req, response);
        req.emit();
        expect(middlewareFn).toBeCalledTimes(6);
        expect(response.writeHead).toBeCalledWith(404, { 'Content-Type': 'text/plain' });
        expect(response.end).toBeCalledWith('404 Not Found');
        expect(req.on).toBeCalledTimes(3); // it is called during the creation of the first middleware
        // it is however called on three different events (data, end, error)
    });
});
