"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateUploader = void 0;
var busboy_1 = require("./busboy");
/**
 * @desc A middleware function that handles file uploads
 * @param validator - a function that validates the request
 * @param broadcaster - a broadcaster that broadcasts the upload events
 * @returns a middleware function
 */
var GenerateUploader = function (validator, broadcaster) { return function (req, res) {
    var _a = validator(req), valid = _a.valid, clientId = _a.clientId;
    var router = req.headers['x-router-path'];
    var event = req.headers['x-router-event'];
    if (!valid)
        return res.status(401).json({ error: 'Unauthorized' });
    if (!router || !event)
        return res.status(400).json({ error: 'Bad Request' });
    return (0, busboy_1.busBoyManager)(req, res, {
        broadcaster: broadcaster,
        event: event,
        componentId: router,
        clientId: clientId,
    });
}; };
exports.GenerateUploader = GenerateUploader;
