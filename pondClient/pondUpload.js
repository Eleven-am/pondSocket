"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pondUploadInit = void 0;
var eventEmmiter_1 = require("./eventEmmiter");
var initUploadFile = function (routerPath, event, token, uploadPath) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", uploadPath);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader('x-csrf-token', token);
    xhr.setRequestHeader('x-router-request', 'true');
    xhr.setRequestHeader('x-router-path', routerPath);
    xhr.setRequestHeader('x-router-event', event);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            (0, eventEmmiter_1.emitEvent)("pond-upload-success", response);
        }
        else
            (0, eventEmmiter_1.emitEvent)("pond-upload-error", xhr.responseText);
    };
    xhr.onloadstart = function () { return (0, eventEmmiter_1.emitEvent)("pond-upload-start", {}); };
    xhr.onloadend = function () { return (0, eventEmmiter_1.emitEvent)("pond-upload-end", {}); };
    xhr.onprogress = function (e) {
        if (e.lengthComputable) {
            (0, eventEmmiter_1.emitEvent)("pond-upload-progress", {
                progress: Math.round((e.loaded / e.total) * 100),
            });
        }
    };
    return xhr;
};
var addFileListener = function (file, identifier, path, event, routerPath, channel) {
    var sub = channel.onMessage(function (evt, message) {
        if (evt === "pondUploadToken" && message.token && message.identifier === identifier && message.uploadPath) {
            sub.unsubscribe();
            var xhr = initUploadFile(routerPath, event, message.token, message.uploadPath);
            var formData = new FormData();
            formData.append(path, file, file.name);
            xhr.send(formData);
        }
        else if (evt === "pondUploadError" && message.identifier === identifier) {
            sub.unsubscribe();
            (0, eventEmmiter_1.emitEvent)("pond-upload-error", message.error);
        }
    });
    return sub;
};
var pathFilesFromFileList = function (fileList) {
    var files = [];
    if (!fileList)
        return files;
    for (var i = 0; i < fileList.length; i++)
        files.push({ path: "/".concat(fileList[i].name), file: fileList[i] });
    return files;
};
var pathFilesFromDataTransferItemList = function (items) {
    return new Promise(function (resolve) { return __awaiter(void 0, void 0, void 0, function () {
        var rawFiles, i, item, promises, files;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rawFiles = [];
                    for (i = 0; i < items.length; i++) {
                        item = items[i].webkitGetAsEntry();
                        if (item)
                            rawFiles.push(item);
                    }
                    promises = rawFiles.map(function (file) { return getFilesFromTree(file); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    files = _a.sent();
                    resolve(files.flat());
                    return [2 /*return*/];
            }
        });
    }); });
};
var getFilesFromTree = function (item, path) {
    if (path === void 0) { path = '/'; }
    return new Promise(function (resolve) {
        if (item.isFile) {
            var file = item;
            file.file(function (file) {
                var filePath = "".concat(path).concat(file.name);
                resolve([{ path: filePath, file: file }]);
            });
        }
        else if (item.isDirectory) {
            var directory_1 = item;
            var reader = directory_1.createReader();
            var files_1 = [];
            reader.readEntries(function (entries) { return __awaiter(void 0, void 0, void 0, function () {
                var i, entry, filePath, file;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < entries.length)) return [3 /*break*/, 4];
                            entry = entries[i];
                            filePath = "".concat(path).concat(directory_1.name, "/");
                            return [4 /*yield*/, getFilesFromTree(entry, filePath)];
                        case 2:
                            file = _a.sent();
                            files_1.push.apply(files_1, __spreadArray([], __read(file), false));
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4:
                            resolve(files_1);
                            return [2 /*return*/];
                    }
                });
            }); });
        }
    });
};
var uploadBatch = function (batch, channel, routerPath, event) { return __awaiter(void 0, void 0, void 0, function () {
    var files, subs, longRandom, sub, metaData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                files = [];
                subs = [];
                longRandom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                if (!(batch instanceof DataTransferItemList)) return [3 /*break*/, 2];
                return [4 /*yield*/, pathFilesFromDataTransferItemList(batch)];
            case 1:
                files = _a.sent();
                return [3 /*break*/, 3];
            case 2:
                if (batch instanceof FileList)
                    files = pathFilesFromFileList(batch);
                _a.label = 3;
            case 3:
                sub = channel.onMessage(function (evt, message) {
                    if (evt === "pondUploadToken" && message.token && message.identifier === longRandom && message.uploadPath) {
                        sub.unsubscribe();
                        subs.forEach(function (sub) { return sub.unsubscribe(); });
                        var xhr = initUploadFile(routerPath, event, message.token, message.uploadPath);
                        var formData_1 = new FormData();
                        files.forEach(function (file) { return formData_1.append(file.path, file.file, file.file.name); });
                        xhr.send(formData_1);
                    }
                    else if (evt === "pondUploadError" && message.identifier === longRandom) {
                        sub.unsubscribe();
                        subs.forEach(function (sub) { return sub.unsubscribe(); });
                        (0, eventEmmiter_1.emitEvent)("pond-upload-error", message.error);
                    }
                });
                metaData = files.map(function (file) {
                    var meta = getMetaData(file.file)[0];
                    var identifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    subs.push(addFileListener(file.file, identifier, file.path, event, routerPath, channel));
                    return {
                        name: meta.name,
                        size: meta.size,
                        type: meta.type,
                        identifier: identifier,
                        lastModified: meta.lastModified,
                        lastModifiedDate: meta.lastModifiedDate,
                    };
                });
                return [2 /*return*/, { metaData: metaData, longRandom: longRandom }];
        }
    });
}); };
var getMetaData = function (file) {
    var metaData = [];
    if (file instanceof FileList)
        for (var i = 0; i < file.length; i++)
            metaData.push({
                name: file[i].name,
                size: file[i].size,
                type: file[i].type,
                lastModified: file[i].lastModified,
                lastModifiedDate: new Date(file[i].lastModified),
            });
    else if (file instanceof File)
        metaData.push({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            lastModifiedDate: new Date(file.lastModified),
        });
    return metaData;
};
var pondFile = function (handler) {
    handler('[pond-file]', 'change', function (_, element) {
        var input = element;
        var files = input.files;
        if (files) {
            var metaData = getMetaData(files);
            return {
                value: null,
                files: metaData,
            };
        }
        return null;
    });
};
var pondUpload = function (channel, handler) {
    handler('[pond-upload]', 'submit', function (event, form, routerPath, eventType) { return __awaiter(void 0, void 0, void 0, function () {
        var file, files, _a, metaData, longRandom;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    event.preventDefault();
                    file = form.querySelector('input[type="file"]');
                    files = file.files;
                    if (!files) return [3 /*break*/, 2];
                    return [4 /*yield*/, uploadBatch(files, channel, routerPath, eventType)];
                case 1:
                    _a = _b.sent(), metaData = _a.metaData, longRandom = _a.longRandom;
                    return [2 /*return*/, {
                            value: null,
                            files: metaData,
                            event: "".concat(routerPath, "/upload/token"),
                            metadata: {
                                identifier: longRandom,
                                type: 'UPLOAD_REQUEST'
                            }
                        }];
                case 2: return [2 /*return*/, null];
            }
        });
    }); });
};
var pondDrop = function (channel, handler) {
    handler('[pond-drop-upload]', 'drop', function (event, _, routerPath, eventType) { return __awaiter(void 0, void 0, void 0, function () {
        var files, _a, metaData, longRandom;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    files = (_b = event.dataTransfer) === null || _b === void 0 ? void 0 : _b.items;
                    if (!files) return [3 /*break*/, 2];
                    return [4 /*yield*/, uploadBatch(files, channel, routerPath, eventType)];
                case 1:
                    _a = _c.sent(), metaData = _a.metaData, longRandom = _a.longRandom;
                    return [2 /*return*/, {
                            value: null,
                            files: metaData,
                            event: "".concat(routerPath, "/upload/token"),
                            metadata: {
                                identifier: longRandom,
                                type: 'UPLOAD_REQUEST'
                            }
                        }];
                case 2: return [2 /*return*/, null];
            }
        });
    }); });
};
var pondUploadInit = function (channel, handler) {
    pondFile(handler);
    pondUpload(channel, handler);
    pondDrop(channel, handler);
};
exports.pondUploadInit = pondUploadInit;
