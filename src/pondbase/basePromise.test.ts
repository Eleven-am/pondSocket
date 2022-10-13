import { BasePromise, PondError } from "./basePromise";

describe('BasePromise', () => {
    it('should resolve to a value T', async () => {
        const promise = BasePromise({}, (resolve, _reject) => {
            resolve(5);
        });

        const result = await promise;
        expect(result).toBe(5);
    });

    it('should reject to a PondError<V>', async () => {
        const promise = BasePromise({}, (_resolve, reject) => {
            reject('Something went wrong');
        });

        // because the stack is different on every machine, we can't test for it
        await expect(promise).rejects.toEqual(new PondError('Something went wrong', 500, {}));
    });

    it('should reject an error if the promise is not resolved or rejected', async () => {
        const promise = BasePromise({},(_resolve, _reject) => {});

        // because the stack is different on every machine, we can't test for it
        await expect(promise).rejects.toEqual(new PondError('Function did not resolve a Promise', 500, {}));
    });

    it('should always reject an instance of PondError', async () => {
        const promise = BasePromise({}, (_resolve, _reject) => {
            throw new Error('Something went wrong');
        });

        const promise2 = BasePromise({}, (_resolve, _reject) => {
            throw new PondError('Something went wrong', 500, {});
        })

        // because the stack is different on every machine, we can't test for it
        await expect(promise).rejects.toEqual(new PondError('Something went wrong', 500, {}));

        // because the stack is different on every machine, we can't test for it
        await expect(promise2).rejects.toEqual(new PondError('Something went wrong', 500, {}));
    });
});
