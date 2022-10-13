import {RejectPromise} from "./types";

export class PondError<T> implements RejectPromise<T> {
    errorMessage: string;
    errorCode: number;
    data: T;

    constructor(errorMessage: string, errorCode: number, data: T) {
        this.errorMessage = errorMessage;
        this.errorCode = errorCode;
        this.data = data;
    };
}

export function BasePromise<T, V>(data: V, callback: (resolve: (value: T) => void, reject: (((errorMessage: string, errorCode?: number) => void))) => void): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
        let validated = false;
        const myReject = (errorMessage: string, errorCode?: number) => {
            validated = true;
            reject(new PondError(errorMessage, errorCode || 500, data));
        }

        const myResolve = async (value: (T | PromiseLike<T>)) => {
            validated = true;
            resolve(value);
        }

        try {
            await callback(myResolve, myReject);
            if (!validated)
                reject(new PondError('Function did not resolve a Promise', 500, data));
        } catch (error: any) {
            if (error instanceof PondError)
                reject(error);

            else reject(new PondError(error.message, 500, data));
        }
    })
}
