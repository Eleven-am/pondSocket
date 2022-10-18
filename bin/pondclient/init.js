"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
var socket_1 = require("./socket");
var informer_1 = require("./informer");
var domWatcher_1 = require("./domWatcher");
var pondMouseEvents_1 = require("./pondMouseEvents");
var history_1 = require("./history");
var pondKeyboardEvents_1 = require("./pondKeyboardEvents");
var pondFormEvents_1 = require("./pondFormEvents");
var eventEmmiter_1 = require("./eventEmmiter");
var pondUpload_1 = require("./pondUpload");
var handler_1 = require("./handler");
var init = function () {
    var socket = new socket_1.PondClientSocket('/live');
    socket.connect();
    var channelCreated = false;
    socket.onMessage(function (event, message) {
        if (event === 'token' && !channelCreated) {
            window.token = message.csrfToken;
            channelCreated = true;
            var watcher_1 = new domWatcher_1.DomWatcher();
            var channel_1 = socket.createChannel("/".concat(message.nanoId), { clientId: message.csrfToken });
            channel_1.join();
            var emitted_1 = false;
            channel_1.onConnectionChange(function (state) {
                if (state) {
                    var handler = (0, handler_1.pondEventHandler)(channel_1, watcher_1);
                    (0, informer_1.informer)(channel_1, watcher_1);
                    (0, pondMouseEvents_1.pondMouseEvents)(handler);
                    (0, pondKeyboardEvents_1.pondKeyboardEvents)(channel_1, watcher_1);
                    (0, pondFormEvents_1.pondFormInit)(channel_1, watcher_1);
                    (0, history_1.router)(watcher_1);
                    (0, informer_1.manageRoutes)(channel_1);
                    (0, pondUpload_1.pondUploadInit)(channel_1, handler);
                    if (!emitted_1) {
                        emitted_1 = true;
                        (0, eventEmmiter_1.emitEvent)('pondReady', channel_1);
                    }
                }
            });
        }
    });
};
exports.init = init;
