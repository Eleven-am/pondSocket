import {Broadcast, Subscription} from "./pubSub";
import {PondBaseActions} from "./enums";
import {PondError} from "./basePromise";

export class PondDocument<T> {
    private readonly _id: string;
    private _doc: T | undefined;
    private readonly _removeDoc: () => void;
    private readonly _updateDoc: (value: T) => PondDocument<T>;

    constructor(id: string, doc: T | undefined, removeDoc: () => void, updateDoc: (value: T) => PondDocument<T>) {
        this._id = id;
        this._doc = doc;
        this._removeDoc = removeDoc;
        this._updateDoc = updateDoc;
    }

    get id() {
        return this._id;
    }

    get doc() {
        return this._doc as T;
    }

    /**
     * @desc Removes the document from the collection
     */
    removeDoc() {
        this._removeDoc();
        return this._doc;
    }

    /**
     * @desc Updates the document in the collection
     * @param value - the new value of the document
     */
    updateDoc(value: T) {
        this._doc = this._updateDoc(value).doc;
    }
}

export class PondBase<T> {
    private readonly _db: Record<string, T>;
    private readonly _broadcast: Broadcast<{ oldValue: T | null, currentValue: T | null }, void>;

    constructor() {
        this._db = {};
        this._broadcast = new Broadcast();
    }

    /**
     * @desc Get the number of documents
     */
    public get size(): number {
        return Object.keys(this._db).length;
    }

    /**
     * @desc Get a document by key
     * @param key - The key of the document
     */
    public get(key: string): PondDocument<T> | null {
        const doc = this._db[key];
        if (doc)
            return this._createPondDocument(key, doc);

        return null;
    }

    /**
     * @desc Set a document to the database
     * @param value - The value of the document
     */
    public set(value: T): PondDocument<T> {
        const key = this._nanoid();
        this._db[key] = value;
        this._broadcast.publish({oldValue: null, currentValue: value});
        return this._createPondDocument(key, value);
    }

    /**
     * @desc Update a document by key
     * @param key - The key of the document
     * @param value - The new value of the document
     */
    public update(key: string, value: T): PondDocument<T> {
        if (this._db[key]) {
            this._db[key] = value;
            this._broadcast.publish({oldValue: this._db[key], currentValue: value});
            return this._createPondDocument(key, value);
        } else
            throw new PondError(`Key ${key} does not exist in the pond`, 404, key);
    }

    /**
     * @desc Create a pond document
     * @param creator - The creator function of the pond document
     */
    public createDocument(creator: (doc: Readonly<PondDocument<undefined>>) => T): PondDocument<T> {
        let scaffold = this._createPondDocument(this._nanoid(), undefined) as PondDocument<any>;
        const doc = creator(scaffold);
        this._db[scaffold.id] = doc;
        scaffold.updateDoc(doc);
        this._broadcast.publish({oldValue: null, currentValue: doc});
        return scaffold;
    }

    /**
     * @desc Merge the pond with another pond
     * @param pond - The pond to merge with
     */
    public merge(pond: PondBase<T>): PondBase<T> {
        for (const key in pond._db) {
            this._db[key] = pond._db[key];
        }

        return this;
    }

    /**
     * @desc Generate a generator of all documents
     */
    public* generate(): Generator<T> {
        for (const key in this._db) {
            yield this._db[key];
        }
    }

    /**
     * @desc Query documents by a query function
     * @param query - The query function
     */
    public query(query: (doc: T) => boolean): PondDocument<T>[] {
        const result: PondDocument<T>[] = [];
        for (const key in this._db) {
            const doc = this._db[key];
            if (query(doc))
                result.push(this._createPondDocument(key, doc));
        }

        return result;
    }

    /**
     * @desc Query documents by a query function on the document's key
     * @param query - The query function
     */
    public queryById(query: (id: string) => boolean): PondDocument<T>[] {
        const result: PondDocument<T>[] = [];
        for (const key in this._db) {
            if (query(key))
                result.push(this._createPondDocument(key, this._db[key]));
        }

        return result;
    }

    /**
     * @desc Query documents by a list of keys
     * @param keys - The keys of the documents
     */
    public queryByKeys(keys: string[]): PondDocument<T>[] {
        return keys.map(key => this.get(key)).filter(doc => doc !== null) as PondDocument<T>[];
    }

    /**
     * @desc Reduces the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    public reduce<U>(reducer: (accumulator: U, currentValue: T, currentIndex: number) => U, initialValue: U): U {
        let index = 0;
        for (const key in this._db) {
            initialValue = reducer(initialValue, this._db[key], index);
            index++;
        }

        return initialValue;
    }

    /**
     * @desc Find a document by a query function
     * @param query - The query function
     */
    public find(query: (doc: T) => boolean): PondDocument<T> | null {
        for (const key in this._db) {
            const doc = this._db[key];
            if (query(doc))
                return this._createPondDocument(key, doc);
        }

        return null;
    }

    /**
     * @desc Map the pond to a new array
     * @param mapper - The mapper function
     */
    public map<U>(mapper: (doc: T) => U): U[] {
        return Object.values(this._db).map(mapper);
    }

    /**
     * @desc Clear the pond
     */
    public clear() {
        const keys = Object.keys(this._db);
        keys.forEach(key => this._delete(key));
    }

    /**
     * @desc Subscribe to change on all documents
     * @param handler - The handler function of the event
     */
    public subscribe(handler: (docs: T[], change: T | null, action: PondBaseActions) => void): Subscription {
        return this._broadcast.subscribe((data) => {
            let change: PondBaseActions = PondBaseActions.UPDATE_IN_POND;

            if (data.oldValue === null) change = PondBaseActions.ADD_TO_POND;

            else if (data.currentValue === null) change = PondBaseActions.REMOVE_FROM_POND;

            handler(Object.values(this._db), data.currentValue, change);
        });
    }

    /**
     * @desc Get all the documents in an array
     */
    public toArray(): PondDocument<T>[] {
        const result = [];
        for (const key in this._db) {
            const doc = this._db[key];
            result.push(this._createPondDocument(key, doc));
        }

        return result;
    }

    /**
     * @desc Delete a document by key
     */
    private _delete(key: string) {
        delete this._db[key];
        this._broadcast.publish({oldValue: this._db[key], currentValue: null});
    }

    /**
     * @des Generate a key for a new document
     */
    private _nanoid = () => {
        let id = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 21; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return id;
    }

    /**
     * @desc Create a pond document
     * @param id - The id of the document
     * @param doc - The document
     * @private
     */
    private _createPondDocument(id: string, doc: T | undefined): PondDocument<T> {
        const removeDoc = this._delete.bind(this, id);
        const updateDoc = this.update.bind(this, id);
        return new PondDocument<T>(id, doc, removeDoc, updateDoc);
    }
}
