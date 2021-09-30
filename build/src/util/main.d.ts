export declare class Proxy {
    client: any;
    isConnected: boolean;
    port: number;
    constructor();
    connect(): Promise<void>;
}
export declare function getBaseUrl(url: string, prefix?: string): string;
export declare function sleep(ms: number): Promise<unknown>;
