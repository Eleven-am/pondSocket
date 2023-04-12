import { NextFunction } from '../server/pondSocket';

export interface ResponseSent {
    responseSent: boolean;
}

export type MiddlewareFunction<Request, Resolve extends ResponseSent> = (req: Request, res: Resolve, next: NextFunction) => void | Promise<void>;

export class Middleware<Request, Resolve extends ResponseSent> {
    private readonly _stack: MiddlewareFunction<Request, Resolve>[] = [];

    constructor (second?: Middleware<Request, Resolve>) {
        if (second) {
            this._stack.push(...second._stack);
        }
    }

    /**
     * @desc Adds a middleware function to the middleware stack
     * @param middleware - the middleware function to add
     */
    public use (middleware: MiddlewareFunction<Request, Resolve>) {
        this._stack.push(middleware);
    }

    /**
     * @desc Runs the middleware stack
     * @param req - the request object
     * @param res - the response object
     * @param final - the final function to call
     */
    public run (req: Request, res: Resolve, final: NextFunction) {
        const temp = this._stack.concat();

        const nextFunction = () => {
            const middleware = temp.shift();

            if (middleware && !res.responseSent) {
                void middleware(req, res, nextFunction);
            } else if (!res.responseSent) {
                final();
            }
        };

        nextFunction();
    }
}
