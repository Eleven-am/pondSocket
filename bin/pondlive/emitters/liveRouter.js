"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveRouter = void 0;
var pondsocket_1 = require("../../pondsocket");
var pondbase_1 = require("../../pondbase");
var LiveRouter = /** @class */ (function () {
    function LiveRouter(response, routerType) {
        if (routerType === void 0) { routerType = 'http'; }
        this._response = response;
        this._headers = {
            pageTitle: undefined,
            flashMessage: undefined,
        };
        if (response instanceof pondsocket_1.PondResponse) {
            this._responseSent = false;
            this._routerType = 'socket';
        }
        else {
            this._routerType = routerType;
            this._responseSent = response.response.headersSent;
        }
    }
    Object.defineProperty(LiveRouter.prototype, "pageTitle", {
        /**
         * @desc Sets the page title for the next page
         * @param title - The title of the page
         */
        set: function (title) {
            this._headers.pageTitle = title;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LiveRouter.prototype, "flashMessage", {
        /**
         * @desc Sets the flash message for the next page
         * @param message - The message to display
         */
        set: function (message) {
            this._headers.flashMessage = message;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LiveRouter.prototype, "sentResponse", {
        get: function () {
            return this._responseSent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LiveRouter.prototype, "headers", {
        get: function () {
            return this._headers;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Navigates the client to a new page
     * @param path - The path to navigate to
     */
    LiveRouter.prototype.navigateTo = function (path) {
        if (this._response instanceof pondsocket_1.PondResponse) {
            var message = {
                action: 'redirect',
                path: path,
            };
            this._sendPondResponse(message, this._response);
        }
        else {
            this._routerType === 'client-router' ?
                this._sendClientRouterResponse('redirect', path, this._response) :
                this._sendResponse(path, this._response);
        }
    };
    /**
     * @desc Replaces the current page with a new page
     * @param path - The path to replace with
     */
    LiveRouter.prototype.replace = function (path) {
        if (this._response instanceof pondsocket_1.PondResponse) {
            var message = {
                action: 'replace',
                path: path,
            };
            this._sendPondResponse(message, this._response);
        }
        else {
            this._routerType === 'client-router' ?
                this._sendClientRouterResponse('replace', path, this._response) :
                this._sendResponse(path, this._response);
        }
    };
    LiveRouter.prototype._sendResponse = function (path, response) {
        console.log('send response, path: ' + path);
        if (this._responseSent)
            throw new pondbase_1.PondError('Response already sent', 500, 'PondLive');
        this._responseSent = true;
        response.redirect(path);
    };
    LiveRouter.prototype._sendPondResponse = function (message, response) {
        console.log('send pond response, message: ' + JSON.stringify(message));
        if (this._responseSent)
            throw new pondbase_1.PondError('Response already sent', 500, 'PondLive');
        this._responseSent = true;
        response.send('router', message);
    };
    LiveRouter.prototype._sendClientRouterResponse = function (action, path, response) {
        console.log('send client router response, action: ' + action + ', path: ' + path);
        if (this._responseSent)
            throw new pondbase_1.PondError('Response already sent', 500, 'PondLive');
        this._responseSent = true;
        response.setHeader('x-router-action', action);
        response.setHeader('x-router-path', path);
        response.end();
    };
    return LiveRouter;
}());
exports.LiveRouter = LiveRouter;
