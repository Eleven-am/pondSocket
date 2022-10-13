export type default_t<T = any> = Record<string, T>

export type PondPath = string | RegExp;

export interface RejectPromise<T> {
  errorMessage: string
  errorCode: number;
  data: T;
}
