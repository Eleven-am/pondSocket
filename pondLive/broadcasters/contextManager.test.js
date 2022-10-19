"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var contextManager_1 = require("./contextManager");
/*const createChannel = () => {
    const removeDoc = jest.fn()
    const channel = new Channel('TEST', removeDoc);

    return {channel, removeDoc}
}*/
describe('ContextManager', function () {
    it('should create a new context', function () {
        var contextManager = new contextManager_1.ContextDistributor({});
        expect(contextManager).toBeDefined();
    });
});
