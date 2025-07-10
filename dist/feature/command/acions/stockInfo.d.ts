interface Market {
    status_id: number;
    region: string;
    status: string;
    time_zone: string;
    time_zone_desc: string | null;
    delay_tag: number;
}
interface Quote {
    current_ext?: number;
    symbol: string;
    high52w: number;
    percent_ext: number;
    delayed: number;
    type: number;
    tick_size: number;
    float_shares: number | null;
    high: number;
    float_market_capital: number | null;
    timestamp_ext: number;
    lot_size: number;
    lock_set: number;
    chg: number;
    eps: number;
    last_close: number;
    profit_four: number;
    volume: number;
    volume_ratio: number;
    profit_forecast: number;
    turnover_rate: number;
    low52w: number;
    name: string;
    exchange: string;
    pe_forecast: number;
    total_shares: number;
    status: number;
    code: string;
    goodwill_in_net_assets: number;
    avg_price: number;
    percent: number;
    psr: number;
    amplitude: number;
    current: number;
    current_year_percent: number;
    issue_date: number;
    sub_type: string;
    low: number;
    market_capital: number;
    shareholder_funds: number;
    dividend: number | null;
    dividend_yield: number | null;
    currency: string;
    chg_ext: number;
    navps: number;
    profit: number;
    beta: number | null;
    timestamp: number;
    pe_lyr: number;
    amount: number;
    pledge_ratio: number | null;
    short_ratio: number | null;
    inst_hld: number | null;
    pb: number;
    pe_ttm: number;
    contract_size: number;
    variable_tick_size: string;
    time: number;
    open: number;
}
interface Others {
    pankou_ratio: number;
    cyb_switch: boolean;
}
interface Tag {
    description: string;
    value: number;
}
interface StockData {
    data: {
        market: Market;
        quote: Quote;
        others: Others;
        tags: Tag[];
    };
    error_code: number;
    error_description: string;
}
export declare function getToken(): Promise<string>;
export declare function getSuggestStock(q: string): Promise<string | undefined>;
export declare function getStockBasicData(symbol: string): Promise<StockData['data']>;
export declare function getStockData(symbol: string): Promise<string>;
export declare function getCNMarketIndexData(): Promise<string>;
export declare function getUSMarketIndexData(): Promise<string>;
export declare function getHKMarketIndexData(): Promise<string>;
export declare function getStockDetailData(symbol: string): Promise<string>;
export declare function getGzjc(): Promise<any>;
export {};
