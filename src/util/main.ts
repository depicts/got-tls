import { spawn, exec, ChildProcessWithoutNullStreams } from "child_process";
import type { ResponseData } from "../interface";
import { EventEmitter } from "events";
import { join } from "path";
import PubSub from "pubsub-js";
import getPort from "get-port";
const W3CWebSocket = require("websocket").w3cwebsocket;

let child: ChildProcessWithoutNullStreams;

let connectionEmitter = new EventEmitter();

const cleanExit = async (message?: string | Error) => {
  if (!child) return;
  if (message) {
    console.log(message);
  }
  if (process.platform == "win32") {
    new Promise((resolve, reject) => {
      exec(
        "taskkill /pid " + child.pid + " /T /F",
        (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.warn(error);
          }
          process.exit();
          resolve(stdout ? stdout : stderr);
        }
      );
    });
  } else {
    new Promise((resolve, reject) => {
      if (child.pid) {
        process.kill(-child.pid);
        process.exit();
      }
    });
  }
};

process.on("SIGINT", () => cleanExit());

process.on("SIGTERM", () => cleanExit());

export class Proxy {
  client: any;
  isConnected: boolean;
  port: number;

  constructor() {
    this.isConnected = false;
    this.port = 5600;
  }

  async connect() {
    connectionEmitter.on("connection", (connection: boolean) => {
      this.isConnected = connection;
    });

    this.port = await getPort();

    cleanExit();

    console.log("Starting Server...");

    let executableFilename = "";
    if (process.platform == "win32") {
      executableFilename = "got-tls-proxy.exe";
    } else if (process.platform == "linux") {
      executableFilename = "got-tls-proxy-linux";
    } else if (process.platform == "darwin") {
      executableFilename = "got-tls-proxy";
    } else {
      cleanExit(new Error("Operating system not supported"));
    }

    child = spawn(join(__dirname, `../resources/${executableFilename}`), {
      env: { PROXY_PORT: this.port.toString() },
      shell: true,
      windowsHide: true,
      detached: process.platform !== "win32",
    });

    await sleep(2000);

    this.client = new W3CWebSocket(`ws://localhost:${this.port}/client`);

    this.client.onopen = function () {
      console.log("Successfully Connnected To Proxy");
      connectionEmitter.emit("connection", true);
    };

    this.client.onmessage = function (e: any) {
      if (typeof e.data === "string") {
        let responseData: ResponseData = JSON.parse(e.data);
        PubSub.publish(responseData.id, responseData);
      }
    };

    this.client.onclose = function () {
      console.log("gotTLS Proxy Client Closed Error! Retrying Connection...");
      connectionEmitter.emit("connection", false);
      setTimeout(() => {
        this.client && this.client.connect();
      }, 2000);
    };

    this.client.onerror = function () {
      console.log("gotTLS Proxy Connection Error! Retrying Connection...");
      connectionEmitter.emit("connection", false);
      setTimeout(() => {
        this.client && this.client.connect();
      }, 2000);
    };
  }
}

const dir = "/";

export function getBaseUrl(url: string, prefix?: string) {
  const urlAsArray = url.split(dir);
  const doubleSlashIndex = url.indexOf("://");
  if (doubleSlashIndex !== -1 && doubleSlashIndex === url.indexOf(dir) - 1) {
    urlAsArray.length = 3;
    let url = urlAsArray.join(dir);
    if (prefix !== undefined) url = url.replace(/http:\/\/|https:\/\//, prefix);
    return url;
  } else {
    let pointIndex = url.indexOf(".");
    if (pointIndex !== -1 && pointIndex !== 0) {
      return (prefix !== undefined ? prefix : "https://") + urlAsArray[0];
    }
  }
  return "";
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
