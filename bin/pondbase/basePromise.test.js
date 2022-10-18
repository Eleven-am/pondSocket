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
Object.defineProperty(exports, "__esModule", { value: true });
var basePromise_1 = require("./basePromise");
describe('BasePromise', function () {
    it('should resolve to a value T', function () { return __awaiter(void 0, void 0, void 0, function () {
        var promise, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promise = (0, basePromise_1.BasePromise)({}, function (resolve, _reject) {
                        resolve(5);
                    });
                    return [4 /*yield*/, promise];
                case 1:
                    result = _a.sent();
                    expect(result).toBe(5);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should reject to a PondError<V>', function () { return __awaiter(void 0, void 0, void 0, function () {
        var promise;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promise = (0, basePromise_1.BasePromise)({}, function (_resolve, reject) {
                        reject('Something went wrong');
                    });
                    // because the stack is different on every machine, we can't test for it
                    return [4 /*yield*/, expect(promise).rejects.toEqual(new basePromise_1.PondError('Something went wrong', 500, {}))];
                case 1:
                    // because the stack is different on every machine, we can't test for it
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should reject an error if the promise is not resolved or rejected', function () { return __awaiter(void 0, void 0, void 0, function () {
        var promise;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promise = (0, basePromise_1.BasePromise)({}, function (_resolve, _reject) {
                    });
                    // because the stack is different on every machine, we can't test for it
                    return [4 /*yield*/, expect(promise).rejects.toEqual(new basePromise_1.PondError('Function did not resolve a Promise', 500, {}))];
                case 1:
                    // because the stack is different on every machine, we can't test for it
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should always reject an instance of PondError', function () { return __awaiter(void 0, void 0, void 0, function () {
        var promise, promise2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promise = (0, basePromise_1.BasePromise)({}, function (_resolve, _reject) {
                        throw new Error('Something went wrong');
                    });
                    promise2 = (0, basePromise_1.BasePromise)({}, function (_resolve, _reject) {
                        throw new basePromise_1.PondError('Something went wrong', 500, {});
                    });
                    // because the stack is different on every machine, we can't test for it
                    return [4 /*yield*/, expect(promise).rejects.toEqual(new basePromise_1.PondError('Something went wrong', 500, {}))];
                case 1:
                    // because the stack is different on every machine, we can't test for it
                    _a.sent();
                    // because the stack is different on every machine, we can't test for it
                    return [4 /*yield*/, expect(promise2).rejects.toEqual(new basePromise_1.PondError('Something went wrong', 500, {}))];
                case 2:
                    // because the stack is different on every machine, we can't test for it
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
