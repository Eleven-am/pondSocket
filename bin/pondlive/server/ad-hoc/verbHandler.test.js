"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var verbHandler_1 = require("./verbHandler");
describe('verbHandler', function () {
    it('should handle a request', function () {
        var handler = jest.fn();
        var chain = {
            use: jest.fn()
        };
        verbHandler_1.verbHandler.call(chain, 'path', 'GET', handler);
        expect(chain.use).toBeCalled();
        var use = chain.use.mock.calls[0][0];
        var request = {
            method: 'GET', url: 'path',
            parseBody: jest.fn(),
        };
        var response = {};
        use(request, response, jest.fn());
        expect(handler).toBeCalledWith(request, response);
    });
    it('should not handle a request if path is unequal', function () {
        var handler = jest.fn();
        var chain = {
            use: jest.fn()
        };
        verbHandler_1.verbHandler.call(chain, 'path', 'GET', handler);
        expect(chain.use).toBeCalled();
        var use = chain.use.mock.calls[0][0];
        var request = {
            method: 'GET', url: 'path2',
            parseBody: jest.fn(),
        };
        var response = {};
        use(request, response, jest.fn());
        expect(handler).not.toBeCalled();
    });
    it('should not handle a request if method is unequal', function () {
        var handler = jest.fn();
        var chain = {
            use: jest.fn()
        };
        verbHandler_1.verbHandler.call(chain, 'path', 'GET', handler);
        expect(chain.use).toBeCalled();
        var use = chain.use.mock.calls[0][0];
        var request = {
            method: 'POST', url: 'path'
        };
        var response = {};
        use(request, response, jest.fn());
        expect(handler).not.toBeCalled();
    });
});
