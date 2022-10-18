"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamLinedBroadcaster = exports.broadcaster = exports.dispatchEvent = exports.emitEvent = void 0;
var emitEvent = function (event, data, element) {
    var eventEmitter = new CustomEvent(event, {
        detail: data,
        bubbles: true,
        cancelable: true,
    });
    if (element)
        element.dispatchEvent(eventEmitter);
    else
        window.dispatchEvent(eventEmitter);
};
exports.emitEvent = emitEvent;
var dispatchEvent = function (channel, element, listener, event) {
    var closestRouter = element.closest('[pond-router]');
    var value = null;
    if (event) {
        var input = event.target;
        value = input.value;
    }
    if (closestRouter) {
        var path = closestRouter.getAttribute('pond-router');
        var type = element.getAttribute(listener);
        var dataId = element.getAttribute('pond-data-id');
        if (path && type)
            (0, exports.broadcaster)(channel, path, {
                type: type,
                dataId: dataId,
                value: value
            });
    }
};
exports.dispatchEvent = dispatchEvent;
var broadcaster = function (channel, path, data) {
    channel.broadcastFrom("event/".concat(path), data);
};
exports.broadcaster = broadcaster;
var streamLinedBroadcaster = function (channel, event, data) {
    channel.broadcastFrom(event, data);
};
exports.streamLinedBroadcaster = streamLinedBroadcaster;
