"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyResponse = void 0;
var setCookieGenerator = function (response) {
    response.setCookie = function (name, value, options) {
        if (options === void 0) { options = {}; }
        var cookie = "".concat(name, "=").concat(value);
        if (options) {
            if (options.path)
                cookie += "; Path=".concat(options.path);
            if (options.domain)
                cookie += "; Domain=".concat(options.domain);
            if (options.secure)
                cookie += "; Secure";
            if (options.httpOnly)
                cookie += "; HttpOnly";
            if (options.expires)
                cookie += "; Expires=".concat(options.expires.toUTCString());
            if (options.maxAge !== undefined)
                cookie += "; Max-Age=".concat(options.maxAge);
            if (options.sameSite)
                cookie += "; SameSite=".concat(options.sameSite);
        }
        response.setHeader('Set-Cookie', cookie);
    };
    return response;
};
var HTMLResponse = function (response) {
    response.html = function (html) {
        response.setHeader('Content-Type', 'text/html');
        response.write(html);
        response.end();
    };
    return response;
};
var applyResponse = function (response) {
    return HTMLResponse(setCookieGenerator(response));
};
exports.applyResponse = applyResponse;
