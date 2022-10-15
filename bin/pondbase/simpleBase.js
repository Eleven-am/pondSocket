"use strict";
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleBase = void 0;
var pondBase_1 = require("./pondBase");
var SimpleBase = /** @class */ (function () {
    function SimpleBase() {
        this._db = {};
    }
    Object.defineProperty(SimpleBase.prototype, "size", {
        /**
         * @desc Get the number of documents
         */
        get: function () {
            return Object.keys(this._db).length;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Get a document by key
     * @param key - The key of the document
     */
    SimpleBase.prototype.get = function (key) {
        var doc = this._db[key];
        if (doc)
            return this._createPondDocument(key, doc);
        return null;
    };
    /**
     * @desc Set a document to the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    SimpleBase.prototype.set = function (key, value) {
        this._db[key] = value;
        return this._createPondDocument(key, value);
    };
    SimpleBase.prototype.getOrCreate = function (key, creator) {
        var doc = this.get(key);
        if (doc)
            return doc;
        else {
            return this.set(key, creator(this._createPondDocument(key, {})));
        }
    };
    /**
     * @desc Merge the pond with another pond
     * @param pond - The pond to merge with
     */
    SimpleBase.prototype.merge = function (pond) {
        for (var key in pond._db) {
            this._db[key] = pond._db[key];
        }
        return this;
    };
    /**
     * @desc Generate a generator of all documents
     */
    SimpleBase.prototype.generate = function () {
        var _a, _b, _i, key;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = [];
                    for (_b in this._db)
                        _a.push(_b);
                    _i = 0;
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    key = _a[_i];
                    return [4 /*yield*/, this._db[key]];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    };
    SimpleBase.prototype.join = function (secondPond, key, secondKey) {
        var result = [];
        var secondBade = secondPond._db;
        for (var id1 in this._db) {
            for (var id2 in secondBade) {
                if (this._db[id1][key] === secondBade[id2][secondKey]) {
                    result.push(__assign(__assign({}, this._db[id1]), secondBade[id2]));
                }
            }
        }
        return result;
    };
    /**
     * @desc Query documents by a query function
     * @param query - The query function
     */
    SimpleBase.prototype.query = function (query) {
        var result = [];
        for (var key in this._db) {
            var doc = this._db[key];
            if (query(doc))
                result.push(this._createPondDocument(key, doc));
        }
        return result;
    };
    /**
     * @desc Reduces the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    SimpleBase.prototype.reduce = function (reducer, initialValue) {
        var index = 0;
        for (var key in this._db) {
            initialValue = reducer(initialValue, this._db[key], index);
            index++;
        }
        return initialValue;
    };
    /**
     * @desc Find a document by a query function
     * @param query - The query function
     */
    SimpleBase.prototype.find = function (query) {
        for (var key in this._db) {
            var doc = this._db[key];
            if (query(doc))
                return this._createPondDocument(key, doc);
        }
        return null;
    };
    /**
     * @desc Map the pond to a new array
     * @param mapper - The mapper function
     */
    SimpleBase.prototype.map = function (mapper) {
        return Object.values(this._db).map(mapper);
    };
    /**
     * @desc Clear the pond
     */
    SimpleBase.prototype.clear = function () {
        var _this = this;
        var keys = Object.keys(this._db);
        keys.forEach(function (key) { return _this._delete(key); });
    };
    /**
     * @desc Get all the documents in an array
     */
    SimpleBase.prototype.toArray = function () {
        var result = [];
        for (var key in this._db) {
            var doc = this._db[key];
            result.push(this._createPondDocument(key, doc));
        }
        return result;
    };
    /**
     * @desc Delete a document by key
     */
    SimpleBase.prototype._delete = function (key) {
        delete this._db[key];
    };
    /**
     * @desc Create a pond document
     * @param id - The id of the document
     * @param doc - The document
     * @private
     */
    SimpleBase.prototype._createPondDocument = function (id, doc) {
        var removeDoc = this._delete.bind(this, id);
        var updateDoc = this.set.bind(this, id);
        return new pondBase_1.PondDocument(id, doc, removeDoc, updateDoc);
    };
    return SimpleBase;
}());
exports.SimpleBase = SimpleBase;
