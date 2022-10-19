"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondLive = exports.fileExist = void 0;
var express_1 = __importDefault(require("express"));
var authenticate_1 = require("../auth/authenticate");
var pondSocket_1 = require("../../../pondSocket");
var pondBase_1 = require("../../../pondBase");
var http_1 = require("http");
var component_1 = require("../../component");
var upload_1 = require("../upload");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var fileExist = function (filePath) {
    try {
        return fs_1.default.existsSync(filePath) && !fs_1.default.lstatSync(filePath).isDirectory();
    }
    catch (err) {
        return false;
    }
};
exports.fileExist = fileExist;
/**
 * @desc Creates a pond live server
 * @param app - The Express app to be used by the server
 * @constructor
 */
var PondLive = function (app) {
    var server = (0, http_1.createServer)(app);
    var pondSocket = new pondSocket_1.PondSocket(server);
    var base = new pondBase_1.BaseClass();
    var broadcaster = new pondBase_1.Broadcast();
    app.usePondLive = function (routes, options) {
        var cookieName = (options === null || options === void 0 ? void 0 : options.cookie) || 'pondLive';
        var staticPath = (options === null || options === void 0 ? void 0 : options.staticPath) || '';
        var secret = (options === null || options === void 0 ? void 0 : options.secret) || base.uuid();
        var pondPath = (options === null || options === void 0 ? void 0 : options.pondPath) || '';
        var uploadPath = (options === null || options === void 0 ? void 0 : options.uploadPath) || '/pondLive/uploads';
        var providers = (options === null || options === void 0 ? void 0 : options.providers) || [];
        var pondId = base.nanoId();
        var htmlPath = undefined;
        var authenticator = (0, authenticate_1.AuthorizeRequest)(secret, cookieName, options === null || options === void 0 ? void 0 : options.authenticator);
        var socketAuthenticator = (0, authenticate_1.AuthorizeUpgrade)(secret, cookieName, options === null || options === void 0 ? void 0 : options.authenticator);
        var validator = (0, upload_1.authoriseUploader)((0, authenticate_1.getAuthorizer)(secret, cookieName, options === null || options === void 0 ? void 0 : options.authenticator));
        var uploader = (0, upload_1.GenerateUploader)(validator, broadcaster);
        app.use(authenticator);
        app.post(uploadPath, uploader);
        app.use(express_1.default.static(path_1.default.join(__dirname, '../../client')));
        if (staticPath) {
            var exists = (0, exports.fileExist)("".concat(options.staticPath, "/index.html"));
            if (exists)
                htmlPath = "".concat(options.staticPath, "/index.html");
        }
        var endpoint = pondSocket.createEndpoint('/live', function (req, res) {
            return socketAuthenticator(req, res);
        });
        var channel = endpoint.createChannel('/:nanoId', function (req, res) {
            if (req.joinParams.clientId === req.clientAssigns.csrfToken && req.params.nanoId === req.clientAssigns.nanoId)
                res.accept();
            else
                res.reject('Unauthorized', 4001);
        });
        var managerProps = {
            pond: channel,
            htmlPath: htmlPath,
            chain: app,
            secret: secret,
            parentId: pondId,
            internalBus: broadcaster,
            providers: providers,
            uploadPath: uploadPath,
        };
        routes.map(function (route) {
            var path = "".concat(pondPath).concat(route.path);
            return new component_1.ComponentManager(path, new route.Component(), managerProps);
        });
        app.use(express_1.default.static(staticPath));
    };
    app.upgrade = function (path, handler) {
        return pondSocket.createEndpoint(path, handler);
    };
    app.listen = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return server.listen.apply(server, __spreadArray([], __read(args), false));
    };
    return app;
};
exports.PondLive = PondLive;
