"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.busBoyManager = void 0;
var busboy_1 = __importDefault(require("busboy"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var _1 = require("./");
/**
 * @desc This function is used to handle the upload of files to the server.
 * @param req - The request object from the http server.
 * @param res - The response object from the http server.
 * @param props - The props for the busboy manager.
 */
var busBoyManager = function (req, res, props) {
    var busboyInstance = (0, busboy_1.default)({ headers: req.headers });
    var files = [];
    var fileCount = 0, finished = false;
    busboyInstance.on('file', function (filePath, file, upload) {
        var tmpFile = path_1.default.join(__dirname, path_1.default.basename(filePath));
        var writeStream = fs_1.default.createWriteStream(tmpFile);
        fileCount++;
        writeStream.on('finish', function () {
            files.push({
                name: upload.filename,
                tempPath: tmpFile,
                size: writeStream.bytesWritten,
                mimetype: upload.mimeType,
                filePath: filePath
            });
            fileCount--;
            if (finished && fileCount === 0) {
                res.status(200)
                    .json({
                    files: files.map(function (e) {
                        return {
                            name: e.name, size: e.size, mimetype: e.mimetype,
                        };
                    })
                });
                var message = new _1.UploadMessage(files);
                var broadcaster = props.broadcaster, event_1 = props.event, componentId = props.componentId, clientId = props.clientId;
                broadcaster.publish({ message: message, event: event_1, componentId: componentId, clientId: clientId });
            }
        });
        file.pipe(writeStream);
    });
    busboyInstance.on('finish', function () {
        finished = true;
    });
    req.pipe(busboyInstance);
};
exports.busBoyManager = busBoyManager;
