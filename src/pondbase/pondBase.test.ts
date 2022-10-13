import { PondBase } from "./pondBase"
import {PondBaseActions} from "./enums";
import {PondError} from "./basePromise";

describe('PondBase', () => {
    it('should be defined', () => {
        expect(PondBase).toBeDefined()
    })

    it('should be a class', () => {
        expect(PondBase).toBeInstanceOf(Function)
    });

    it('should have a set method', () => {
        expect(new PondBase().set).toBeDefined()
    })

    it('should have a get method', () => {
        expect(new PondBase().get).toBeDefined()
    })

    it('should have a generate method', () => {
        expect(new PondBase().generate).toBeDefined()
    })

    it('should have a query method', () => {
        expect(new PondBase().query).toBeDefined()
    })

    it('should have a subscribe method', () => {
        expect(new PondBase().subscribe).toBeDefined()
    })

    it('should have a size getter', () => {
        expect(new PondBase().size).toBeDefined()
    })

    // Functionality tests

    it('should set and get a value', () => {
        const pond = new PondBase<string>();
        const doc = pond.set('bar') // one value set

        expect(pond.get(doc.id)?.doc).toBe('bar');
        expect(pond.get(doc.id)?.doc).toEqual(doc.doc);
        expect(pond.size).toBe(1);

        doc.removeDoc() // the value removed from the pond
        expect(pond.size).toBe(0);
        expect(pond.get(doc.id)).toBeNull();
    })

    it('should set and get a value', () => {
        const pond = new PondBase()
        const doc = pond.set('bar') // multiple value set
        const doc2 = pond.set('foo')
        const doc3 = pond.set('baz')

        expect(pond.get(doc.id)?.doc).toBe('bar');
        expect(pond.get(doc.id)?.doc).toEqual(doc.doc);

        expect(pond.get(doc2.id)?.doc).toBe('foo');
        expect(pond.get(doc2.id)?.doc).toEqual(doc2.doc);

        expect(pond.get(doc3.id)?.doc).toBe('baz');
        expect(pond.get(doc3.id)?.doc).toEqual(doc3.doc);

        expect(pond.size).toBe(3);
        doc.removeDoc() // the value removed from the pond

        expect(pond.size).toBe(2);
        expect(pond.get(doc.id)).toBeNull();

        expect(pond.get(doc2.id)?.doc).toBe('foo');
        expect(pond.get(doc3.id)?.doc).toBe('baz');
    })

    it('should call a subscriber when a value is set', () => {
        const pond = new PondBase()
        const mock = jest.fn()
        pond.subscribe(mock)
        pond.set('bar')
        expect(mock).toBeCalled()
    })

    it('should return an array of matching values when queried', () => {
        const pond = new PondBase<string>()
        const one = pond.set('bar')
        const two = pond.set('barman')
        pond.set('dog')
        pond.set('chips')

        // because the docs include functions we need to use JSON.stringify to compare the values
        expect(JSON.stringify(pond.query(doc => doc.startsWith('bar'))))
            .toStrictEqual(JSON.stringify([one, two]))
    })

    it('should yield a new value when generate is called', () => {
        const pond = new PondBase<number>()
        pond.set(1)
        pond.set(2)
        pond.set(3)
        pond.set(4)

        expect(pond.generate().next().value).toEqual(1)
    })

    it('should return null if a value is not found', () => {
        const pond = new PondBase()
        expect(pond.get('foo')).toBe(null)
    })

    it('should return an array of all the values in the pond', () => {
        const pond = new PondBase()
        pond.set('bar')
        pond.set('barman')
        pond.set('dog')
        pond.set('chips')

        expect(pond.toArray().map(a => a.doc)).toEqual(['bar', 'barman', 'dog', 'chips'])
    })

    it('should return the accurate size of the pond', () => {
        const pond = new PondBase()
        expect(pond.size).toBe(0)

        pond.set('bar')
        pond.set('barman')

        expect(pond.size).toBe(2)

        pond.set('dog')
        pond.set('chips')

        expect(pond.size).toEqual(4)
    })

    it('should allow subscriptions to the pond that return a function to unsubscribe', () => {
        const pond = new PondBase()
        const mock = jest.fn()
        const sub = pond.subscribe(mock)
        pond.set('bar')
        expect(mock).toBeCalled()
        sub.unsubscribe()
        pond.set('baz')
        expect(mock).toBeCalledTimes(1)
    })

    it('should allow subscriptions to the pond that return a function to unsubscribe 2', (done) => {
        const pond = new PondBase<string>()
        pond.set('bar')
        pond.set('chips')

        function subscriber(data: string[], data2: string | null, action: PondBaseActions) {
            try {
                expect(data).toEqual(["bar", "chips", "dog"])
                expect(data2).toEqual('dog')
                expect(action).toEqual(PondBaseActions.ADD_TO_POND)
                done()
            } catch (error) {
                done(error)
            }
        }

        pond.subscribe(subscriber)
        pond.set('dog')
    })

    it('should allow subscriptions to the pond that return a function to unsubscribe 3', (done) => {
        const pond = new PondBase<string>()
        const baseUnset = pond.set('bar')
        pond.set('chips')

        function subscriber(data: string[], data2: string | null, action: PondBaseActions) {
            try {
                expect(data).toEqual(["chips"])
                expect(data2).toEqual(null)
                expect(action).toEqual(PondBaseActions.REMOVE_FROM_POND)
                done()
            } catch (error) {
                done(error)
            }
        }

        pond.subscribe(subscriber)
        baseUnset.removeDoc()
    })

    it('should allow subscriptions to the pond that return a function to unsubscribe 4', (done) => {
        const pond = new PondBase<string>()
        pond.set('bar')
        const val = pond.set('chips')

        function subscriber(data: string[], data2: string | null, action: PondBaseActions) {
            try {
                expect(data).toEqual(["bar", "dog"])
                expect(data2).toEqual('dog')
                expect(action).toEqual(PondBaseActions.UPDATE_IN_POND)
                done()
            } catch (error) {
                done(error)
            }
        }

        pond.subscribe(subscriber)
        val.updateDoc('dog')
    })

    it('should clear all data from the pond', () => {
        const pond = new PondBase()
        pond.set('bar')
        pond.set('chips')
        pond.clear()
        expect(pond.size).toBe(0)
    })

    it('should map the pond to a new array of values', () => {
        const pond = new PondBase<string>()
        pond.set('bar')
        pond.set('chips')
        pond.set('dog')

        const mapped = pond.map(doc => doc.toUpperCase())
        expect(mapped).toEqual(['BAR', 'CHIPS', 'DOG'])
    })

    it('should be able to find a value in the pond', () => {
        const pond = new PondBase<string>()
        pond.set('bar')
        pond.set('chips')
        pond.set('dog')

        const found = pond.find(doc => doc.startsWith('c'))
        expect(found?.doc).toEqual('chips')
        const notFound = pond.find(doc => doc.startsWith('z'))
        expect(notFound).toBeNull()
    })

    it('should be able to query the pond for values by their keys', () => {
        const pond = new PondBase<string>()
        pond.set('bar')
        const val = pond.set('chips')
        pond.set('dog')

        const found = pond.queryByKeys([val.id])
        expect(JSON.stringify(found)).toEqual(JSON.stringify([val]))
    })

    it('should be able to create a document in the pond', () => {
        const pond = new PondBase<string>()
        let docId = '';
        const doc = pond.createDocument(doc1 => {
            docId = doc1.id
            return 'bar'
        })

        expect(doc.doc).toEqual('bar');
        expect(doc.id).toEqual(docId);

        const doc2 = pond.createDocument(_doc1 => {
            return 'bar'
        })

        expect(doc2.id).not.toEqual(docId);
        expect(doc2.doc).toEqual('bar');

        expect(pond.size).toEqual(2);

        doc2.removeDoc();
        expect(pond.size).toEqual(1);
        expect(pond.get(doc2.id)).toBeNull();
    })

    it('should update a document in the pond', () => {
        const pond = new PondBase<string>()
        const temp = pond.set('temp')
        const chips = pond.set('chips')
        pond.set('dog')

        const doc = pond.createDocument(_doc1 => {
            return 'bar'
        })

        doc.updateDoc('baz');
        chips.updateDoc('chips2');
        pond.update(temp.id, 'temp2');

        expect(pond.get(doc.id)?.doc).toEqual('baz');
        expect(pond.get(chips.id)?.doc).toEqual('chips2');
        expect(pond.get(temp.id)?.doc).toEqual('temp2');

        expect(() => pond.update('not-a-real-id', 'temp2')).toThrowError(PondError);
    })

    it('should be capable of merging one pond base into another', () => {
        const pond1 = new PondBase<string>()
        pond1.set('bar')
        pond1.set('chips')
        pond1.set('dog')

        const pond2 = new PondBase<string>()
        pond2.set('bar')
        pond2.set('chips')
        pond2.set('dog')

        pond1.merge(pond2)

        expect(pond1.size).toEqual(6)
        expect(pond2.size).toEqual(3)

        expect(pond1.toArray().map(c => c.doc)).toEqual(['bar', 'chips', 'dog', 'bar', 'chips', 'dog'])
    })

    it('should be capable of querying the data by id', () => {
        const pond = new PondBase<string>()
        pond.set('bar')
        const doc = pond.set('chips')
        pond.set('dog')

        expect(pond.get(doc.id)?.doc).toEqual('chips');
        expect(pond.get('not-a-real-id')).toBeNull();
        // Used JSON.stringify to compare the arrays because the order of the array is not guaranteed
        // Also each doc contains bound functions that could be different
        expect(JSON.parse(JSON.stringify(pond.queryById(c => c === doc.id)))).toStrictEqual(JSON.parse(JSON.stringify([doc])));
        expect(pond.queryById(c => c === 'not-a-real-id')).toEqual([]);
    })

    it('should be able to reduce the pond to a single value', () => {
        const pond = new PondBase<string>()
        pond.set('bar')
        pond.set('chips')
        pond.set('dog')

        const reduced = pond.reduce((acc, doc) => acc + doc, '')
        expect(reduced).toEqual('barchipsdog')
    })
})
