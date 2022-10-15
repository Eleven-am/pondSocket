import { PondPath } from "../../../pondbase";
import { PondChain } from "../helpers/chainLambda";
import { PondRequest } from "../helpers/pondRequest";
import { PondResponse } from "../helpers/pondResponse";
declare type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
export declare type VerbRequest = (request: PondRequest, response: PondResponse) => void;
export declare function verbHandler(this: PondChain, path: PondPath, method: HTTPMethod, handler: VerbRequest): void;
export {};
