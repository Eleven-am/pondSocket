"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondResponse = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var pondbase_1 = require("../../../pondbase");
var getContentType = function (extension) {
    switch (extension) {
        case '.html':
            return 'text/html';
        case '.js':
            return 'text/javascript';
        case '.css':
            return 'text/css';
        case '.json':
            return 'application/json';
        case '.png':
            return 'image/png';
        case '.jpg':
            return 'image/jpg';
        case '.wav':
            return 'audio/wav';
        default:
            return 'text/plain';
    }
};
var fileExist = function (filePath) {
    try {
        return fs_1.default.existsSync(filePath) && !fs_1.default.lstatSync(filePath).isDirectory();
    }
    catch (err) {
        return false;
    }
};
var PondResponse = /** @class */ (function () {
    function PondResponse(response) {
        this._responseSent = false;
        this._statusCode = 200;
        this._response = response;
    }
    Object.defineProperty(PondResponse.prototype, "response", {
        /**
         * @desc Get the underlying response
         */
        get: function () {
            return this._response;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @desc Send a json response
     * @param data - The data to send
     */
    PondResponse.prototype.json = function (data) {
        if (this._responseSent)
            throw new pondbase_1.PondError('Response already sent', 500, 'PondResponse');
        this._responseSent = true;
        this._response.writeHead(this._statusCode, {
            'Content-Type': 'application/json'
        });
        this._response.end(JSON.stringify(data));
    };
    /**
     * @desc Send a html response
     * @param data - The data to send
     */
    PondResponse.prototype.html = function (data) {
        if (this._responseSent)
            throw new pondbase_1.PondError('Response already sent', 500, 'PondResponse');
        this._responseSent = true;
        this._response.writeHead(this._statusCode, {
            'Content-Type': 'text/html'
        });
        this._response.end(data);
    };
    /**
     * #desc Redirect the client to another url
     * @param url - The url to redirect to
     */
    PondResponse.prototype.redirect = function (url) {
        if (this._responseSent)
            throw new pondbase_1.PondError('Response already sent', 500, 'PondResponse');
        this._responseSent = true;
        this._response.writeHead(302, {
            Location: url
        });
        this._response.end();
    };
    /**
     * @desc Set a header
     * @param key - The key of the header
     * @param value - The value of the header
     */
    PondResponse.prototype.setHeader = function (key, value) {
        this._response.setHeader(key, value);
        return this;
    };
    /**
     * @desc End the response
     */
    PondResponse.prototype.end = function () {
        this._responseSent = true;
        this._response.end();
    };
    /**
     * @desc Pipe a stream to the response
     * @param stream - The stream to pipe
     */
    PondResponse.prototype.pipe = function (stream) {
        this._responseSent = true;
        stream.pipe(this._response);
    };
    /**
     * @desc Set the status code of the response
     * @param code - The status code
     * @param message - The status message
     */
    PondResponse.prototype.status = function (code, message) {
        this._statusCode = code;
        this._response.writeHead(code, message);
        return this;
    };
    /**
     * @desc Given an absolute path, send the file to the client with the correct mime type
     * @param filePath - The path to the file
     */
    PondResponse.prototype.sendFile = function (filePath) {
        if (this._responseSent)
            throw new pondbase_1.PondError('Response already sent', 500, 'PondResponse');
        this._responseSent = true;
        if (!fileExist(filePath))
            throw new pondbase_1.PondError('File not found', 404, 'PondResponse');
        var extension = path_1.default.extname(filePath);
        var contentType = getContentType(extension);
        this.setHeader('Content-Type', contentType);
        var readStream = fs_1.default.createReadStream(filePath);
        readStream.on('error', function (err) {
            throw new pondbase_1.PondError(err, 500, 'PondResponse');
        });
        this.pipe(readStream);
    };
    /**
     * @desc Applies CORS headers to the response based on the provided options
     * @param options - The options to apply
     */
    PondResponse.prototype.applyCORS = function (options) {
        if (options.origin) {
            var origin_1 = typeof options.origin === 'string' ? options.origin : options.origin.join(',');
            this.setHeader('Access-Control-Allow-Origin', origin_1);
        }
        if (options.methods) {
            var methods = typeof options.methods === 'string' ? options.methods : options.methods.join(',');
            this.setHeader('Access-Control-Allow-Methods', methods);
        }
        if (options.allowedHeaders) {
            var allowedHeaders = typeof options.allowedHeaders === 'string' ? options.allowedHeaders : options.allowedHeaders.join(',');
            this.setHeader('Access-Control-Allow-Headers', allowedHeaders);
        }
        if (options.exposedHeaders) {
            var exposedHeaders = typeof options.exposedHeaders === 'string' ? options.exposedHeaders : options.exposedHeaders.join(',');
            this.setHeader('Access-Control-Expose-Headers', exposedHeaders);
        }
        if (options.credentials)
            this.setHeader('Access-Control-Allow-Credentials', 'true');
        if (options.maxAge)
            this.setHeader('Access-Control-Max-Age', options.maxAge.toString());
    };
    /**
     * @desc Set a cookie
     * @param name - The name of the cookie
     * @param value - The value of the cookie
     * @param options - The options to apply to the cookie
     */
    PondResponse.prototype.setCookie = function (name, value, options) {
        var cookie = "".concat(name, "=").concat(value);
        if (options) {
            if (options.path)
                cookie += "; Path=".concat(options.path);
            if (options.domain)
                cookie += "; Domain=".concat(options.domain);
            if (options.secure)
                cookie += "; Secure";
            if (options.httpOnly)
                cookie += "; HttpOnly";
            if (options.expires)
                cookie += "; Expires=".concat(options.expires.toUTCString());
            if (options.maxAge !== undefined)
                cookie += "; Max-Age=".concat(options.maxAge);
            if (options.sameSite)
                cookie += "; SameSite=".concat(options.sameSite);
        }
        this.setHeader('Set-Cookie', cookie);
    };
    /**
     * @desc Clear a cookie
     * @param name - The name of the cookie
     */
    PondResponse.prototype.clearCookie = function (name) {
        this.setCookie(name, '', {
            maxAge: 0
        });
    };
    return PondResponse;
}());
exports.PondResponse = PondResponse;
