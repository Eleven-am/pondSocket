"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var componentManager_1 = require("./componentManager");
var pondbase_1 = require("../../pondbase");
var createComponentManager = function () {
    var test = {
        pond: {
            on: jest.fn(),
        },
        chain: {
            use: jest.fn(),
        },
        parentId: 'test',
        secret: 'test',
        uploadPubSub: new pondbase_1.Broadcast(),
        providers: [],
    };
    var context = {
        routes: [],
        providers: [],
    };
    return new componentManager_1.ComponentManager('/test', context, test);
};
describe('ComponentManager', function () {
    it('should be an instance of ComponentManager', function () {
        var componentManager = createComponentManager();
        expect(componentManager).toBeInstanceOf(componentManager_1.ComponentManager);
    });
});
