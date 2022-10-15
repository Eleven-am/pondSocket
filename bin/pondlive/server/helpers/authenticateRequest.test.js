"use strict";
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
var pondbase_1 = require("../../../pondbase");
var authenticate_1 = require("./authenticate");
var pondResponse_1 = require("./pondResponse");
var pondRequest_1 = require("./pondRequest");
var http_1 = require("http");
var pondServer_1 = require("../ad-hoc/pondServer");
var createRequest = function (cookie) {
    var req = {
        headers: {
            cookie: cookie ? "cookie=".concat(cookie, ";") : undefined
        },
        on: jest.fn(),
        data: {}
    };
    var res = {
        writeHead: jest.fn(),
        setHeader: jest.fn(),
        end: jest.fn(),
    };
    var next = jest.fn();
    var request = new pondRequest_1.PondRequest(req);
    var response = new pondResponse_1.PondResponse(res);
    return { next: next, res: res, response: response, request: request, req: req };
};
describe('authenticateRequest', function () {
    it('should reject an invalid cookie', function () {
        var authenticateRequest = (0, authenticate_1.AuthorizeRequest)('secret', 'cookie');
        var _a = createRequest('guvehdjknwklnfjw'), next = _a.next, res = _a.res, response = _a.response, req = _a.request;
        authenticateRequest(req, response, next);
        expect(req.data.clientId).toBeUndefined();
        expect(req.data.token).toBeUndefined();
        expect(next).not.toBeCalled();
        expect(res.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(res.end).toBeCalledWith(JSON.stringify({ message: 'Unauthorized' }));
    });
    it('should reject an expired cookie', function () {
        var base = new pondbase_1.BaseClass();
        var cookie = base.encrypt('secret', { time: '123456789' });
        var authenticateRequest = (0, authenticate_1.AuthorizeRequest)('secret', 'cookie');
        var _a = createRequest(cookie), next = _a.next, res = _a.res, response = _a.response, req = _a.request;
        authenticateRequest(req, response, next);
        expect(req.data.clientId).toBeUndefined();
        expect(req.data.token).toBeUndefined();
        expect(next).not.toBeCalled();
        expect(res.setHeader).toBeCalledWith('Content-Type', 'application/json');
        expect(res.end).toBeCalledWith(JSON.stringify({ message: 'Unauthorized' }));
    });
    it('should accept a valid cookie', function () {
        var base = new pondbase_1.BaseClass();
        var cookie = base.encrypt('secret', { time: Date.now().toString() });
        var authenticateRequest = (0, authenticate_1.AuthorizeRequest)('secret', 'cookie');
        var _a = createRequest(cookie), next = _a.next, res = _a.res, response = _a.response, req = _a.request;
        authenticateRequest(req, response, next);
        expect(req.data.clientId).toBeDefined();
        expect(req.data.token).toBeDefined();
        expect(next).toBeCalled();
        expect(res.writeHead).not.toBeCalled();
        expect(res.end).not.toBeCalled();
    });
    it('should add a cookie to the response', function () {
        var authenticateRequest = (0, authenticate_1.AuthorizeRequest)('secret', 'cookie');
        var _a = createRequest(), next = _a.next, res = _a.res, response = _a.response, req = _a.request;
        authenticateRequest(req, response, next);
        expect(req.data.clientId).toBeDefined();
        expect(req.data.token).toBeDefined();
        expect(next).toBeCalled();
        expect(res.writeHead).not.toBeCalled();
        expect(res.end).not.toBeCalled();
        expect(res.setHeader).toBeCalledWith('Set-Cookie', expect.any(String));
    });
    it('should be able to take a custom auth function', function () {
        var authenticateRequest = (0, authenticate_1.AuthorizeRequest)('secret', 'cookie', function () { return ({ clientId: null, token: '456' }); });
        var _a = createRequest(), next = _a.next, res = _a.res, response = _a.response, req = _a.request;
        authenticateRequest(req, response, next);
        expect(req.data.clientId).toBeUndefined();
        expect(req.data.token).toBeUndefined();
        expect(next).not.toBeCalled();
        expect(res.end).toBeCalled();
        expect(res.setHeader).toBeCalled();
        var authenticateRequest2 = (0, authenticate_1.AuthorizeRequest)('secret', 'cookie', function () { return ({ clientId: '123', token: '456' }); });
        var _b = createRequest(), next2 = _b.next, res2 = _b.res, response2 = _b.response, req2 = _b.request;
        authenticateRequest2(req2, response2, next2);
        expect(req2.data.clientId).toBeDefined();
        expect(req2.data.token).toBeDefined();
        expect(next2).toBeCalled();
        expect(res2.writeHead).not.toBeCalled();
        expect(res2.end).not.toBeCalled();
        expect(res2.setHeader).not.toBeCalled();
    });
});
describe('AuthorizeUpgrade', function () {
    it('should run authentication on a socket upgrade request', function () { return __awaiter(void 0, void 0, void 0, function () {
        var server, mock, pond, authenticateUpgrade, req, socket;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    server = (0, http_1.createServer)();
                    mock = jest.fn();
                    pond = new pondServer_1.PondServer(server);
                    authenticateUpgrade = (0, authenticate_1.AuthorizeUpgrade)('secret', 'cookie', function () { return ({ clientId: null, token: '456' }); });
                    pond.upgrade('/test', function (request, response) {
                        mock();
                        authenticateUpgrade(request, response);
                    });
                    req = {
                        url: '/test',
                        on: jest.fn(),
                    };
                    socket = {
                        on: jest.fn(),
                        write: jest.fn(),
                        destroy: jest.fn(),
                    };
                    return [4 /*yield*/, server.emit('upgrade', req, socket, Buffer.from(''))];
                case 1:
                    _a.sent();
                    // it should fail the authentication
                    // but because it is an async function, it will not be called until the next tick
                    expect(mock).toBeCalled();
                    expect(socket.write).toBeCalled();
                    expect(socket.destroy).toBeCalled();
                    return [2 /*return*/];
            }
        });
    }); });
});
