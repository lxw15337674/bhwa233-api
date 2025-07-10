interface Stock {
    code: string;
    type: string;
    market: string;
    follow_status: string;
    amount: string;
    exchange: string;
    name: string;
    price: string;
    increase: string;
    ratio: string;
    amplitudeRatio: string;
    turnoverRatio: string;
    holdingAmount: string;
    volume: string;
    capitalization: string;
    stockStatus?: string;
    status: string;
    stockStatusInfo: string;
    subType: string;
    src_loc: string;
    peRate: string;
    pbRate: string;
    sf_url: string;
    pv: string;
    CNYPrice: string;
}
export interface StockDetail {
    ResultCode: string;
    ResultNum: string;
    Result: {
        DisplayData: {
            strategy: {
                tempName: string;
                precharge: string;
                ctplOrPhp: string;
                hilightWord: string;
            };
            resultData: {
                tplData: {
                    cardName: string;
                    templateName: string;
                    title: string;
                    result: {
                        name: string;
                        code: string;
                        minuteUrl?: string;
                        klineUrl?: string;
                        fivedayUrl?: string;
                        stockType?: string;
                        foreign_key?: string;
                        releaseNotes?: string;
                        minute_data?: MinuteData;
                        market?: string;
                        selectTab?: string;
                    };
                };
            };
        };
    }[];
}
interface MinuteData {
    priceinfo: {
        time: string;
        price: string;
        ratio: string;
        increase: string;
        volume: string;
        avgPrice: string;
        amount: string;
        timeKey: string;
        datetime: string;
        oriAmount: string;
        show: string;
    }[];
    pankouinfos: {
        indicatorTitle: string;
        indicatorUrl: string;
        list: {
            ename: string;
            name: string;
            value: string;
            status?: string;
            helpIcon?: string;
        }[];
        origin_pankou: {
            open: string;
            preClose: string;
            volume: string;
            turnoverRatio: string;
            high: string;
            low: string;
            limitUp: string;
            limitDown: string;
            inside: string;
            outside: string;
            amount: string;
            amplitudeRatio: string;
            weibiRatio: string;
            volumeRatio: string;
            currencyValue: string;
            capitalization: string;
            peratio: string;
            lyr: string;
            bvRatio: string;
            perShareEarn: string;
            netAssetsPerShare: string;
            circulatingCapital: string;
            totalShareCapital: string;
            priceLimit: string;
            w52_low: string;
            w52_high: string;
            expire_date: string;
            holdingAmount: string;
            prevSettlement: string;
            settlement: string;
            amountDelta: string;
            currentPrice: string;
        };
    };
    outMarketInfo: outMarketInfo;
    basicinfos: {
        exchange: string;
        code: string;
        name: string;
        stockStatus: string;
        stock_market_code: string;
    };
    provider: string;
    cur: {
        time: string;
        price: string;
        ratio: string;
        increase: string;
        volume: string;
        avgPrice: string;
        amount: string;
        timeKey: string;
        datetime: string;
        oriAmount: string;
        show: string;
        unit: string;
    };
    upDownStatus: string;
    isKc: string;
    adr_info: any[];
}
interface outMarketInfo {
    type: string;
    price: string;
    increase: string;
    ratio: string;
    time: string;
}
export declare enum FinancialProductType {
    INDEX = "index",
    FUTURES = "futures",
    STOCK = "stock",
    FOREIGN = "foreign"
}
export declare function getStockSuggest(searchText?: string, type?: FinancialProductType[]): Promise<Stock | undefined>;
export declare function getStockData(symbol: string): Promise<string>;
export declare function getStockBasicData(symbol: string): Promise<string>;
export declare function getStockDetailData(symbol: string): Promise<string>;
export declare function fetchStockDetailData(suggest: {
    code: string;
    type: string;
    market: string;
}): Promise<{
    strategy: {
        tempName: string;
        precharge: string;
        ctplOrPhp: string;
        hilightWord: string;
    };
    resultData: {
        tplData: {
            cardName: string;
            templateName: string;
            title: string;
            result: {
                name: string;
                code: string;
                minuteUrl?: string;
                klineUrl?: string;
                fivedayUrl?: string;
                stockType?: string;
                foreign_key?: string;
                releaseNotes?: string;
                minute_data?: MinuteData;
                market?: string;
                selectTab?: string;
            };
        };
    };
}>;
export {};
