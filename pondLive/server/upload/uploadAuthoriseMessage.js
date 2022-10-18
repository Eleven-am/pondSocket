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
var pondSocket_1 = require("../../../pondSocket");
var pondBase_1 = require("../../../pondBase");
var UploadAuthoriseMessage = /** @class */ (function (_super) {
    __extends(UploadAuthoriseMessage, _super);
    function UploadAuthoriseMessage(files, identifier, clientId, uploadPath, channel) {
        var _this = _super.call(this) || this;
        _this._files = files;
        _this._identifier = identifier;
        _this.clientId = clientId;
        _this._channel = channel;
        _this._uploadPath = uploadPath;
        return _this;
    }
    Object.defineProperty(UploadAuthoriseMessage.prototype, "files", {
        get: function () {
            var _this = this;
            return this._files.map(function (file) {
                var acceptUpload = _this._authorizeDownload.bind(_this, file.identifier);
                var declineUpload = _this._declineDownload.bind(_this, file.identifier);
                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    acceptUpload: acceptUpload,
                    declineUpload: declineUpload
                };
            });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Creates a socket response object.
     */
    UploadAuthoriseMessage.prototype._createPondResponse = function () {
        var _this = this;
        var assigns = {
            assigns: {},
            presence: {},
            channelData: {}
        };
        var resolver = function (data) {
            if (data.error)
                throw new pondBase_1.PondError(data.error.errorMessage, data.error.errorCode, 'PondError');
            else if (data.message && _this._channel)
                _this._channel.broadcast(data.message.event, data.message.payload);
            return;
        };
        return new pondSocket_1.PondResponse({}, assigns, resolver);
    };
    UploadAuthoriseMessage.prototype.authoriseAll = function () {
        this._authorizeDownload(this._identifier);
    };
    UploadAuthoriseMessage.prototype.sendError = function (message) {
        this._declineDownload(this._identifier, message);
    };
    UploadAuthoriseMessage.prototype._authorizeDownload = function (identifier) {
        var csrfObject = {
            token: identifier, clientId: this.clientId, timestamp: Date.now()
        };
        var response = this._createPondResponse();
        var csrfToken = this.encrypt(this.clientId, csrfObject);
        response.send('pondUploadToken', {
            identifier: identifier, token: csrfToken,
            uploadPath: this._uploadPath
        });
    };
    UploadAuthoriseMessage.prototype._declineDownload = function (identifier, message) {
        var response = this._createPondResponse();
        response.send('pondUploadError', {
            identifier: identifier, error: message || 'Unauthorized'
        });
    };
    return UploadAuthoriseMessage;
}(pondBase_1.BaseClass));
exports.UploadAuthoriseMessage = UploadAuthoriseMessage;
