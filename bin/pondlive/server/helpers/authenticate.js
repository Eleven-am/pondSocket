"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizeUpgrade = exports.AuthorizeRequest = exports.pondAuthorizer = void 0;
var pondRequest_1 = require("./pondRequest");
var base_1 = require("../../../base");
var pondAuthorizer = function (secret, cookie) {
    return function (request) {
        var _a;
        var token = request.getCookie(cookie) || '';
        var clientId = ((_a = new base_1.BaseClass().decrypt(secret, token)) === null || _a === void 0 ? void 0 : _a.time) || null;
        if (!clientId) {
            if (token)
                return { clientId: null, token: null, clearToken: true, };
            clientId = Date.now().toString();
            token = new base_1.BaseClass().encrypt(secret, { time: clientId });
            return { clientId: clientId, token: token, setToken: true };
        }
        if (Date.now() - parseInt(clientId) > 1000 * 60 * 60 * 2) {
            return {
                clientId: null,
                token: null,
                valid: false,
                clearToken: true,
            };
        }
        return { clientId: clientId, token: token };
    };
};
exports.pondAuthorizer = pondAuthorizer;
var AuthorizeRequest = function (secret, cookie, authorizer) {
    if (authorizer === void 0) { authorizer = (0, exports.pondAuthorizer)(secret, cookie); }
    return function (req, res, next) {
        var _a = authorizer(req), clientId = _a.clientId, token = _a.token, setToken = _a.setToken, clearToken = _a.clearToken;
        if (clearToken) {
            res.clearCookie(cookie);
            res.setHeader('Content-Type', 'application/json');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (setToken && token) {
            res.setCookie(cookie, token, {
                maxAge: 1000 * 60 * 60 * 2,
                httpOnly: true,
                sameSite: 'strict',
                secure: true,
            });
        }
        if (!clientId) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.data.clientId = clientId;
        req.data.token = token;
        next();
    };
};
exports.AuthorizeRequest = AuthorizeRequest;
var AuthorizeUpgrade = function (secret, cookie, authorizer) {
    if (authorizer === void 0) { authorizer = (0, exports.pondAuthorizer)(secret, cookie); }
    return function (request, response) {
        var base = new base_1.BaseClass();
        var req = new pondRequest_1.PondRequest(request.request);
        var clientId = authorizer(req).clientId;
        if (!clientId)
            return response.reject('Unauthorized', 401);
        var newToken = {
            token: base.uuid(),
            clientId: clientId,
            timestamp: Date.now()
        };
        var csrfToken = base.encrypt(secret, newToken);
        var nanoId = base.nanoId();
        return response.send('token', { csrfToken: csrfToken, nanoId: nanoId }, {
            assigns: {
                csrfToken: csrfToken,
                clientId: clientId,
                nanoId: nanoId,
            },
        });
    };
};
exports.AuthorizeUpgrade = AuthorizeUpgrade;
