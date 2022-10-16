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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadMessage = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var UploadMessage = /** @class */ (function () {
    function UploadMessage(files) {
        this._files = files;
    }
    Object.defineProperty(UploadMessage.prototype, "files", {
        get: function () {
            var _this = this;
            return this._files.map(function (e) { return _this._createPondFile(e); });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Accepts the file and moves it to the specified directory
     * @param file - The file to accept
     * @param directory - The directory to move the file to
     */
    UploadMessage.prototype._acceptFile = function (file, directory) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._folderExists(directory)];
                    case 1:
                        if (!!(_a.sent())) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._createFolder(directory)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this._moveFile(file, directory)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @desc Checks if the folder exists
     * @param directory - The directory to check
     * @private
     */
    UploadMessage.prototype._folderExists = function (directory) {
        return new Promise(function (resolve, _reject) {
            fs_1.default.access(directory, fs_1.default.constants.F_OK, function (err) {
                if (err)
                    return resolve(false);
                return resolve(true);
            });
        });
    };
    /**
     * @desc Creates the folder
     * @param directory - The directory to create
     * @private
     */
    UploadMessage.prototype._createFolder = function (directory) {
        return new Promise(function (resolve, reject) {
            fs_1.default.mkdir(directory, function (err) {
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    };
    /**
     * @desc Moves the file to the specified directory
     * @param file - The file to move
     * @param directory - The directory to move the file to
     * @private
     */
    UploadMessage.prototype._moveFile = function (file, directory) {
        return new Promise(function (resolve, reject) {
            var filePath = path_1.default.join(directory, file.name);
            fs_1.default.rename(file.tempPath, filePath, function (err) {
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    };
    /**
     * \desc Deletes the file from the temporary directory
     * @param file - The file to delete
     * @private
     */
    UploadMessage.prototype._deleteFile = function (file) {
        return new Promise(function (resolve, reject) {
            fs_1.default.unlink(file.tempPath, function (err) {
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    };
    /**
     * @desc Creates a pond file from the file upload
     * @param file - The file to create the pond file from
     * @private
     */
    UploadMessage.prototype._createPondFile = function (file) {
        var _this = this;
        return {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype,
            destroy: function () { return _this._deleteFile(file); },
            move: function (directory) { return _this._acceptFile(file, directory); },
        };
    };
    return UploadMessage;
}());
exports.UploadMessage = UploadMessage;
