"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.busBoyManager = void 0;
var busboy_1 = __importDefault(require("busboy"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var UploadMessage_1 = require("./UploadMessage");
var os = __importStar(require("os"));
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
    busboyInstance.on('file', function (_, file, upload) {
        var tmpFile = path_1.default.join(os.tmpdir(), path_1.default.basename(upload.filename));
        var writeStream = fs_1.default.createWriteStream(tmpFile);
        fileCount++;
        writeStream.on('finish', function () {
            files.push({
                name: upload.filename, tempPath: tmpFile, size: writeStream.bytesWritten, mimetype: upload.mimeType,
            });
            fileCount--;
            if (finished && fileCount === 0) {
                res.status(200, 'OK')
                    .json({
                    files: files.map(function (e) {
                        return {
                            name: e.name, size: e.size, mimetype: e.mimetype,
                        };
                    })
                });
                var message = new UploadMessage_1.UploadMessage(files);
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
