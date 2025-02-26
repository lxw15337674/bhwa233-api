import axios from "axios";

const SUGGESTION_API_URL = 'https://finance.pae.baidu.com/selfselect/sug'
const BD_GST_API_URL = 'https://gushitong.baidu.com/opendata'

interface SuggestData {
    QueryID: string;
    ResultCode: string;
    Result: {
        stock: Stock[];
        index: any[];
        deal_status: string;
        stock_status: {
            is_trend: string;
            time_sort: string;
        };
        refresh_time: string;
        labelMap: {
            text: string;
            ename: string;
        }[];
        isNew: string;
        follow_num: string;
    };
}

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
                        minute_data?: {
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
                                }
                            };
                            outMarketInfo: {
                                type: string;
                                price: string;
                                increase: string;
                                ratio: string;
                                time: string;
                            };
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
                        };
                        market?: string;
                        selectTab?: string;
                    };
                };
            };
        };
    }[];
}

// 定义金融产品类型枚举
export enum FinancialProductType {
    INDEX = 'index',
    FUTURES = 'futures',
    STOCK = 'stock',
    FOREIGN = 'foreign'
}

export async function getStockSuggest(
    searchText = '上证指数',
    type: FinancialProductType[] = [
        FinancialProductType.INDEX,
        FinancialProductType.FUTURES,
        FinancialProductType.STOCK,
        FinancialProductType.FOREIGN
    ]
): Promise<Stock | undefined> {
    try {
        const response = await axios.get<SuggestData>(SUGGESTION_API_URL, {
            params: {
                wd: searchText,
                skip_login: 1,
                finClientType: 'pc'
            },
            headers: {
                Host: 'finance.pae.baidu.com'
            },
        });

        if (response.status === 200 && response.data.Result.stock.length > 0) {
            return response.data.Result.stock.find(stock => {
                return type.includes(stock.type as FinancialProductType);
            });
        }

        return undefined;
    } catch (err) {
        return undefined;
    }
}

export async function getStockData(symbol: string): Promise<string> {
    try {
        const symbols = symbol.split(/\s+/);  // 按空格分割多个股票代码
        const results = await getMultipleStocksData(symbols);
        return results.join('\n\n');  // 用两个换行符分隔每个股票的数据，增加可读性
    } catch (error: unknown) {
        if (error instanceof Error) {
            return `❌ 获取 ${symbol} 失败：${error.message}`;
        }
        return `❌ 获取 ${symbol} 失败：未知错误`;
    }
}

// 新增辅助函数用于并行获取多个股票数据
async function getMultipleStocksData(symbols: string[]): Promise<string[]> {
    const promises = symbols.map(async (symbol) => {
        try {
            return await getStockBasicData(symbol);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return `❌ 获取 ${symbol} 失败：${error.message}`;
            }
            return `❌ 获取 ${symbol} 失败：未知错误`;
        }
    });
    return await Promise.all(promises);
}

export async function getStockBasicData(symbol: string): Promise<string> {
    const suggestedSymbol = await getStockSuggest(symbol)
    if (!suggestedSymbol) throw new Error('未找到相关股票');

    const result = await fetchStockDetailData(suggestedSymbol)

    const data = result.resultData.tplData.result.minute_data
    if (!data) throw new Error('未找到相关股票');

    const { basicinfos, cur, outMarketInfo } = data

    const name = basicinfos.name;
    const currentPrice = parseFloat(cur.price);
    const isGrowing = parseFloat(cur.increase) >= 0;
    let text = `${name}(${basicinfos.code}): ${currentPrice} (${isGrowing ? '📈' : '📉'}${cur.ratio})`

    if (outMarketInfo) {
        const outMarketPrice = parseFloat(outMarketInfo.price);
        const outMarketIsGrowing = parseFloat(outMarketInfo.increase) >= 0;
        const outMarketTrend = outMarketIsGrowing ? '📈' : '📉';
        const typeMap: Record<string, string> = {
            '1': '盘前',
            '2': '盘后'
        };
        const type = typeMap[outMarketInfo.type] || '';

        text += `\n${type}：${outMarketPrice} (${outMarketTrend}${outMarketInfo.ratio})`
    }

    return text;
}

export async function getStockDetailData(symbol: string) {
    const suggestedSymbol = await getStockSuggest(symbol)
    if (!suggestedSymbol) throw new Error('未找到相关股票');

    const result = await fetchStockDetailData(suggestedSymbol)

    const data = result.resultData.tplData.result.minute_data
    if (!data) throw new Error('未找到相关股票');

    const { pankouinfos, basicinfos, cur, outMarketInfo } = data
    const pankouData: string[] = [];

    pankouData.push(`${basicinfos.name}(${basicinfos.code})`)

    const isGrowing = parseFloat(cur.increase) >= 0;
    const trend = isGrowing ? '📈' : '📉';
    pankouData.push(`现价：${cur.price} ${trend} ${cur.ratio}`)

    if (outMarketInfo) {
        const outMarketPrice = parseFloat(outMarketInfo.price);
        const outMarketIsGrowing = parseFloat(outMarketInfo.increase) >= 0;
        const outMarketTrend = outMarketIsGrowing ? '📈' : '📉';
        const typeMap: Record<string, string> = {
            '1': '盘前',
            '2': '盘后'
        };
        const type = typeMap[outMarketInfo.type] || '';

        pankouData.push(`${type}：${outMarketPrice} (${outMarketTrend}${outMarketInfo.ratio})`)
    }

    pankouinfos.list.forEach(item => {
        pankouData.push(`${item.name}: ${item.value}`)
    })

    return pankouData.join('\n');
}

export async function fetchStockDetailData(suggest: { code: string; type: string, market: string }) {
    // 定义资源ID映射
    const RESOURCE_IDS = {
        'ab': '5429',
        'hk': '5430',
        'us': '5431',
        'index': '5352',
        'foreign': '5343',
        'uk': '5566',
        'bk': '5782',
        'block': '50748',
        'futures': '51287'
    } as const;

    const params = {
        openapi: "1",
        dspName: "iphone",
        client: "app",
        query: suggest.code,
        code: suggest.code,
        word: suggest.code,
        resource_id: RESOURCE_IDS[suggest.type as keyof typeof RESOURCE_IDS] || RESOURCE_IDS[suggest.market as keyof typeof RESOURCE_IDS],
        finClientType: "pc",
        market: suggest.market
    }

    const response = await axios.get<StockDetail>(BD_GST_API_URL, {
        params
    })

    const result = response.data.Result?.find(item => ['stock_quotation_info', 'unitstatic', 'index_sf_quotations'].includes(item.DisplayData.strategy.tempName))

    if (!result) throw new Error('未找到相关股票')

    return result.DisplayData
}
