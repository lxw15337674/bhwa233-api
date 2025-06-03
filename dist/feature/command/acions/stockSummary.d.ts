type StringNumber = string;
type StringDate = string;
type KLineDataItem = [StringDate, StringNumber, StringNumber];
interface ValuationInterval {
    index_code: string;
    index_name: string;
    pe_hist_percentile: number;
    pe_interval: number[];
    pe_interval_benchmark: number[];
    pe_ttm: number;
    value: KLineDataItem[];
}
interface IndexValuation {
    sh000001: ValuationInterval;
    sz399001: ValuationInterval;
    sz399006: ValuationInterval;
}
interface NorthBoundFlow {
    date: string;
    fund_flow_net_in: number;
    day_flag: number;
    close_flag: boolean;
    history: {
        code: string;
        data: string[];
    };
    history_total: number;
    fund_flow_net_in_detail: null;
    market_close_type: boolean;
    market_close: string;
}
interface UpsDowns {
    down_count: number;
    up_count: number;
    flat_count: number;
    down_limit_count: number;
    up_limit_count: number;
    suspension_count: number;
    up_ratio: number;
    up_ratio_comment: string;
    detail: Array<{
        section: string;
        count: number;
        flag: number;
    }>;
}
interface Turnover {
    all: {
        volume: number;
        amount: number;
        amount_change: number;
    };
    sh: {
        volume: number;
        amount: number;
        amount_change: number;
    };
    sz: {
        volume: number;
        amount: number;
        amount_change: number;
    };
}
interface UpsDownsMinute {
    code: string;
    date: string;
    pre: string;
    data: string[];
}
interface GlobalReaction {
    sh_history: {
        code: string;
        data: string[];
    };
    fucn_minute: {
        code: string;
        date: string;
        pre: string;
        data: string[];
    } | null;
    fucn_history: {
        code: string;
        data: string[];
    };
    fxdiniw_minute: null;
    fxdiniw_history: {
        code: string;
        data: string[];
    };
    usbond_history: {
        code: string;
        data: string[];
    };
    comment: string;
}
interface MarketResponse {
    code: number;
    data: {
        top_state: {
            MarketStat: string;
            MarketStatSGXS: string;
            QuoteTime: string;
        };
        minute_set: {
            minute_board_zt: UpsDownsMinute;
            minute_sh_index: UpsDownsMinute;
        };
        turnover_dsb: Turnover;
        ups_downs_dsb: UpsDowns;
        ups_downs_minute: {
            [key: string]: UpsDownsMinute;
        };
        ups_and_downs_history: {
            hsAUpsRatio: {
                code: string;
                data: string[];
            };
        };
        board_stock_rank: Array<{
            code: string;
            name: string;
            price: string;
            zdf: string;
        }>;
        north_bound: NorthBoundFlow;
        comments: null;
        total_amount: string[];
        index_valuation: IndexValuation;
        global_reaction: GlobalReaction;
    };
    msg: string;
}
export type { MarketResponse };
export declare function getStockSummary(): Promise<string | undefined>;
