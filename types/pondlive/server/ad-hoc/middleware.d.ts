/// <reference types="node" />
import {Server} from "http";
import {BaseClass} from "../../../pondbase";
import {MiddleWareFunction, PondMiddleware} from "../helpers/chainLambda";

export declare class Middleware extends BaseClass {
    constructor(server: Server);

    get stack(): MiddleWareFunction[];

    useRaw(middleware: MiddleWareFunction): void;

    use(middleware: PondMiddleware): void;
}
