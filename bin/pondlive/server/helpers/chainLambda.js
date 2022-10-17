"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareHandler = void 0;
var pondRequest_1 = require("./pondRequest");
var pondResponse_1 = require("./pondResponse");
/**
 * @desc A middleware function that takes in PondMiddleware and returns a MiddleWareFunction
 * @param middlewares - The middleware function
 */
var chainLambda = function (middlewares) {
    return function (req, res, next) {
        var request = new pondRequest_1.PondRequest(req);
        var response = new pondResponse_1.PondResponse(res);
        var chain = middlewares.concat();
        var nextMiddleware = function () {
            var middleware = chain.shift();
            if (middleware)
                middleware(request, response, nextMiddleware);
            else
                next();
        };
        nextMiddleware();
    };
};
/**
 * @desc A middleware handler that takes in multiple PondMiddleware and returns a MiddleWareFunction
 * @constructor
 */
var MiddlewareHandler = function () {
    var middlewares = [];
    return {
        use: function (middleware) {
            middlewares.push(middleware);
        },
        chain: function () {
            return chainLambda(middlewares);
        }
    };
};
exports.MiddlewareHandler = MiddlewareHandler;
