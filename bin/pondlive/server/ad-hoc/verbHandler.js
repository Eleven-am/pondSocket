"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verbHandler = void 0;
var pondbase_1 = require("../../../pondbase");
function verbHandler(path, method, handler) {
    var base = new pondbase_1.BaseClass();
    this.use(function (request, response, next) {
        if (method === request.method) {
            var resolver = base.generateEventRequest(path, request.url || '');
            if (resolver) {
                request.data = resolver;
                return handler(request, response);
            }
        }
        next();
    });
}
exports.verbHandler = verbHandler;
