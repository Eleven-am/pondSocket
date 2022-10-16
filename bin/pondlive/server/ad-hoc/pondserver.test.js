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
var pondServer_1 = require("./pondServer");
var http_1 = require("http");
describe('PondServer', function () {
    it('should instantiate an instance of the class', function () {
        var server = (0, http_1.createServer)();
        var pond = new pondServer_1.PondServer(server);
        expect(pond).toBeDefined();
    });
    it('should start the server', function () {
        var server = (0, http_1.createServer)();
        var pond = new pondServer_1.PondServer(server);
        pond.listen(3000, function () {
            expect(true).toBeTruthy();
        });
        server.close();
    });
    it('should add a new middleware', function () {
        var server = (0, http_1.createServer)();
        var mock = jest.fn();
        var pond = new pondServer_1.PondServer(server);
        var request = {
            url: '/test',
            method: 'GET',
            headers: {},
            callbacks: [],
            on: function (event, callback) {
                request.callbacks.push({ event: event, callback: callback });
            },
            emit: function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                request.callbacks.forEach(function (cb) {
                    if (cb.event === event) {
                        cb.callback.apply(cb, __spreadArray([], __read(args), false));
                    }
                });
            }
        };
        pond.useRaw(function (_req, _res, next) {
            mock();
            next();
        });
        pond.use(function (_req, _res, next) {
            mock();
            next();
        });
        server.emit('request', request, {
            writeHead: jest.fn(),
            end: jest.fn(),
        });
        request.emit('end');
        expect(mock).toBeCalledTimes(2);
    });
    it('should add a new socket endpoint', function () {
        var server = (0, http_1.createServer)();
        var mock = jest.fn();
        var pond = new pondServer_1.PondServer(server);
        pond.upgrade('/api', function (_req, res) {
            mock();
            res.accept();
        });
        server.emit('upgrade', {
            url: '/api'
        }, {
            write: jest.fn(),
            destroy: jest.fn(),
        });
        expect(mock).toBeCalledTimes(1);
    });
    it('should create a HTTP Verbs endpoint', function () {
        var server = (0, http_1.createServer)();
        var mock = jest.fn();
        var pond = new pondServer_1.PondServer(server);
        var request = {
            url: '/api',
            method: 'GET',
            headers: {},
            callbacks: [],
            on: function (event, callback) {
                request.callbacks.push({ event: event, callback: callback });
            },
            emit: function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                request.callbacks.forEach(function (cb) {
                    if (cb.event === event) {
                        cb.callback.apply(cb, __spreadArray([], __read(args), false));
                    }
                });
            }
        };
        var response = {
            setHeader: jest.fn(),
            writeHead: jest.fn(),
            end: jest.fn()
        };
        pond.get('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).toBeCalledTimes(1);
        expect(response.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.callbacks = [];
        request.method = 'POST';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).not.toBeCalled();
        expect(response.writeHead).toBeCalledWith(404, { "Content-Type": "text/plain" });
        expect(response.end).toBeCalledWith('404 Not Found');
        response.writeHead.mockClear();
        response.end.mockClear();
        pond.post('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        request.callbacks = [];
        request.method = 'POST';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).toBeCalledTimes(1);
        expect(response.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.callbacks = [];
        request.method = 'PUT';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).not.toBeCalled();
        expect(response.writeHead).toBeCalledWith(404, { "Content-Type": "text/plain" });
        expect(response.end).toBeCalledWith('404 Not Found');
        request.callbacks = [];
        response.writeHead.mockClear();
        response.end.mockClear();
        pond.put('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        request.callbacks = [];
        request.method = 'PUT';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).toBeCalledTimes(1);
        expect(response.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        pond.patch('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        pond.delete('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        pond.put('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        pond.head('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        request.callbacks = [];
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.callbacks = [];
        request.method = 'PATCH';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).toBeCalledTimes(1);
        expect(response.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.callbacks = [];
        request.method = 'DELETE';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).toBeCalledTimes(1);
        expect(response.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.callbacks = [];
        request.method = 'PUT';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).toBeCalledTimes(1);
        expect(response.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.callbacks = [];
        request.method = 'HEAD';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).toBeCalledTimes(1);
        expect(response.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.callbacks = [];
        request.url = '/api/1';
        request.method = 'GET';
        server.emit('request', request, response);
        request.emit('end');
        expect(mock).not.toBeCalled();
        expect(response.writeHead).toBeCalledWith(404, { "Content-Type": "text/plain" });
        expect(response.end).toBeCalledWith('404 Not Found');
    });
});
