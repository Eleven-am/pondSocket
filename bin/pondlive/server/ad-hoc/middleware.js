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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Middleware = void 0;
var pondbase_1 = require("../../../pondbase");
var chainLambda_1 = require("../helpers/chainLambda");
var Middleware = /** @class */ (function (_super) {
    __extends(Middleware, _super);
    function Middleware(server) {
        var _this = _super.call(this) || this;
        _this._stack = [];
        _this._server = server;
        _this._handler = (0, chainLambda_1.MiddlewareHandler)();
        _this._initMiddleware();
        return _this;
    }
    Object.defineProperty(Middleware.prototype, "stack", {
        get: function () {
            return this._stack;
        },
        enumerable: false,
        configurable: true
    });
    Middleware.prototype.useRaw = function (middleware) {
        this._stack.push(middleware);
    };
    Middleware.prototype.use = function (middleware) {
        this._handler.use(middleware);
    };
    Middleware.prototype._execute = function (req, res) {
        var tasks = __spreadArray([], __read(this._stack), false);
        var next = function () {
            var task = tasks.shift();
            if (task)
                task(req, res, next);
            else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            }
        };
        next();
    };
    Middleware.prototype._initMiddleware = function () {
        var _this = this;
        this._server.on('request', function (req, res) {
            _this._execute(req, res);
        });
        this._server.on('listening', function () {
            var middleware = _this._handler.chain();
            _this.useRaw(middleware);
        });
    };
    return Middleware;
}(pondbase_1.BaseClass));
exports.Middleware = Middleware;
