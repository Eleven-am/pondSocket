type NextFunction = () => void;

export type MiddlewareFunction<Request, Response> = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export class Middleware<Request, Response> {
    readonly #stack: MiddlewareFunction<Request, Response>[] = [];

    constructor (second?: Middleware<Request, Response>) {
        if (second) {
            this.#stack.push(...second.#stack);
        }
    }

    /**
     * @desc Adds a middleware function to the middleware stack
     * @param middleware - the middleware function to add
     */
    public use (middleware: MiddlewareFunction<Request, Response>) {
        this.#stack.push(middleware);
    }

    /**
     * @desc Runs the middleware stack
     * @param req - the request object
     * @param res - the response object
     * @param final - the final function to call
     */
    public run (req: Request, res: Response, final: NextFunction) {
        const temp = this.#stack.concat();

        const nextFunction = () => {
            const middleware = temp.shift();

            if (middleware) {
                middleware(req, res, nextFunction);
            } else {
                final();
            }
        };

        nextFunction();
    }

    /**
     * @desc Returns the middleware stack length
     */
    public get length () {
        return this.#stack.length;
    }
}
