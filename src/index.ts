import { sleep, getBaseUrl, Proxy } from "./util/main";
import type {
  RequestOptions,
  ResponseData,
  RequestData,
  PromiseCookieJar,
} from "./interface";
import { EventEmitter } from "events";
import { FormDataEncoder, isFormDataLike } from "form-data-encoder";
import { v4 as uuidv4 } from "uuid";
import PubSub from "pubsub-js";
import { URLSearchParams } from "url";

export const Server = new Proxy();

const validMethods = [
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

export const got = async (
  method: string,
  url: string,
  options: RequestOptions,
  responseEmitter: EventEmitter | null = null,
  redirects: number = 0
) => {
  method = method.toUpperCase();

  /**
   * Only create an event emitter for the initial request
   * redirect request will get the initial emitter passed in
   */

  let init = false;

  if (!responseEmitter) {
    init = true;
    responseEmitter = new EventEmitter();
  }

  /**
   * Time waited for websocket connection if not already connected
   * return error if not connected within 10 seconds
   */

  let timeWaited = 0;

  while (!Server.isConnected) {
    (await sleep(100)) && (timeWaited += 100);
    if (timeWaited > 10000) {
      responseEmitter.emit("error", `Proxy Client Took Too Long To Connect!`);
    }
  }

  /**
   * Check if the request method is valid
   */

  if (!validMethods.includes(method)) {
    responseEmitter.emit("error", `Request Method ${method} Is Not Supported`);
  }

  /**
   * Check if the request url is valid
   */

  if (typeof url === "string" && url === "") {
    responseEmitter.emit("error", `Request Url ${url} Is Not Valid`);
  }

  if (!url.includes("https://") && !url.includes("http://")) {
    responseEmitter.emit(
      "error",
      `Request Protocol Not Found! e.g http:// https://`
    );
  }

  /**
   * Get Base Url For Cookie Jar Handling
   */

  let baseUrl = getBaseUrl(url);

  if (options.cookieJar && typeof baseUrl === "string" && baseUrl === "") {
    responseEmitter.emit(
      "error",
      `Cookie Domain Cannot Be Resolved With Url ${url}`
    );
  }

  const id = uuidv4();

  let request: RequestData = {
    id: id,
    method: method,
    url: url,
    headers: options.headers,
    debug: options.debug,
  };

  let hasContentType =
    options.headers["content-type"] || options.headers["Content-Type"];

  if (options.json) {
    if (!hasContentType) {
      options.headers["content-type"] = "application/json";
    }
    request.body = JSON.stringify(options.json);
  } else if (options.body) {
    if (isFormDataLike(options.body)) {
      const encoder = new FormDataEncoder(options.body);
      if (!hasContentType) {
        options.headers["content-type"] = encoder.headers["Content-Type"];
      }
      request.body = encoder.encode().toString();
    }
  } else if (options.form) {
    if (!hasContentType) {
      options.headers["content-type"] = "application/x-www-form-urlencoded";
      request.body = new URLSearchParams(
        options.form as Record<string, string>
      ).toString();
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

  /**
   * If a cookie jar is passed in get the cookies for the domain
   * and set the cookie header for the request
   */

  if (options.cookieJar) {
    const cookieString: string = await options.cookieJar.getCookieString(
      baseUrl
    );
    if (cookieString != "") {
      request.headers.cookie = cookieString;
    }
  }

  PubSub.subscribe(id, async (msg: any, data: ResponseData) => {
    if (data.success) {
      if (data.headers) {
        /**
         * the proxy client returns headers as a string keys and array values
         * here we turn then into strings
         */
        let finalHeaders: { [key: string]: string } = {};

        for (const header in data.headers) {
          /**
           * the proxy client returns cookies as an object array and we loop and set them here
           */
          if (
            header === "Set-Cookie" &&
            typeof header === "object" &&
            Array.isArray(data.headers["Set-Cookie"])
          ) {
            if (options.cookieJar) {
              let promises: Array<Promise<unknown>> = data.headers[
                "Set-Cookie"
              ].map(async (rawCookie: string) =>
                (options.cookieJar as PromiseCookieJar).setCookie(
                  rawCookie,
                  url!.toString()
                )
              );
              try {
                await Promise.all(promises);
              } catch (error: any) {}
              finalHeaders["Set-Cookie"] = data.headers["Set-Cookie"].join(",");
            }
          } else {
            finalHeaders[header] = data.headers[header][0];
          }
        }
        data.headers = finalHeaders;
      }

      /**
       * Here we handle the response if the status code is a redirect one
       * and there is a location header we redirect else we return the response
       */

      if (
        data.statusCode >= 300 &&
        data.statusCode < 400 &&
        data.headers["Location"]
      ) {
        responseEmitter?.emit("redirect", data.headers["Location"]);
      } else {
        responseEmitter?.emit("end", data);
      }
    } else {
      responseEmitter?.emit("error", data.message);
    }
  });

  Server.client.send(JSON.stringify(request));

  /**
   * handle redirect and pass in the initial response emitter and
   * redirect count to enforce max redirect limit
   */

  responseEmitter.on("redirect", async (data) => {
    redirects = redirects + 1;
    if (redirects >= 20) {
      responseEmitter?.emit("error", "Too Many Redirects Error");
    } else {
      got("GET", data, options, responseEmitter, redirects);
    }
  });

  if (init) {
    return new Promise<ResponseData>((resolve, reject) => {
      responseEmitter?.on("end", (data: ResponseData) => {
        PubSub.unsubscribe(data.id);
        resolve(data);
      });
      responseEmitter?.on("error", (err) => {
        reject(new Error(err));
      });
    });
  } else {
    return <ResponseData>{
      id: "",
      method: "",
      statusCode: 0,
      url: "",
      headers: {},
      body: "",
      success: false,
      message: "",
    };
  }
};

got.head = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("head", url, options);
};
got.get = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("get", url, options);
};
got.post = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("post", url, options);
};
got.put = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("put", url, options);
};
got.delete = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("delete", url, options);
};
got.trace = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("trace", url, options);
};
got.options = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("options", url, options);
};
got.connect = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("options", url, options);
};
got.patch = (url: string, options: RequestOptions): Promise<ResponseData> => {
  return got("patch", url, options);
};
