"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketMiddleWare = void 0;
class SocketMiddleWare {
    constructor(server) {
        this.middleware = [];
        this._server = server;
        this._initMiddleware();
    }
    use(middleware) {
        this.middleware.push(middleware);
    }
    _execute(req, socket, head) {
        const temp = this.middleware.concat();
        const next = () => {
            const middleware = temp.shift();
            if (middleware)
                middleware(req, socket, head, next);
            else {
                socket.write('HTTP/1.1 400 Bad Request\r\n\r');
                socket.destroy();
            }
        };
        next();
    }
    _initMiddleware() {
        this._server.on('upgrade', (req, socket, head) => {
            this._execute(req, socket, head);
        });
    }
}
exports.SocketMiddleWare = SocketMiddleWare;
