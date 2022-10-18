export declare type default_t<T = any> = Record<string, T>;
export declare type PondPath = string | RegExp;
export interface RejectPromise<T> {
    errorMessage: string;
    errorCode: number;
    data: T;
}
