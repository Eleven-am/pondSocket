"use strict";
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
exports.SimpleBase = exports.PondDocument = void 0;
var PondDocument = /** @class */ (function () {
    function PondDocument(id, removeDoc, updateDoc, getDoc) {
        this._removeDoc = removeDoc;
        this._updateDoc = updateDoc;
        this._getDoc = getDoc;
        this._id = id;
    }
    Object.defineProperty(PondDocument.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PondDocument.prototype, "doc", {
        get: function () {
            return this._getDoc();
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Removes the document from the collection
     */
    PondDocument.prototype.removeDoc = function () {
        var doc = this._getDoc();
        this._removeDoc();
        return doc;
    };
    /**
     * @desc Updates the document in the collection
     * @param value - the new value of the document
     */
    PondDocument.prototype.updateDoc = function (value) {
        this._updateDoc(value);
        return this;
    };
    return PondDocument;
}());
exports.PondDocument = PondDocument;
var SimpleBase = /** @class */ (function () {
    function SimpleBase(callbacks) {
        this._db = {};
        this._update = callbacks || null;
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
    Object.defineProperty(SimpleBase.prototype, "all", {
        /**
         * @desc Get all the documents in the database
         */
        get: function () {
            return Object.keys(this._db).map(this._createPondDocument.bind(this));
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Makes the database iterable
     */
    SimpleBase.prototype[Symbol.iterator] = function () {
        return this.all[Symbol.iterator]();
    };
    /**
     * @desc Create a generator for the pond
     */
    SimpleBase.prototype.generator = function () {
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
                    return [4 /*yield*/, this._createPondDocument(key)];
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
    /**
     * @desc Get a document by key
     * @param key - The key of the document
     */
    SimpleBase.prototype.get = function (key) {
        var doc = this._db[key];
        if (doc)
            return this._createPondDocument(key);
        return null;
    };
    /**
     * @desc getOrCreate a document in the database
     * @param key - The key of the document
     * @param creator - The function to create the document
     */
    SimpleBase.prototype.getOrCreate = function (key, creator) {
        var doc = this.get(key);
        if (doc)
            return doc;
        return this.set(key, creator(this._createPondDocument(key)));
    };
    /**
     * @desc Upsert a document in the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    SimpleBase.prototype.upsert = function (key, value) {
        var doc = this.get(key);
        if (doc)
            return doc.updateDoc(value);
        return this.set(key, value);
    };
    /**
     * @desc checks if a document exists
     * @param key - The key of the document
     */
    SimpleBase.prototype.has = function (key) {
        return this._db[key] !== undefined;
    };
    /**
     * @desc Set a document to the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    SimpleBase.prototype.set = function (key, value) {
        var _a;
        var oldValue = this._db[key] || null;
        this._db[key] = value;
        (_a = this._update) === null || _a === void 0 ? void 0 : _a.call(this, { oldValue: oldValue, currentValue: value });
        return this._createPondDocument(key);
    };
    /**
     * @desc Find a document by a query function
     * @param query - The query function
     */
    SimpleBase.prototype.find = function (query) {
        for (var key in this._db) {
            var doc = this._db[key];
            if (query(doc, key))
                return this._createPondDocument(key);
        }
        return null;
    };
    /**
     * @desc Map the pond to a new array
     * @param mapper - The mapper function
     */
    SimpleBase.prototype.map = function (mapper) {
        var _this = this;
        return Object.keys(this._db).map(function (key) { return mapper(_this._db[key], key); });
    };
    /**
     * @desc Filters the pond using a query function
     * @param query - The query function
     */
    SimpleBase.prototype.filter = function (query) {
        var _this = this;
        return Object.keys(this._db)
            .filter(function (key) { return query(_this._db[key], key); })
            .map(this._createPondDocument.bind(this));
    };
    /**
     * @desc Reduce the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    SimpleBase.prototype.reduce = function (reducer, initialValue) {
        return Object.values(this._db).reduce(reducer, initialValue);
    };
    Object.defineProperty(SimpleBase.prototype, "keys", {
        /**
         * @desc Gets all the keys of the database
         */
        get: function () {
            return Object.keys(this._db);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SimpleBase.prototype, "values", {
        /**
         * @desc Gets all the values of the database
         */
        get: function () {
            return Object.values(this._db);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Generate a generic pond document
     * @param id - The id of the document
     */
    SimpleBase.prototype.createGenericDocument = function (id) {
        var idValue = id || Math.random().toString(36).substr(2, 9);
        return this._createPondDocument(idValue);
    };
    /**
     * @desc Delete a document by key
     */
    SimpleBase.prototype._delete = function (key) {
        var _a;
        var oldValue = this._db[key];
        delete this._db[key];
        (_a = this._update) === null || _a === void 0 ? void 0 : _a.call(this, { oldValue: oldValue, currentValue: null });
    };
    /**
     * @desc Retrieve a document from the database
     * @param key - The key of the document
     */
    SimpleBase.prototype._getDocument = function (key) {
        var data = this._db[key];
        if (!data)
            return null;
        return data;
    };
    /**
     * @desc Create a pond document
     * @param id - The id of the document
     * @private
     */
    SimpleBase.prototype._createPondDocument = function (id) {
        var removeDoc = this._delete.bind(this, id);
        var updateDoc = this.set.bind(this, id);
        var getDoc = this._getDocument.bind(this, id);
        return new PondDocument(id, removeDoc, updateDoc, getDoc);
    };
    /**
     * @desc Gets the raw database
     * @protected
     */
    SimpleBase.prototype._getDB = function () {
        return this._db;
    };
    return SimpleBase;
}());
exports.SimpleBase = SimpleBase;
