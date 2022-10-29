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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondBase = void 0;
var pubSub_1 = require("./pubSub");
var simpleBase_1 = require("./simpleBase");
var enums_1 = require("./enums");
var PondBase = /** @class */ (function (_super) {
    __extends(PondBase, _super);
    function PondBase() {
        var _this = this;
        var broadcast = new pubSub_1.Broadcast();
        _this = _super.call(this, function (data) { return broadcast.publish(data); }) || this;
        _this._broadcast = broadcast;
        return _this;
    }
    Object.defineProperty(PondBase.prototype, "_nanoid", {
        /**
         * @des Generate a key for a new document
         */
        get: function () {
            var id = '';
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (var i = 0; i < 21; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Subscribe to the database
     * @param handler - The handler to call when the database is updated
     */
    PondBase.prototype.subscribe = function (handler) {
        var _this = this;
        return this._broadcast.subscribe(function (data) {
            var change = enums_1.PondBaseActions.UPDATE_IN_POND;
            if (data.oldValue === null)
                change = enums_1.PondBaseActions.ADD_TO_POND;
            else if (data.currentValue === null)
                change = enums_1.PondBaseActions.REMOVE_FROM_POND;
            handler(Object.values(_this._getDB()), data.currentValue || data.oldValue, change);
        });
    };
    /**
     * @desc Add a document to the database
     * @param doc - The document to add
     */
    PondBase.prototype.addDoc = function (doc) {
        return _super.prototype.set.call(this, this._nanoid, doc);
    };
    /**
     * @desc Left join two ponds on a key on this pond and a foreign key on the other pond
     * @param pond - The pond to join with
     * @param key - The key to join on
     * @param foreignKey - The foreign key to join on
     */
    PondBase.prototype.leftJoin = function (pond, key, foreignKey) {
        var e_1, _a;
        var newPond = new PondBase();
        var _loop_1 = function (doc) {
            var _d;
            var foreignDoc = pond.find(function (d) { return d[foreignKey] === doc.doc[key]; });
            newPond.set(doc.id, __assign(__assign({}, doc.doc), (_d = {}, _d[key] = (foreignDoc === null || foreignDoc === void 0 ? void 0 : foreignDoc.doc) || null, _d)));
        };
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var doc = _c.value;
                _loop_1(doc);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return newPond;
    };
    return PondBase;
}(simpleBase_1.SimpleBase));
exports.PondBase = PondBase;
