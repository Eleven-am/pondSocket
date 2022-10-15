import { PondMiddleware } from "./chainLambda";
export interface StaticOptions {
    maxAge?: number;
    root: string;
    index?: string;
    redirect?: boolean;
    dotfiles?: 'allow' | 'deny' | 'ignore';
    etag?: boolean;
    extensions?: string[];
    immutable?: boolean;
    lastModified?: boolean;
}
export declare function staticMiddleware(options: StaticOptions): PondMiddleware;
