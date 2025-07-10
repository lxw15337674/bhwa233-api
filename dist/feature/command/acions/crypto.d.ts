interface Response {
    success: boolean;
    text: string;
}
export declare function getCryptoData(symbol: string): Promise<string>;
export declare function getCryptoBasicData(symbol: string): Promise<string>;
export declare function getBitgetData(symbol: string): unknown;
export declare function getBinanceData(symbol: string): Promise<Response>;
export declare function getBybitData(symbol: string): Promise<Response>;
export declare function getGateioData(symbol: string): Promise<Response>;
export {};
