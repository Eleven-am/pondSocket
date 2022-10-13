import {SimpleBase} from "./simpleBase";

describe('SimpleBase', () => {
    it('should create a new database', () => {
        const db = new SimpleBase();
        expect(db.size).toBe(0);
    });

    it('should get a document', () => {
        const db = new SimpleBase();
        const doc = db.set('test', { test: 1 });
        expect(db.get('test')?.doc).toEqual(doc.doc);
    });

    it('should get a document with a default value', () => {
        const db = new SimpleBase();
        const doc = db.getOrCreate('test', () => ({ test: 1 }));
        expect(db.get('test')?.doc).toEqual(doc?.doc);
    });

    it('should get a document with a default value', () => {
        const db = new SimpleBase();
        db.set('test', { test: 1 });
        const doc = db.getOrCreate('test', () => ({ test: 1 }));
        expect(db.get('test')?.doc).toBe(doc?.doc);
    });

    it('should merge two databases', () => {
        const db1 = new SimpleBase();
        const db2 = new SimpleBase();
        db1.set('test', { test: 1 });
        db2.set('test2', { test: 2 });
        db1.merge(db2);
        expect(db1.size).toBe(2);
    });

    it('should generate all documents', () => {
        const db = new SimpleBase();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        const docs = db.generate();
        expect(docs.next().value).toEqual({ test: 1 });
        expect(docs.next().value).toEqual({ test: 2 });
    });

    it('should be able to find a document', () => {
        const db = new SimpleBase<{test: number}>();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        const doc = db.find((doc) => doc.test === 1);
        expect(doc?.doc).toEqual({ test: 1 });

        const noDoc = db.find((doc) => doc.test === 3);
        expect(noDoc).toBeNull();
    })

    it('should be able to query documents', () => {
        const db = new SimpleBase<{test: number}>();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        const docs = db.query((doc) => doc.test === 1);
        expect(docs[0]?.doc).toEqual({ test: 1 });
    })

    it('should be able to reduce documents to a single output', () => {
        const db = new SimpleBase<{test: number}>();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        const result = db.reduce((prev, doc) => prev + doc.test, 0);
        expect(result).toBe(3);
    })

    it('should be able to map documents to a new output', () => {
        const db = new SimpleBase<{test: number}>();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        const result = db.map((doc) => doc.test);
        expect(result).toEqual([1, 2]);
    })

    it('should be able convert documents to array', () => {
        const db = new SimpleBase<{test: number}>();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        const result = db.toArray().map((doc) => doc.doc);
        expect(result).toEqual([{ test: 1 }, { test: 2 }]);
    })

    it('should be able to delete a document', () => {
        const db = new SimpleBase<{test: number}>();
        const doc = db.set('test', { test: 1 });
        doc.removeDoc();
        expect(db.size).toBe(0);
    });

    it('should be able to clear the database', () => {
        const db = new SimpleBase<{test: number}>();
        db.set('test', { test: 1 });
        db.set('test2', { test: 2 });
        db.clear();
        expect(db.size).toBe(0);
    });

    it('should be able to join databases on a key', () => {
        const db1 = new SimpleBase<{test: number}>();
        const db2 = new SimpleBase<{value: number}>();
        db1.set('test', { test: 1 });
        db2.set('test', { value: 1 });

        db1.set('test2', { test: 2 });
        db2.set('test2', { value: 2 });

        db1.set('test3', { test: 3 });
        db2.set('test3', { value: 3 });

        const joinedDocs = db1.join(db2, "test", "value");
        expect(joinedDocs[0]).toEqual({ test: 1, value: 1 });
        expect(joinedDocs[1]).toEqual({ test: 2, value: 2 });
        expect(joinedDocs[2]).toEqual({ test: 3, value: 3 });
    });
})
