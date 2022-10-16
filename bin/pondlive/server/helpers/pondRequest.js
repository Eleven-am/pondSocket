"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondRequest = void 0;
var authenticate_1 = require("./authenticate");
var PondRequest = /** @class */ (function () {
    function PondRequest(request) {
        this._request = request;
        this._data = {};
        this._query = {};
        this._cookies = {};
        this._parseQuery();
        this._parseCookies();
    }
    Object.defineProperty(PondRequest.prototype, "body", {
        /**
         * @desc Get the body of the request
         */
        get: function () {
            return this._body;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PondRequest.prototype, "data", {
        /**
         * @desc Get the data of the request
         */
        get: function () {
            return this._data;
        },
        /**
         * @desc Set the data of the request
         */
        set: function (value) {
            this._data = Object.assign(this._data, value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PondRequest.prototype, "request", {
        /**
         * @desc Get the default incoming message
         */
        get: function () {
            return this._request;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PondRequest.prototype, "url", {
        /**
         * @desc Get the url of the request
         */
        get: function () {
            return this._request.url || '';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PondRequest.prototype, "method", {
        /**
         * @desc Get the method of the request
         */
        get: function () {
            return this._request.method || '';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PondRequest.prototype, "query", {
        /**
         * @desc Get's the query of the request
         */
        get: function () {
            return this._query;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Get a header from the request
     * @param name - The name of the header
     */
    PondRequest.prototype.getHeader = function (name) {
        return this._request.headers[name] || null;
    };
    /**
     * @desc Get the cookie of the request
     * @param cookieName - The name of the cookie
     */
    PondRequest.prototype.getCookie = function (cookieName) {
        return this._cookies[cookieName] || null;
    };
    /**
     * @desc Parse the body of the request
     * @param next - The next function
     */
    PondRequest.prototype.parseBody = function (next) {
        var _this = this;
        var body = '';
        this._request.on('data', function (chunk) {
            body += chunk.toString();
        });
        this._request.on('end', function () {
            _this._body = body;
            var contentType = _this.getHeader('content-type');
            if (contentType === 'application/json' && _this._body) {
                try {
                    _this._body = JSON.parse(_this._body);
                    next();
                }
                catch (e) {
                    console.error(e);
                    next();
                }
            }
            else
                next();
        });
        this._request.on('error', function () {
            _this._body = null;
            next();
        });
    };
    /**
     * @desc Parse the query of the request
     * @private
     */
    PondRequest.prototype._parseQuery = function () {
        var e_1, _a;
        var query = this.url.split('?')[1];
        if (query) {
            var queries = query.split('&');
            try {
                for (var queries_1 = __values(queries), queries_1_1 = queries_1.next(); !queries_1_1.done; queries_1_1 = queries_1.next()) {
                    var q = queries_1_1.value;
                    var _b = __read(q.split('='), 2), key = _b[0], value = _b[1];
                    this._query[key] = value;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (queries_1_1 && !queries_1_1.done && (_a = queries_1.return)) _a.call(queries_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    /**
     * @desc Get the cookies of the request
     */
    PondRequest.prototype._parseCookies = function () {
        this._cookies = (0, authenticate_1.parseCookies)(this._request);
    };
    return PondRequest;
}());
exports.PondRequest = PondRequest;
