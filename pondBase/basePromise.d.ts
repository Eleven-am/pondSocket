import { RejectPromise } from "./types";
export declare class PondError<T> implements RejectPromise<T> {
    errorMessage: string;
    errorCode: number;
    data: T;
    constructor(errorMessage: string, errorCode: number, data: T);
}
export declare function BasePromise<T, V>(data: V, callback: (resolve: (value: T) => void, reject: (((errorMessage: string, errorCode?: number) => void))) => void): Promise<T>;
