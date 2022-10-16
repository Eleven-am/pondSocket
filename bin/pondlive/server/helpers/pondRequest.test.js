"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pondRequest_1 = require("./pondRequest");
var http_1 = require("http");
var net_1 = require("net");
var createRequest = function (url, headers, method) {
    var req = {
        method: method || 'GET',
        url: url || '/',
        headers: headers || {},
        callbacks: [],
        on: jest.fn(function (event, callback) {
            if (event === 'end')
                req.callbacks.push(callback);
        }),
        emit: jest.fn(function () {
            req.callbacks.forEach(function (callback) { return callback(); });
        }),
    };
    var request = new pondRequest_1.PondRequest(req);
    return { req: req, request: request };
};
describe('PondRequest', function () {
    it('should parse body', function () {
        var req = new http_1.IncomingMessage(new net_1.Socket());
        var request = new pondRequest_1.PondRequest(req);
        request.parseBody(function () { });
        req.emit('data', 'test');
        req.emit('end');
        expect(request.body).toBe('test');
    });
    it('should parse json body', function () {
        var req = new http_1.IncomingMessage(new net_1.Socket());
        var request = new pondRequest_1.PondRequest(req);
        request.parseBody(function () { });
        req.headers['content-type'] = 'application/json';
        req.emit('data', '{"test": "test"}');
        req.emit('end');
        expect(request.body).toEqual({ test: 'test' });
    });
    it('should get method', function () {
        var _a = createRequest(), req = _a.req, request = _a.request;
        req.method = 'POST';
        expect(request.method).toBe('POST');
    });
    it('should get url', function () {
        var _a = createRequest(), req = _a.req, request = _a.request;
        req.url = '/test';
        expect(request.url).toBe('/test');
    });
    it('should get header', function () {
        var _a = createRequest(), req = _a.req, request = _a.request;
        req.headers = { test: 'test' };
        expect(request.getHeader('test')).toBe('test');
    });
    it('should parse and get query', function () {
        var request = createRequest('/?test=test').request;
        expect(request.query).toEqual({ test: 'test' });
        var request2 = createRequest('/?test=test&test2=test2').request;
        expect(request2.query).toEqual({ test: 'test', test2: 'test2' });
    });
    it('should read a cookie', function () {
        var request = createRequest('/', { 'cookie': 'test=test' }).request;
        expect(request.getCookie('test')).toBe('test');
        var request2 = createRequest('/', { 'cookie': 'test=test;test2=test2' }).request;
        expect(request2.getCookie('test2')).toBe('test2');
    });
});
