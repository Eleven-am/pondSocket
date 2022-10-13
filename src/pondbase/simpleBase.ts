import {PondDocument} from "./pondBase";

type ExtractSameValueType<A, B, C extends keyof A> = {
    [K in keyof B]: B[K] extends A[C] ? A[C] extends B[K] ? K : never : never
}[keyof B]

export class SimpleBase<Type extends object> {
    private readonly _db: { [key: string]: Type };

    constructor() {
        this._db = {};
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
    public get(key: string): PondDocument<Type> | null {
        const doc = this._db[key];
        if (doc)
            return this._createPondDocument(key, doc);

        return null;
    }

    /**
     * @desc Set a document to the database
     * @param key - The key of the document
     * @param value - The value of the document
     */
    public set(key: string, value: Type): PondDocument<Type> {
        this._db[key] = value;
        return this._createPondDocument(key, value);
    }

    public getOrCreate(key: string, creator: (doc: PondDocument<Type>) => Type): PondDocument<Type> {
        const doc = this.get(key);
        if (doc)
            return doc;
        else {
            return this.set(key, creator(this._createPondDocument(key, {} as Type)));
        }
    }

    /**
     * @desc Merge the pond with another pond
     * @param pond - The pond to merge with
     */
    public merge(pond: SimpleBase<Type>): SimpleBase<Type> {
        for (const key in pond._db) {
            this._db[key] = pond._db[key];
        }

        return this;
    }

    /**
     * @desc Generate a generator of all documents
     */
    public* generate(): Generator<Type> {
        for (const key in this._db) {
            yield this._db[key];
        }
    }

    public join<A extends keyof Type, SecondType extends Object, B extends ExtractSameValueType<Type, SecondType, A>>(secondPond: SimpleBase<SecondType>, key: A, secondKey: B) {
        const result: (Type & SecondType)[] = [];
        const secondBade = secondPond._db as { [key: string]: any };
        for (const id1 in this._db) {
            for (const id2 in secondBade) {
                if (this._db[id1][key] === secondBade[id2][secondKey]) {
                    result.push({
                        ...this._db[id1],
                        ...secondBade[id2]
                    });
                }
            }
        }

        return result;
    }

    /**
     * @desc Query documents by a query function
     * @param query - The query function
     */
    public query(query: (doc: Type) => boolean): PondDocument<Type>[] {
        const result: PondDocument<Type>[] = [];
        for (const key in this._db) {
            const doc = this._db[key];
            if (query(doc))
                result.push(this._createPondDocument(key, doc));
        }

        return result;
    }

    /**
     * @desc Reduces the pond to a single value
     * @param reducer - The reducer function
     * @param initialValue - The initial value of the reducer
     */
    public reduce<U>(reducer: (accumulator: U, currentValue: Type, currentIndex: number) => U, initialValue: U): U {
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
    public find(query: (doc: Type) => boolean): PondDocument<Type> | null {
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
    public map<U>(mapper: (doc: Type) => U): U[] {
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
     * @desc Get all the documents in an array
     */
    public toArray(): PondDocument<Type>[] {
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
    }

    /**
     * @desc Create a pond document
     * @param id - The id of the document
     * @param doc - The document
     * @private
     */
    private _createPondDocument(id: string, doc: Type | undefined): PondDocument<Type> {
        const removeDoc = this._delete.bind(this, id);
        const updateDoc = this.set.bind(this, id);
        return new PondDocument<Type>(id, doc, removeDoc, updateDoc);
    }
}
