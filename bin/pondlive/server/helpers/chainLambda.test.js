"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chainLambda_1 = require("./chainLambda");
describe('chainLambda', function () {
    it('should take in middleware functions', function () {
        var handler = (0, chainLambda_1.MiddlewareHandler)();
        var middleware = jest.fn();
        var next = jest.fn();
        handler.use(function (_req, _res, next) {
            next();
            middleware();
        });
        handler.use(function (_req, _res, next) {
            next();
            middleware();
        });
        handler.use(function (_req, _res, next) {
            next();
            middleware();
        });
        expect(handler.chain()).toBeDefined();
        expect(handler.chain()).toBeInstanceOf(Function);
        handler.chain()({ on: jest.fn() }, {}, next);
        expect(middleware).toBeCalledTimes(3);
        expect(next).toBeCalledTimes(1);
    });
});
