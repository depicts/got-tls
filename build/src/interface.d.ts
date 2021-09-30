import type { CookieJar } from 'tough-cookie';
export interface ResponseData {
    id: string;
    method: string;
    statusCode: number;
    url: string;
    headers: Headers;
    body: string;
    success: boolean;
    message: string;
}
export interface RequestData {
    id: string;
    debug?: boolean;
    method: string;
    url: string;
    proxy?: string;
    headers: Headers;
    body?: string;
    timeout?: string;
    redirect?: boolean;
}
export interface ResponseObject {
    statusCode: number;
    headers: Record<string, string | string[]>;
    body: string;
}
export interface Headers {
    [key: string]: any;
}
export interface RequestOptions {
    headers: Record<string, string | string>;
    json?: Record<string, any>;
    body?: string;
    form?: Record<string, any>;
    redirect?: boolean;
    timeout?: string;
    debug?: boolean;
    cookieJar?: CookieJar;
    proxy?: string;
}
export interface ToughCookieJar {
    getCookieString: ((currentUrl: string, options: Record<string, unknown>, cb: (error: Error | null, cookies: string) => void) => void) & ((url: string, callback: (error: Error | null, cookieHeader: string) => void) => void);
    setCookie: ((cookieOrString: unknown, currentUrl: string, options: Record<string, unknown>, cb: (error: Error | null, cookie: unknown) => void) => void) & ((rawCookie: string, url: string, callback: (error: Error | null, result: unknown) => void) => void);
}
export interface PromiseCookieJar {
    getCookieString: (url: string) => Promise<string>;
    setCookie: (rawCookie: string, url: string) => Promise<unknown>;
}
