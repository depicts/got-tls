import { Proxy } from "./util/main";
import type { RequestOptions, ResponseData } from "./interface";
import { EventEmitter } from "events";
export declare const Server: Proxy;
export declare const got: {
    (method: string, url: string, options: RequestOptions, responseEmitter?: EventEmitter | null, redirects?: number): Promise<ResponseData>;
    head(url: string, options: RequestOptions): Promise<ResponseData>;
    get(url: string, options: RequestOptions): Promise<ResponseData>;
    post(url: string, options: RequestOptions): Promise<ResponseData>;
    put(url: string, options: RequestOptions): Promise<ResponseData>;
    delete(url: string, options: RequestOptions): Promise<ResponseData>;
    trace(url: string, options: RequestOptions): Promise<ResponseData>;
    options(url: string, options: RequestOptions): Promise<ResponseData>;
    connect(url: string, options: RequestOptions): Promise<ResponseData>;
    patch(url: string, options: RequestOptions): Promise<ResponseData>;
};
