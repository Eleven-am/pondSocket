"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadAuthoriseMessage = void 0;
var pondsocket_1 = require("../../../pondsocket");
var pondbase_1 = require("../../../pondbase");
var UploadAuthoriseMessage = /** @class */ (function (_super) {
    __extends(UploadAuthoriseMessage, _super);
    function UploadAuthoriseMessage(files, identifier, clientId, channel) {
        var _this = _super.call(this) || this;
        _this._files = files;
        _this._identifier = identifier;
        _this.clientId = clientId;
        _this._response = UploadAuthoriseMessage._createPondResponse(channel);
        return _this;
    }
    Object.defineProperty(UploadAuthoriseMessage.prototype, "files", {
        get: function () {
            var _this = this;
            return this._files.map(function (file) {
                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    declineUpload: function (error) { return _this._declineDownload(file, error); },
                    acceptUpload: function () { return _this._authorizeDownload(file); }
                };
            });
        },
        enumerable: false,
        configurable: true
    });
    UploadAuthoriseMessage.prototype.authoriseAll = function () {
        var csrfObject = {
            token: this._identifier, clientId: this.clientId, timestamp: Date.now()
        };
        var csrfToken = this.encrypt(this.clientId, csrfObject);
        this._response.send('pondUploadToken', {
            identifier: this._identifier, token: csrfToken
        });
    };
    UploadAuthoriseMessage.prototype.sendError = function (message) {
        this._response.send('pondUploadError', {
            identifier: this._identifier, error: message || 'Unauthorized'
        });
    };
    UploadAuthoriseMessage.prototype._authorizeDownload = function (file) {
        var csrfObject = {
            token: file.identifier, clientId: this.clientId, timestamp: Date.now()
        };
        var csrfToken = this.encrypt(this.clientId, csrfObject);
        this._response.send('pondUploadToken', {
            identifier: file.identifier, token: csrfToken
        });
    };
    UploadAuthoriseMessage.prototype._declineDownload = function (file, message) {
        this._response.send('pondUploadError', {
            identifier: file.identifier, error: message || 'Unauthorized'
        });
    };
    /**
     * @desc Creates a socket response object.
     */
    UploadAuthoriseMessage._createPondResponse = function (channel) {
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {}
        };
        var resolver = function (data) {
            if (data.error)
                throw new pondbase_1.PondError(data.error.errorMessage, data.error.errorCode, 'PondError');
            else if (data.message && channel)
                channel.broadcast(data.message.event, data.message.payload);
            return;
        };
        return new pondsocket_1.PondResponse(channel, assigns, resolver);
    };
    return UploadAuthoriseMessage;
}(pondbase_1.BaseClass));
exports.UploadAuthoriseMessage = UploadAuthoriseMessage;
