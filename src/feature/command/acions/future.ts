import axios from "axios";

const SUGGESTION_API_URL = 'https://finance.pae.baidu.com/selfselect/sug'

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

function extractPrices(stock: Stock) {
    const name = stock.name;
    const currentPrice = parseFloat(stock.price);

    const isGrowing = Number(stock.increase) >= 0;
    return `${name}(${stock.code}): ${currentPrice} (${isGrowing ? '📈' : '📉'}${stock.ratio})`;
}

// 定义金融产品类型枚举
export enum FinancialProductType {
    INDEX = 'index',
    FUTURES = 'futures',
    STOCK = 'stock',
    FOREIGN = 'foreign'
}

export async function getFutureSuggest(
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

export async function getFutureData(symbol: string): Promise<string> {
    try {
        const symbols = symbol.split(/\s+/);  // 按空格分割多个股票代码
        const results = await getMultipleFuturesData(symbols);
        return results.join('\n\n');  // 用两个换行符分隔每个股票的数据，增加可读性
    } catch (error: unknown) {
        if (error instanceof Error) {
            return `❌ 获取 ${symbol} 失败：${error.message}`;
        }
        return `❌ 获取 ${symbol} 失败：未知错误`;
    }
}

// 新增辅助函数用于并行获取多个股票数据
async function getMultipleFuturesData(symbols: string[]): Promise<string[]> {
    const promises = symbols.map(async (symbol) => {
        try {
            return await getFutureBasicData(symbol);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return `❌ 获取 ${symbol} 失败：${error.message}`;
            }
            return `❌ 获取 ${symbol} 失败：未知错误`;
        }
    });
    return await Promise.all(promises);
}

export async function getFutureBasicData(symbol: string): Promise<string> {
    const suggestedSymbol = await getFutureSuggest(symbol)
    if (!suggestedSymbol) throw new Error('未找到相关股票');

    return extractPrices(suggestedSymbol);
}