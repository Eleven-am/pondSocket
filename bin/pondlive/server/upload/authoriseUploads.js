"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authoriseUploader = void 0;
var pondbase_1 = require("../../../pondbase");
/**
 * @desc A function that authorizes upload requests
 * @param authorizer - a function that authorizes the request
 */
var authoriseUploader = function (authorizer) { return function (req) {
    var _a = authorizer(req), clientId = _a.clientId, setToken = _a.setToken;
    if (setToken || !clientId)
        return { valid: false, clientId: '' };
    var csrfToken = req.headers['x-csrf-token'];
    if (csrfToken === undefined)
        return { valid: false, clientId: '' };
    var base = new pondbase_1.BaseClass();
    var tokenObject = base.decrypt(clientId, csrfToken);
    if (!tokenObject)
        return { valid: false, clientId: '' };
    var valid = Date.now() - tokenObject.timestamp <= 1000 * 60 * 60 * 2;
    return { valid: valid, clientId: clientId };
}; };
exports.authoriseUploader = authoriseUploader;
