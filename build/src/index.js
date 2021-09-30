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
exports.got = exports.Server = void 0;
var main_1 = require("./util/main");
var events_1 = require("events");
var form_data_encoder_1 = require("form-data-encoder");
var uuid_1 = require("uuid");
var pubsub_js_1 = __importDefault(require("pubsub-js"));
var url_1 = require("url");
exports.Server = new main_1.Proxy();
var validMethods = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "HEAD",
    "DELETE",
    "OPTIONS",
    "TRACE",
    "get",
    "post",
    "put",
    "patch",
    "head",
    "delete",
    "options",
    "trace",
];
var got = function (method, url, options, responseEmitter, redirects) {
    if (responseEmitter === void 0) { responseEmitter = null; }
    if (redirects === void 0) { redirects = 0; }
    return __awaiter(void 0, void 0, void 0, function () {
        var init, timeWaited, baseUrl, id, request, hasContentType, encoder, cookieString;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    method = method.toUpperCase();
                    init = false;
                    if (!responseEmitter) {
                        init = true;
                        responseEmitter = new events_1.EventEmitter();
                    }
                    timeWaited = 0;
                    _a.label = 1;
                case 1:
                    if (!!exports.Server.isConnected) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, main_1.sleep)(100)];
                case 2:
                    (_a.sent()) && (timeWaited += 100);
                    if (timeWaited > 10000) {
                        responseEmitter.emit("error", "Proxy Client Took Too Long To Connect!");
                    }
                    return [3 /*break*/, 1];
                case 3:
                    /**
                     * Check if the request method is valid
                     */
                    if (!validMethods.includes(method)) {
                        responseEmitter.emit("error", "Request Method " + method + " Is Not Supported");
                    }
                    /**
                     * Check if the request url is valid
                     */
                    if (typeof url === "string" && url === "") {
                        responseEmitter.emit("error", "Request Url " + url + " Is Not Valid");
                    }
                    if (!url.includes("https://") && !url.includes("http://")) {
                        responseEmitter.emit("error", "Request Protocol Not Found! e.g http:// https://");
                    }
                    baseUrl = (0, main_1.getBaseUrl)(url);
                    if (options.cookieJar && typeof baseUrl === "string" && baseUrl === "") {
                        responseEmitter.emit("error", "Cookie Domain Cannot Be Resolved With Url " + url);
                    }
                    id = (0, uuid_1.v4)();
                    request = {
                        id: id,
                        method: method,
                        url: url,
                        headers: options.headers,
                        debug: options.debug,
                    };
                    hasContentType = options.headers["content-type"] || options.headers["Content-Type"];
                    if (options.json) {
                        if (!hasContentType) {
                            options.headers["content-type"] = "application/json";
                        }
                        request.body = JSON.stringify(options.json);
                    }
                    else if (options.body) {
                        if ((0, form_data_encoder_1.isFormDataLike)(options.body)) {
                            encoder = new form_data_encoder_1.FormDataEncoder(options.body);
                            if (!hasContentType) {
                                options.headers["content-type"] = encoder.headers["Content-Type"];
                            }
                            request.body = encoder.encode().toString();
                        }
                    }
                    else if (options.form) {
                        if (!hasContentType) {
                            options.headers["content-type"] = "application/x-www-form-urlencoded";
                            request.body = new url_1.URLSearchParams(options.form).toString();
                        }
                    }
                    if (options.redirect) {
                        request.redirect = options.redirect;
                    }
                    if (options.timeout) {
                        request.timeout = options.timeout;
                    }
                    if (options.proxy) {
                        request.proxy = options.proxy;
                    }
                    if (!options.cookieJar) return [3 /*break*/, 5];
                    return [4 /*yield*/, options.cookieJar.getCookieString(baseUrl)];
                case 4:
                    cookieString = _a.sent();
                    if (cookieString != "") {
                        request.headers.cookie = cookieString;
                    }
                    _a.label = 5;
                case 5:
                    pubsub_js_1.default.subscribe(id, function (msg, data) { return __awaiter(void 0, void 0, void 0, function () {
                        var finalHeaders, _a, _b, _i, header, promises, error_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (!data.success) return [3 /*break*/, 11];
                                    if (!data.headers) return [3 /*break*/, 10];
                                    finalHeaders = {};
                                    _a = [];
                                    for (_b in data.headers)
                                        _a.push(_b);
                                    _i = 0;
                                    _c.label = 1;
                                case 1:
                                    if (!(_i < _a.length)) return [3 /*break*/, 9];
                                    header = _a[_i];
                                    if (!(header === "Set-Cookie" &&
                                        typeof header === "object" &&
                                        Array.isArray(data.headers["Set-Cookie"]))) return [3 /*break*/, 7];
                                    if (!options.cookieJar) return [3 /*break*/, 6];
                                    promises = data.headers["Set-Cookie"].map(function (rawCookie) { return __awaiter(void 0, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            return [2 /*return*/, options.cookieJar.setCookie(rawCookie, url.toString())];
                                        });
                                    }); });
                                    _c.label = 2;
                                case 2:
                                    _c.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, Promise.all(promises)];
                                case 3:
                                    _c.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_1 = _c.sent();
                                    return [3 /*break*/, 5];
                                case 5:
                                    finalHeaders["Set-Cookie"] = data.headers["Set-Cookie"].join(",");
                                    _c.label = 6;
                                case 6: return [3 /*break*/, 8];
                                case 7:
                                    finalHeaders[header] = data.headers[header][0];
                                    _c.label = 8;
                                case 8:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 9:
                                    data.headers = finalHeaders;
                                    _c.label = 10;
                                case 10:
                                    /**
                                     * Here we handle the response if the status code is a redirect one
                                     * and there is a location header we redirect else we return the response
                                     */
                                    if (data.statusCode >= 300 &&
                                        data.statusCode < 400 &&
                                        data.headers["Location"]) {
                                        responseEmitter === null || responseEmitter === void 0 ? void 0 : responseEmitter.emit("redirect", data.headers["Location"]);
                                    }
                                    else {
                                        responseEmitter === null || responseEmitter === void 0 ? void 0 : responseEmitter.emit("end", data);
                                    }
                                    return [3 /*break*/, 12];
                                case 11:
                                    responseEmitter === null || responseEmitter === void 0 ? void 0 : responseEmitter.emit("error", data.message);
                                    _c.label = 12;
                                case 12: return [2 /*return*/];
                            }
                        });
                    }); });
                    exports.Server.client.send(JSON.stringify(request));
                    /**
                     * handle redirect and pass in the initial response emitter and
                     * redirect count to enforce max redirect limit
                     */
                    responseEmitter.on("redirect", function (data) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            redirects = redirects + 1;
                            if (redirects >= 20) {
                                responseEmitter === null || responseEmitter === void 0 ? void 0 : responseEmitter.emit("error", "Too Many Redirects Error");
                            }
                            else {
                                (0, exports.got)("GET", data, options, responseEmitter, redirects);
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    if (init) {
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                responseEmitter === null || responseEmitter === void 0 ? void 0 : responseEmitter.on("end", function (data) {
                                    pubsub_js_1.default.unsubscribe(data.id);
                                    resolve(data);
                                });
                                responseEmitter === null || responseEmitter === void 0 ? void 0 : responseEmitter.on("error", function (err) {
                                    reject(new Error(err));
                                });
                            })];
                    }
                    else {
                        return [2 /*return*/, {
                                id: "",
                                method: "",
                                statusCode: 0,
                                url: "",
                                headers: {},
                                body: "",
                                success: false,
                                message: "",
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
};
exports.got = got;
exports.got.head = function (url, options) {
    return (0, exports.got)("head", url, options);
};
exports.got.get = function (url, options) {
    return (0, exports.got)("get", url, options);
};
exports.got.post = function (url, options) {
    return (0, exports.got)("post", url, options);
};
exports.got.put = function (url, options) {
    return (0, exports.got)("put", url, options);
};
exports.got.delete = function (url, options) {
    return (0, exports.got)("delete", url, options);
};
exports.got.trace = function (url, options) {
    return (0, exports.got)("trace", url, options);
};
exports.got.options = function (url, options) {
    return (0, exports.got)("options", url, options);
};
exports.got.connect = function (url, options) {
    return (0, exports.got)("options", url, options);
};
exports.got.patch = function (url, options) {
    return (0, exports.got)("patch", url, options);
};
