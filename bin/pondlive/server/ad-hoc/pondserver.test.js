"use strict";
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
        pond.useRaw(function (_req, _res, next) {
            mock();
            next();
        });
        pond.use(function (_req, _res, next) {
            mock();
            next();
        });
        server.emit('request', {
            on: jest.fn(),
        }, {
            writeHead: jest.fn(),
            end: jest.fn(),
        });
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
            method: 'GET', url: '/api', headers: {},
            on: jest.fn(),
        };
        var response = {
            writeHead: jest.fn(),
            end: jest.fn()
        };
        pond.get('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        server.emit('request', request, response);
        expect(mock).toBeCalledTimes(1);
        expect(response.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' });
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.method = 'POST';
        server.emit('request', request, response);
        expect(mock).not.toBeCalled();
        expect(response.writeHead).toBeCalledWith(404, { "Content-Type": "text/plain" });
        expect(response.end).toBeCalledWith('404 Not Found');
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        pond.post('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        request.method = 'POST';
        server.emit('request', request, response);
        expect(mock).toBeCalledTimes(1);
        expect(response.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' });
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.method = 'PUT';
        server.emit('request', request, response);
        expect(mock).not.toBeCalled();
        expect(response.writeHead).toBeCalledWith(404, { "Content-Type": "text/plain" });
        expect(response.end).toBeCalledWith('404 Not Found');
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        pond.put('/api', function (_req, res) {
            mock();
            res.json({ message: 'Hello World' });
        });
        request.method = 'PUT';
        server.emit('request', request, response);
        expect(mock).toBeCalledTimes(1);
        expect(response.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' });
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
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
        request.method = 'PATCH';
        server.emit('request', request, response);
        expect(mock).toBeCalledTimes(1);
        expect(response.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' });
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.method = 'DELETE';
        server.emit('request', request, response);
        expect(mock).toBeCalledTimes(1);
        expect(response.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' });
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.method = 'PUT';
        server.emit('request', request, response);
        expect(mock).toBeCalledTimes(1);
        expect(response.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' });
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.method = 'HEAD';
        server.emit('request', request, response);
        expect(mock).toBeCalledTimes(1);
        expect(response.writeHead).toBeCalledWith(200, { 'Content-Type': 'application/json' });
        expect(response.end).toBeCalledWith(JSON.stringify({ message: 'Hello World' }));
        request.on.mockClear();
        response.writeHead.mockClear();
        response.end.mockClear();
        mock.mockClear();
        request.url = '/api/1';
        request.method = 'GET';
        server.emit('request', request, response);
        expect(mock).not.toBeCalled();
        expect(response.writeHead).toBeCalledWith(404, { "Content-Type": "text/plain" });
        expect(response.end).toBeCalledWith('404 Not Found');
    });
});
