"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pondResponse_1 = require("./pondResponse");
var createResponse = function (headers) {
    var res = {
        writeHeadFn: jest.fn(),
        setHeaderFn: jest.fn(),
        statusCode: 0,
        pipe: jest.fn(),
        writeHead: function (code, headers) {
            res.statusCode = code;
            res.headers = headers;
            res.writeHeadFn(code, headers);
        },
        setHeader: function (key, value) {
            res.headers[key] = value;
            res.setHeaderFn(key, value);
        },
        end: jest.fn(),
        headers: headers,
    };
    var response = new pondResponse_1.PondResponse(res);
    return { res: res, response: response };
};
describe('PondResponse', function () {
    it('should set the content type', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.setHeader('Content-Type', 'text/html');
        expect(res.headers['Content-Type']).toBe('text/html');
    });
    it('should set the status code', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.status(200);
        expect(res.statusCode).toBe(200);
    });
    it('should set the status code and message', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.status(200, 'OK');
        expect(res.statusCode).toBe(200);
        expect(res.headers).toBe('OK');
    });
    it('should end the response', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.end();
        expect(res.end).toHaveBeenCalled();
    });
    it('should pipe a stream', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        var stream = { pipe: jest.fn() };
        response.pipe(stream);
        expect(stream.pipe).toHaveBeenCalledWith(res);
    });
    it('should redirect', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.redirect('/test');
        expect(res.statusCode).toBe(302);
        expect(res.headers.Location).toBe('/test');
    });
    it('should send json', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.json({ test: 'test' });
        expect(res.statusCode).toBe(200);
        expect(res.headers['Content-Type']).toBe('application/json');
        expect(res.end).toHaveBeenCalledWith(JSON.stringify({ test: 'test' }));
    });
    it('should send html', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.html('<div></div>');
        expect(res.statusCode).toBe(200);
        expect(res.headers['Content-Type']).toBe('text/html');
        expect(res.end).toHaveBeenCalledWith('<div></div>');
    });
    it('should apply CORS headers', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.applyCORS({
            origin: '*',
            methods: 'GET, POST',
            allowedHeaders: 'Content-Type',
            exposedHeaders: 'Content-Length',
        });
        expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(res.headers['Access-Control-Allow-Methods']).toBe('GET, POST');
        expect(res.headers['Access-Control-Allow-Headers']).toBe('Content-Type');
        expect(res.headers['Access-Control-Expose-Headers']).toBe('Content-Length');
    });
    it('should be able to set cookies', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.setCookie('test', 'test');
        expect(res.headers['Set-Cookie']).toBe('test=test');
        var _b = createResponse({}), res2 = _b.res, response2 = _b.response;
        response2.setCookie('test', 'test', {
            httpOnly: true,
            secure: true,
            maxAge: 1000,
            domain: 'test.com',
            path: '/test',
            sameSite: 'lax',
        });
        expect(res2.headers['Set-Cookie']).toBe('test=test; Path=/test; Domain=test.com; Secure; HttpOnly; Max-Age=1000; SameSite=lax');
    });
    it('should be able to clear cookies', function () {
        var _a = createResponse({}), res = _a.res, response = _a.response;
        response.clearCookie('test');
        expect(res.headers['Set-Cookie']).toBe('test=; Max-Age=0');
    });
});
