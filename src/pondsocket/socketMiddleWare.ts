import { IncomingMessage, Server } from "http";
import internal from "stream";

export type NextFunction = () => void;

type SocketMiddlewareFunction = (req: IncomingMessage, socket: internal.Duplex, head: Buffer, next: NextFunction) => void;

export class SocketMiddleWare {
    private readonly _server: Server;
    private readonly middleware: SocketMiddlewareFunction[] = [];

    constructor(server: Server) {
        this._server = server;
        this._initMiddleware();
    }

    public use(middleware: SocketMiddlewareFunction) {
        this.middleware.push(middleware);
    }

    private _execute(req: IncomingMessage, socket: internal.Duplex, head: Buffer) {
        const temp = this.middleware.concat();
        const next = () => {
            const middleware = temp.shift();
            if (middleware)
                middleware(req, socket, head, next);

            else {
                socket.write('HTTP/1.1 400 Bad Request\r\n\r');
                socket.destroy();
            }
        }

        next();
    }

    private _initMiddleware() {
        this._server.on('upgrade', (req, socket, head) => {
            this._execute(req, socket, head);
        })
    }
}
