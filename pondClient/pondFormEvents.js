"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pondFormInit = void 0;
var pondFocus = function (channel, watcher) {
    watcher.addEventListener('[pond-focus]', 'focus', function (element) {
        var closestRouter = element.closest('[pond-router]');
        if (closestRouter) {
            var path = closestRouter.getAttribute('pond-router');
            var event_1 = element.getAttribute('pond-focus');
            var dataId = element.getAttribute('pond-data-id');
            if (path && event_1)
                channel.broadcastFrom("event/".concat(path), { type: event_1, dataId: dataId });
        }
    });
};
var pondBlur = function (channel, watcher) {
    watcher.addEventListener('[pond-blur]', 'blur', function (element) {
        var closestRouter = element.closest('[pond-router]');
        if (closestRouter) {
            var path = closestRouter.getAttribute('pond-router');
            var event_2 = element.getAttribute('pond-blur');
            var dataId = element.getAttribute('pond-data-id');
            if (path && event_2)
                channel.broadcastFrom("event/".concat(path), { type: event_2, dataId: dataId });
        }
    });
};
var pondChange = function (channel, watcher) {
    watcher.addEventListener('[pond-change]', 'change', function (element) {
        var closestRouter = element.closest('[pond-router]');
        if (closestRouter) {
            var path = closestRouter.getAttribute('pond-router');
            var event_3 = element.getAttribute('pond-change');
            var dataId = element.getAttribute('pond-data-id');
            if (path && event_3)
                channel.broadcastFrom("event/".concat(path), { type: event_3, dataId: dataId });
        }
    });
};
var pondInput = function (channel, watcher) {
    watcher.addEventListener('[pond-input]', 'input', function (element) {
        var closestRouter = element.closest('[pond-router]');
        if (closestRouter) {
            var path = closestRouter.getAttribute('pond-router');
            var event_4 = element.getAttribute('pond-input');
            var dataId = element.getAttribute('pond-data-id');
            if (path && event_4)
                channel.broadcastFrom("event/".concat(path), { type: event_4, dataId: dataId });
        }
    });
};
var pondSubmit = function (channel, watcher) {
    watcher.addEventListener('[pond-submit]', 'submit', function (element, evt) {
        evt.preventDefault();
        var closestRouter = element.closest('[pond-router]');
        if (closestRouter) {
            var path = closestRouter.getAttribute('pond-router');
            var event_5 = element.getAttribute('pond-submit');
            var dataId = element.getAttribute('pond-data-id');
            if (path && event_5)
                channel.broadcastFrom("event/".concat(path), { type: event_5, dataId: dataId });
        }
    });
};
var pondFormInit = function (channel, watcher) {
    pondFocus(channel, watcher);
    pondBlur(channel, watcher);
    pondChange(channel, watcher);
    pondInput(channel, watcher);
    pondSubmit(channel, watcher);
};
exports.pondFormInit = pondFormInit;
