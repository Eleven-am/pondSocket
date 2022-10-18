"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pondKeyboardEvents = void 0;
var eventEmmiter_1 = require("./eventEmmiter");
var pondKeyUp = function (channel, watcher) {
    watcher.addEventListener('[pond-keyup]', 'keyup', function (element, event) {
        (0, eventEmmiter_1.dispatchEvent)(channel, element, 'pond-keyup', event);
    });
};
var pondKeyDown = function (channel, watcher) {
    watcher.addEventListener('[pond-keydown]', 'keydown', function (element, event) {
        (0, eventEmmiter_1.dispatchEvent)(channel, element, 'pond-keydown', event);
    });
};
var pondKeyPress = function (channel, watcher) {
    watcher.addEventListener('[pond-keypress]', 'keypress', function (element, event) {
        (0, eventEmmiter_1.dispatchEvent)(channel, element, 'pond-keypress', event);
    });
};
var pondChange = function (channel, watcher) {
    watcher.addEventListener('[pond-change]', 'change', function (element, event) {
        (0, eventEmmiter_1.dispatchEvent)(channel, element, 'pond-change', event);
    });
};
var pondWindowKeyUp = function (channel, watcher) {
    watcher.addEventListener('[pond-window-keyup]', 'keyup', function (element, event) {
        var closestRouter = element.closest('[pond-router]');
        var key = event.key;
        if (closestRouter) {
            var path = closestRouter.getAttribute('pond-router');
            var event_1 = element.getAttribute('pond-window-keyup');
            if (path && event_1 && key)
                channel.broadcastFrom("event/".concat(path), { type: event_1, key: key });
        }
    });
};
var pondWindowKeyDown = function (channel, watcher) {
    watcher.addEventListener('[pond-window-keydown]', 'keydown', function (element, event) {
        var closestRouter = element.closest('[pond-router]');
        var key = event.key;
        if (closestRouter) {
            var path = closestRouter.getAttribute('pond-router');
            var event_2 = element.getAttribute('pond-window-keydown');
            if (path && event_2 && key)
                channel.broadcastFrom("event/".concat(path), { type: event_2, key: key });
        }
    });
};
var pondWindowKeyPress = function (channel, watcher) {
    watcher.addEventListener('[pond-window-keypress]', 'keypress', function (element, event) {
        var closestRouter = element.closest('[pond-router]');
        var key = event.key;
        if (closestRouter) {
            var path = closestRouter.getAttribute('pond-router');
            var event_3 = element.getAttribute('pond-window-keypress');
            if (path && event_3 && key)
                channel.broadcastFrom("event/".concat(path), { type: event_3, key: key });
        }
    });
};
var pondKeyboardEvents = function (channel, watcher) {
    pondKeyUp(channel, watcher);
    pondKeyDown(channel, watcher);
    pondKeyPress(channel, watcher);
    pondChange(channel, watcher);
    pondWindowKeyUp(channel, watcher);
    pondWindowKeyDown(channel, watcher);
    pondWindowKeyPress(channel, watcher);
};
exports.pondKeyboardEvents = pondKeyboardEvents;
