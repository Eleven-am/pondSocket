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
var pondResponse_1 = require("./pondResponse");
describe('PondResponse', function () {
    it('should be defined', function () {
        expect(pondResponse_1.PondResponse).toBeDefined();
    });
    it('should call the resolver function on reject', function (done) {
        var resolver = jest.fn();
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        };
        var response = new pondResponse_1.PondResponse({}, assigns, resolver);
        response.reject();
        setTimeout(function () {
            expect(resolver).toBeCalled();
            done();
        }, 100);
    });
    it('should return an error object on reject', function () {
        var resolver = function (data) {
            expect(data.error).toBeDefined();
        };
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        };
        var response = new pondResponse_1.PondResponse({}, assigns, resolver);
        response.reject();
    });
    it('should return specified error object on reject', function () {
        var resolver = function (data) {
            var _a, _b;
            expect((_a = data.error) === null || _a === void 0 ? void 0 : _a.errorMessage).toBe('test');
            expect((_b = data.error) === null || _b === void 0 ? void 0 : _b.errorCode).toBe(403);
        };
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        };
        var response = new pondResponse_1.PondResponse({}, assigns, resolver);
        response.reject('test');
    });
    it('should not return an error object when not rejected', function () {
        var resolver = function (data) {
            expect(data.error).toBeUndefined();
        };
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        };
        var response = new pondResponse_1.PondResponse({}, assigns, resolver);
        response.accept();
    });
    it('should return the specified assigns', function () {
        var resolver = function (data) {
            expect(data.assigns.assigns).toEqual({ test: 'test1' });
            expect(data.assigns.presence).toEqual({ test: 'test2' });
            expect(data.assigns.channelData).toEqual({ test: 'test3' });
        };
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        };
        var response = new pondResponse_1.PondResponse({}, assigns, resolver);
        response.accept({
            assigns: {
                test: 'test1'
            },
            presence: {
                test: 'test2'
            },
            channelData: {
                test: 'test3'
            }
        });
    });
    it('should return the specified assigns but with the message applied CHANNEL', function () {
        var resolver = function (data) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                expect(data.assigns.assigns).toEqual({ test: 'test1' });
                expect(data.assigns.presence).toEqual({ test: 'test2' });
                expect(data.assigns.channelData).toEqual({ test: 'test3' });
                expect(data.message).toEqual({ event: 'test', payload: { message: 'testMessage' } });
                expect(data.error).toBeUndefined();
                return [2 /*return*/];
            });
        }); };
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        };
        var response = new pondResponse_1.PondResponse({}, assigns, resolver);
        response.send('test', { message: 'testMessage' }, {
            assigns: {
                test: 'test1'
            },
            presence: {
                test: 'test2'
            },
            channelData: {
                test: 'test3'
            }
        });
    });
    it('should return the specified assigns but with the message applied POND', function () {
        var secondResolver = function (data) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                expect(data.assigns.assigns).toEqual({ test: 'test1' });
                expect(data.message).toEqual({ event: 'test', payload: { message: 'testMessage' } });
                expect(data.error).toBeUndefined();
                return [2 /*return*/];
            });
        }); };
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        };
        var response2 = new pondResponse_1.PondResponse({}, assigns, secondResolver);
        response2.send('test', { message: 'testMessage' }, {
            assigns: {
                test: 'test1'
            },
        });
    });
    it('should throw an error when you try to double send', function () {
        var resolver = function (data) {
            expect(data.assigns.assigns).toEqual({ test: 'test1' });
            expect(data.assigns.presence).toEqual({ test: 'test2' });
        };
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {},
        };
        var response = new pondResponse_1.PondResponse({}, assigns, resolver);
        response.accept({
            assigns: {
                test: 'test1'
            },
            presence: {
                test: 'test2'
            },
            channelData: {
                test: 'test3'
            }
        });
        expect(function () {
            response.accept({
                assigns: {
                    test: 'test1'
                },
                presence: {
                    test: 'test2'
                },
                channelData: {
                    test: 'test3'
                }
            });
        }).toThrow();
    });
});
