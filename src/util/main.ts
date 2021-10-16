import { spawn, exec, ChildProcessWithoutNullStreams } from "child_process";
import type { ResponseData } from "../interface";
import { join } from "path";
import PubSub from "pubsub-js";
import getPort from "get-port";
const W3CWebSocket = require("websocket").w3cwebsocket;

let child: ChildProcessWithoutNullStreams;

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

export let BACKEND: any
let PORT: number
export let CONNECTED = false

const connectToServer = async () => {
  try {
    await sleep(500)

    BACKEND = new W3CWebSocket(`ws://localhost:${PORT}/client`)

    BACKEND.onopen = function () {
      console.log('Successfully Connnected To Backend Proxy')
      CONNECTED = true
    }

    BACKEND.onmessage = function (e: any) {
      if (typeof e.data === "string") {
        let responseData: ResponseData = JSON.parse(e.data);
        PubSub.publish(responseData.id, responseData);
      }
    }

    BACKEND.onclose = function () {
      console.log('Backend Proxy Client Closed Error! Retrying Connection...')
      CONNECTED = false
      connectToServer()
    }

    BACKEND.onerror = function () {
      console.log('Backend Proxy Connection Error! Retrying Connection...')
      CONNECTED = false
      // connectToServer()
    }
  } catch (e) {}
}

export const startServer = async () => {
  try {
    PORT = await getPort()

    console.log('Starting Server...')

    let executableFilename = "";
    if (process.platform == "win32") {
      executableFilename = "got-tls-proxy.exe";
    } else if (process.platform == "linux") {
      executableFilename = "got-tls-proxy-linux";
    } else if (process.platform == "darwin") {
      executableFilename = "got-tls-proxy";
    } else {
      throw new Error("Operating system not supported");
    }

    child = spawn(join(__dirname, `../resources/${executableFilename}`), {
      env: { PROXY_PORT: PORT.toString() },
      shell: true,
      windowsHide: true,
      detached: process.platform !== "win32",
    });

    await connectToServer()
  } catch (e) {
    console.log(e)
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
