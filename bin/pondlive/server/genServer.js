"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateLiveServer = void 0;
var server_1 = require("../../server");
var base_1 = require("../../base");
var path_1 = __importDefault(require("path"));
var chainLambda_1 = require("./helpers/chainLambda");
var authenticate_1 = require("./helpers/authenticate");
var static_1 = require("./helpers/static");
var componentManager_1 = require("../component/componentManager");
var pondResponse_1 = require("./helpers/pondResponse");
var upload_1 = require("./upload/upload");
/**
 * @desc Creates a pond live server
 * @param routes - The routes to be used by the server
 * @param server - The HTTP server to be used by the server
 * @param options - The options to be used by the server
 * @constructor
 */
var GenerateLiveServer = function (routes, server, options) {
    var _a;
    var pondSocket = (_a = options === null || options === void 0 ? void 0 : options.pondSocket) !== null && _a !== void 0 ? _a : new server_1.PondSocket(server);
    var handler = (0, chainLambda_1.MiddlewareHandler)();
    var base = new base_1.BaseClass();
    var secret = (options === null || options === void 0 ? void 0 : options.secret) || base.uuid();
    var pondId = base.nanoId();
    var cookieName = (options === null || options === void 0 ? void 0 : options.cookie) || 'pondLive';
    var pondPath = (options === null || options === void 0 ? void 0 : options.pondPath) || '';
    var htmlPath = undefined;
    var staticPath = path_1.default.join(__dirname, '../client');
    var broadcaster = new base_1.Broadcast();
    var staticMiddleWare = (0, static_1.staticMiddleware)({
        root: staticPath,
        dotfiles: 'ignore',
        etag: true,
        extensions: ['html', 'js', 'css', 'json', 'png', 'jpg'],
        immutable: true,
        lastModified: true,
        maxAge: 3600000,
    });
    if (options === null || options === void 0 ? void 0 : options.staticPath) {
        var exists = (0, pondResponse_1.fileExist)("".concat(options.staticPath, "/index.html"));
        if (exists)
            htmlPath = "".concat(options.staticPath, "/index.html");
        var staticMiddleWare_1 = (0, static_1.staticMiddleware)({
            root: options.staticPath,
            dotfiles: 'ignore',
            etag: true,
            extensions: ['html', 'js', 'css', 'json', 'png', 'jpg'],
            immutable: true,
            lastModified: true,
            maxAge: 3600000,
        });
        handler.use(staticMiddleWare_1);
    }
    var authenticator = (0, authenticate_1.AuthorizeRequest)(secret, cookieName, options === null || options === void 0 ? void 0 : options.authenticator);
    var socketAuthenticator = (0, authenticate_1.AuthorizeUpgrade)(secret, cookieName, options === null || options === void 0 ? void 0 : options.authenticator);
    handler.use(authenticator);
    handler.use(staticMiddleWare);
    var endpoint = pondSocket.createEndpoint('/live', function (req, res) {
        return socketAuthenticator(req, res);
    });
    var channel = endpoint.createChannel('/:nanoId', function (req, res) {
        if (req.joinParams.clientId === req.clientAssigns.csrfToken && req.params.nanoId === req.clientAssigns.nanoId)
            res.accept();
        else
            res.reject('Unauthorized', 401);
    });
    var managerProps = {
        pond: channel,
        htmlPath: htmlPath,
        chain: handler,
        secret: secret,
        parentId: pondId,
        uploadPubSub: broadcaster,
        providers: (options === null || options === void 0 ? void 0 : options.providers) || [],
    };
    routes.map(function (route) {
        var path = "".concat(pondPath).concat(route.path);
        return new componentManager_1.ComponentManager(path, new route.Component(), managerProps);
    });
    var pondLiveMiddleware = (0, upload_1.generatePondLiveUploader)(handler.chain(), {
        broadcaster: broadcaster,
        authorizer: (0, authenticate_1.getAuthorizer)(secret, cookieName, options === null || options === void 0 ? void 0 : options.authenticator)
    });
    return { pondLiveMiddleware: pondLiveMiddleware, pondSocket: pondSocket };
};
exports.GenerateLiveServer = GenerateLiveServer;
