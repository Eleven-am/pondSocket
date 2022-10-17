"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePondLiveUploader = void 0;
var pondResponse_1 = require("../helpers/pondResponse");
var authoriseUploads_1 = require("./authoriseUploads");
var busboy_1 = require("./busboy");
/**
 * @desc A middleware function that handles file uploads
 * @param req - the request object
 * @param res - the response object
 * @param next - the next function
 * @param validator - a function that validates the request
 * @param broadcaster - a broadcaster that broadcasts the upload events
 */
var uploadPondLiveRequest = function (req, res, next, validator, broadcaster) {
    if (req.method === 'POST' && req.url === '/pondLive/upload') {
        var _a = validator(req), valid = _a.valid, clientId = _a.clientId;
        var response = new pondResponse_1.PondResponse(res);
        var router = req.headers['x-router-path'];
        var event_1 = req.headers['x-router-event'];
        if (!valid) {
            return response.status(401, 'Unauthorized')
                .json({ error: 'Unauthorized' });
        }
        if (!router || !event_1) {
            return response.status(400, 'Bad Request')
                .json({ error: 'Bad Request' });
        }
        return (0, busboy_1.busBoyManager)(req, response, {
            broadcaster: broadcaster,
            event: event_1,
            componentId: router,
            clientId: clientId,
        });
    }
    next();
};
/**
 * @desc Creates a new upload middleware and wraps it around the existing middleware function
 * @param pondLiveMiddleware - the pond live middleware
 * @param props - the props to be used by the middleware
 */
var generatePondLiveUploader = function (pondLiveMiddleware, props) {
    var validateUpload = (0, authoriseUploads_1.authoriseUploader)(props.authorizer);
    return function (req, res, next) {
        uploadPondLiveRequest(req, res, function () {
            pondLiveMiddleware(req, res, next);
        }, validateUpload, props.broadcaster);
    };
};
exports.generatePondLiveUploader = generatePondLiveUploader;
