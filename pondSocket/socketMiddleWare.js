"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketMiddleWare = void 0;
var SocketMiddleWare = /** @class */ (function () {
    function SocketMiddleWare(server) {
        this.middleware = [];
        this._server = server;
        this._initMiddleware();
    }
    SocketMiddleWare.prototype.use = function (middleware) {
        this.middleware.push(middleware);
    };
    SocketMiddleWare.prototype._execute = function (req, socket, head) {
        var temp = this.middleware.concat();
        var next = function () {
            var middleware = temp.shift();
            if (middleware)
                middleware(req, socket, head, next);
            else {
                socket.write('HTTP/1.1 400 Bad Request\r\n\r');
                socket.destroy();
            }
        };
        next();
    };
    SocketMiddleWare.prototype._initMiddleware = function () {
        var _this = this;
        this._server.on('upgrade', function (req, socket, head) {
            _this._execute(req, socket, head);
        });
    };
    return SocketMiddleWare;
}());
exports.SocketMiddleWare = SocketMiddleWare;
