"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleBase = exports.PondDocument = void 0;
class PondDocument {
    constructor(id, removeDoc, updateDoc, getDoc) {
        this._removeDoc = removeDoc;
        this._updateDoc = updateDoc;
        this._getDoc = getDoc;
        this._id = id;
    }
    get id() {
        return this._id;
    }
    get doc() {
        return this._getDoc();
    }
    /**
     * @desc Removes the document from the collection
     */
    removeDoc() {
        const doc = this._getDoc();
        this._removeDoc();
        return doc;
    }
    /**
     * @desc Updates the document in the collection
     * @param value - the new value of the document
     */
    updateDoc(value) {
        this._updateDoc(value);
        return this;
    }
}
exports.PondDocument = PondDocument;
class SimpleBase {
    constructor(callbacks) {
        this._db = {};
        this._update = callbacks || null;
    }
    /**
     * @desc Get the number of documents
     */
    get size() {
        return Object.keys(this._db).length;
    }
    /**
     * @desc Get all the documents in the database
     */
    get all() {
        return Object.keys(this._db).map(this._createPondDocument.bind(this));
    }
    /**
     * @desc Makes the database iterable
     */
    [Symbol.iterator]() {
        return this.all[Symbol.iterator]();
    }
    /**
     * @desc Create a generator for the pond
     */
    *generator() {
        for (const key in this._db) {
            yield this._createPondDocument(key);
        }
    }
    /**
     * @desc Get a document by key
     * @param key - The key of the document
     */
    get(key) {
        const doc = this._db[key];
        if (doc)
            return this._createPondDocument(key);
        return null;
    }
    /**
     * @desc getOrCreate a document in the database
     * @param key - The key of the document
     * @param creator - The function to create the document
     */
    getOrCreate(key, creator) {
        const doc = this.get(key);
        if (doc)
            return doc;
        return this.set(key, creator(this._createPondDocument(key)));
    }
    /**
     * @desc Upsert a document in the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    upsert(key, value) {
        const doc = this.get(key);
        if (doc)
            return doc.updateDoc(value);
        return this.set(key, value);
    }
    /**
     * @desc checks if a document exists
     * @param key - The key of the document
     */
    has(key) {
        return this._db[key] !== undefined;
    }
    /**
     * @desc Set a document to the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    set(key, value) {
        var _a;
        const oldValue = this._db[key] || null;
        this._db[key] = value;
        (_a = this._update) === null || _a === void 0 ? void 0 : _a.call(this, { oldValue, currentValue: value });
        return this._createPondDocument(key);
    }
    /**
     * @desc Find a document by a query function
     * @param query - The query function
     */
    find(query) {
        for (const key in this._db) {
            const doc = this._db[key];
            if (query(doc, key))
                return this._createPondDocument(key);
        }
        return null;
    }
    /**
     * @desc Map the pond to a new array
     * @param mapper - The mapper function
     */
    map(mapper) {
        return Object.keys(this._db).map(key => mapper(this._db[key], key));
    }
    /**
     * @desc Filters the pond using a query function
     * @param query - The query function
     */
    filter(query) {
        return Object.keys(this._db)
            .filter(key => query(this._db[key], key))
            .map(this._createPondDocument.bind(this));
    }
    /**
     * @desc Reduce the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    reduce(reducer, initialValue) {
        return Object.values(this._db).reduce(reducer, initialValue);
    }
    /**
     * @desc Gets all the keys of the database
     */
    get keys() {
        return Object.keys(this._db);
    }
    /**
     * @desc Gets all the values of the database
     */
    get values() {
        return Object.values(this._db);
    }
    /**
     * @desc Generate a generic pond document
     * @param id - The id of the document
     */
    createGenericDocument(id) {
        const idValue = id || Math.random().toString(36).substr(2, 9);
        return this._createPondDocument(idValue);
    }
    /**
     * @desc Delete a document by key
     */
    _delete(key) {
        var _a;
        const oldValue = this._db[key];
        delete this._db[key];
        (_a = this._update) === null || _a === void 0 ? void 0 : _a.call(this, { oldValue, currentValue: null });
    }
    /**
     * @desc Retrieve a document from the database
     * @param key - The key of the document
     */
    _getDocument(key) {
        const data = this._db[key];
        if (!data)
            return null;
        return data;
    }
    /**
     * @desc Create a pond document
     * @param id - The id of the document
     * @private
     */
    _createPondDocument(id) {
        const removeDoc = this._delete.bind(this, id);
        const updateDoc = this.set.bind(this, id);
        const getDoc = this._getDocument.bind(this, id);
        return new PondDocument(id, removeDoc, updateDoc, getDoc);
    }
    /**
     * @desc Gets the raw database
     * @protected
     */
    _getDB() {
        return this._db;
    }
}
exports.SimpleBase = SimpleBase;
