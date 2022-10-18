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
exports.PondBase = exports.PondDocument = void 0;
var pubSub_1 = require("./pubSub");
var enums_1 = require("./enums");
var basePromise_1 = require("./basePromise");
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
    };
    return PondDocument;
}());
exports.PondDocument = PondDocument;
var PondBase = /** @class */ (function () {
    function PondBase() {
        /**
         * @des Generate a key for a new document
         */
        this._nanoid = function () {
            var id = '';
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (var i = 0; i < 21; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        };
        this._db = {};
        this._broadcast = new pubSub_1.Broadcast();
    }
    Object.defineProperty(PondBase.prototype, "size", {
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
    PondBase.prototype.get = function (key) {
        var doc = this._db[key];
        if (doc)
            return this._createPondDocument(key);
        return null;
    };
    /**
     * @desc Set a document to the database
     * @param value - The value of the document
     */
    PondBase.prototype.set = function (value) {
        var key = this._nanoid();
        this._db[key] = value;
        this._broadcast.publish({ oldValue: null, currentValue: value });
        return this._createPondDocument(key);
    };
    /**
     * @desc Update a document by key
     * @param key - The key of the document
     * @param value - The new value of the document
     */
    PondBase.prototype.update = function (key, value) {
        if (this._db[key]) {
            this._db[key] = value;
            this._broadcast.publish({ oldValue: this._db[key], currentValue: value });
            return this._createPondDocument(key);
        }
        else
            throw new basePromise_1.PondError("Key ".concat(key, " does not exist in the pond"), 404, key);
    };
    /**
     * @desc Create a pond document
     * @param creator - The creator function of the pond document
     */
    PondBase.prototype.createDocument = function (creator) {
        var scaffold = this._createPondDocument(this._nanoid());
        var doc = creator(scaffold);
        this._db[scaffold.id] = doc;
        scaffold.updateDoc(doc);
        this._broadcast.publish({ oldValue: null, currentValue: doc });
        return scaffold;
    };
    /**
     * @desc Merge the pond with another pond
     * @param pond - The pond to merge with
     */
    PondBase.prototype.merge = function (pond) {
        for (var key in pond._db) {
            this._db[key] = pond._db[key];
        }
        return this;
    };
    /**
     * @desc Generate a generator of all documents
     */
    PondBase.prototype.generate = function () {
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
    /**
     * @desc Query documents by a query function
     * @param query - The query function
     */
    PondBase.prototype.query = function (query) {
        var result = [];
        for (var key in this._db) {
            var doc = this._db[key];
            if (query(doc))
                result.push(this._createPondDocument(key));
        }
        return result;
    };
    /**
     * @desc Query documents by a query function on the document's key
     * @param query - The query function
     */
    PondBase.prototype.queryById = function (query) {
        var result = [];
        for (var key in this._db) {
            if (query(key))
                result.push(this._createPondDocument(key));
        }
        return result;
    };
    /**
     * @desc Query documents by a list of keys
     * @param keys - The keys of the documents
     */
    PondBase.prototype.queryByKeys = function (keys) {
        var _this = this;
        return keys.map(function (key) { return _this.get(key); }).filter(function (doc) { return doc !== null; });
    };
    /**
     * @desc Reduces the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    PondBase.prototype.reduce = function (reducer, initialValue) {
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
    PondBase.prototype.find = function (query) {
        for (var key in this._db) {
            var doc = this._db[key];
            if (query(doc))
                return this._createPondDocument(key);
        }
        return null;
    };
    /**
     * @desc Map the pond to a new array
     * @param mapper - The mapper function
     */
    PondBase.prototype.map = function (mapper) {
        return Object.values(this._db).map(mapper);
    };
    /**
     * @desc Clear the pond
     */
    PondBase.prototype.clear = function () {
        var _this = this;
        var keys = Object.keys(this._db);
        keys.forEach(function (key) { return _this._delete(key); });
    };
    /**
     * @desc Subscribe to change on all documents
     * @param handler - The handler function of the event
     */
    PondBase.prototype.subscribe = function (handler) {
        var _this = this;
        return this._broadcast.subscribe(function (data) {
            var change = enums_1.PondBaseActions.UPDATE_IN_POND;
            if (data.oldValue === null)
                change = enums_1.PondBaseActions.ADD_TO_POND;
            else if (data.currentValue === null)
                change = enums_1.PondBaseActions.REMOVE_FROM_POND;
            handler(Object.values(_this._db), data.currentValue, change);
        });
    };
    /**
     * @desc Get all the documents in an array
     */
    PondBase.prototype.toArray = function () {
        var _this = this;
        return Object.keys(this._db).map(function (key) { return _this._createPondDocument(key); });
    };
    /**
     * @desc Delete a document by key
     */
    PondBase.prototype._delete = function (key) {
        delete this._db[key];
        this._broadcast.publish({ oldValue: this._db[key], currentValue: null });
    };
    /**
     * @desc Retrieve a document from the database
     * @param key - The key of the document
     */
    PondBase.prototype._getDocument = function (key) {
        return this._db[key] || null;
    };
    /**
     * @desc Create a pond document
     * @param id - The id of the document
     * @private
     */
    PondBase.prototype._createPondDocument = function (id) {
        var removeDoc = this._delete.bind(this, id);
        var updateDoc = this.update.bind(this, id);
        var getDoc = this._getDocument.bind(this, id);
        return new PondDocument(id, removeDoc, updateDoc, getDoc);
    };
    return PondBase;
}());
exports.PondBase = PondBase;
