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
exports.sleep = exports.getBaseUrl = exports.Proxy = void 0;
var child_process_1 = require("child_process");
var events_1 = require("events");
var path_1 = require("path");
var pubsub_js_1 = __importDefault(require("pubsub-js"));
var get_port_1 = __importDefault(require("get-port"));
var W3CWebSocket = require("websocket").w3cwebsocket;
var child;
var connectionEmitter = new events_1.EventEmitter();
var cleanExit = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (!child)
            return [2 /*return*/];
        if (message) {
            console.log(message);
        }
        if (process.platform == "win32") {
            new Promise(function (resolve, reject) {
                (0, child_process_1.exec)("taskkill /pid " + child.pid + " /T /F", function (error, stdout, stderr) {
                    if (error) {
                        console.warn(error);
                    }
                    process.exit();
                    resolve(stdout ? stdout : stderr);
                });
            });
        }
        else {
            new Promise(function (resolve, reject) {
                if (child.pid) {
                    process.kill(-child.pid);
                    process.exit();
                }
            });
        }
        return [2 /*return*/];
    });
}); };
process.on("SIGINT", function () { return cleanExit(); });
process.on("SIGTERM", function () { return cleanExit(); });
var Proxy = /** @class */ (function () {
    function Proxy() {
        this.isConnected = false;
        this.port = 5600;
    }
    Proxy.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, executableFilename;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        connectionEmitter.on("connection", function (connection) {
                            _this.isConnected = connection;
                        });
                        _a = this;
                        return [4 /*yield*/, (0, get_port_1.default)()];
                    case 1:
                        _a.port = _b.sent();
                        cleanExit();
                        console.log("Starting Server...");
                        executableFilename = "";
                        if (process.platform == "win32") {
                            executableFilename = "got-tls-proxy.exe";
                        }
                        else if (process.platform == "darwin") {
                            executableFilename = "got-tls-proxy";
                        }
                        else {
                            cleanExit(new Error("Operating system not supported"));
                        }
                        child = (0, child_process_1.spawn)((0, path_1.join)(__dirname, "../resources/" + executableFilename), {
                            env: { PROXY_PORT: this.port.toString() },
                            shell: true,
                            windowsHide: true,
                            detached: process.platform !== "win32",
                        });
                        return [4 /*yield*/, sleep(2000)];
                    case 2:
                        _b.sent();
                        this.client = new W3CWebSocket("ws://localhost:" + this.port + "/client");
                        this.client.onopen = function () {
                            console.log("Successfully Connnected To Proxy");
                            connectionEmitter.emit("connection", true);
                        };
                        this.client.onmessage = function (e) {
                            if (typeof e.data === "string") {
                                var responseData = JSON.parse(e.data);
                                pubsub_js_1.default.publish(responseData.id, responseData);
                            }
                        };
                        this.client.onclose = function () {
                            var _this = this;
                            console.log("gotTLS Proxy Client Closed Error! Retrying Connection...");
                            connectionEmitter.emit("connection", false);
                            setTimeout(function () {
                                _this.client && _this.client.connect();
                            }, 2000);
                        };
                        this.client.onerror = function () {
                            var _this = this;
                            console.log("gotTLS Proxy Connection Error! Retrying Connection...");
                            connectionEmitter.emit("connection", false);
                            setTimeout(function () {
                                _this.client && _this.client.connect();
                            }, 2000);
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    return Proxy;
}());
exports.Proxy = Proxy;
var dir = "/";
function getBaseUrl(url, prefix) {
    var urlAsArray = url.split(dir);
    var doubleSlashIndex = url.indexOf("://");
    if (doubleSlashIndex !== -1 && doubleSlashIndex === url.indexOf(dir) - 1) {
        urlAsArray.length = 3;
        var url_1 = urlAsArray.join(dir);
        if (prefix !== undefined)
            url_1 = url_1.replace(/http:\/\/|https:\/\//, prefix);
        return url_1;
    }
    else {
        var pointIndex = url.indexOf(".");
        if (pointIndex !== -1 && pointIndex !== 0) {
            return (prefix !== undefined ? prefix : "https://") + urlAsArray[0];
        }
    }
    return "";
}
exports.getBaseUrl = getBaseUrl;
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
exports.sleep = sleep;
