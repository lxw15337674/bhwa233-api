import axios from "axios";

const Binance_API_URL = 'https://data-api.binance.vision/api/v3/ticker/24hr'
const Bitget_API_URL = 'https://api.bitget.com/api/v2/spot/market/tickers'
const Bybit_API_URL = 'https://api.bybit.com/v5/market/tickers'

interface BinanceData {
    // 交易对名称，例如 BTCUSDT
    symbol: string;
    // 24 小时内价格变化量
    priceChange: string;
    // 24 小时内价格变化百分比
    priceChangePercent: string;
    // 24 小时内的加权平均价格
    weightedAvgPrice: string;
    // 前一个交易日的收盘价
    prevClosePrice: string;
    // 最新成交价
    lastPrice: string;
    // 最新成交量
    lastQty: string;
    // 买一价
    bidPrice: string;
    // 买一量
    bidQty: string;
    // 卖一价
    askPrice: string;
    // 卖一量
    askQty: string;
    // 24 小时内开盘价
    openPrice: string;
    // 24 小时内最高价
    highPrice: string;
    // 24 小时内最低价
    lowPrice: string;
    // 24 小时内成交量
    volume: string;
    // 24 小时内成交额
    quoteVolume: string;
    // 24 小时统计周期的开始时间戳 (毫秒)
    openTime: number;
    // 24 小时统计周期的结束时间戳 (毫秒)
    closeTime: number;
    // 该时间段内的第一个交易 ID
    firstId: number;
    // 该时间段内的最后一个交易 ID
    lastId: number;
    // 该时间段内的交易次数
    count: number;
}

interface BitgetData {
    code: string;
    msg: string;
    requestTime: number;
    data: {
        // 交易对名称
        symbol: string;
        // 24小时最高价
        high24h: string;
        // 24小时开盘价
        open: string;
        // 最新成交价
        lastPr: string;
        // 24小时最低价
        low24h: string;
        // 计价币成交额
        quoteVolume: string;
        // 基础币成交额
        baseVolume: string;
        // USDT成交额
        usdtVolume: string;
        // 当前时间（Unix毫秒时间戳，例如1690196141868）
        ts: string;
        // 买一价
        bidPr: string;
        // 卖一价
        askPr: string;
        // 买一量
        bidSz: string;
        // 卖一量
        askSz: string;
        // 零时区开盘价
        openUtc: string;
        // UTC0时涨跌幅（0.01表示1%）
        changeUtc24h: string;
        // 24小时涨跌幅（0.01表示1%）
        change24h: string;
    }[];
}

interface BybitData {
    // 返回码，0 表示成功
    retCode: number;
    // 返回信息
    retMsg: string;
    result: {
        // 产品类型
        category: string;
        list: {
            // 交易对名称
            symbol: string;
            // 最优买一价
            bid1Price: string;
            // 最优买一量
            bid1Size: string;
            // 最优卖一价
            ask1Price: string;
            // 最优卖一量
            ask1Size: string;
            // 最新成交价
            lastPrice: string;
            // 24小时前的市场价格
            prevPrice24h: string;
            // 24小时价格变化百分比
            price24hPcnt: string;
            // 24小时内最高价
            highPrice24h: string;
            // 24小时内最低价
            lowPrice24h: string;
            // 24小时成交额
            turnover24h: string;
            // 24小时成交量
            volume24h: string;
            // USD指数价格，用于计算统一账户中资产的美元价值
            // 非抵押保证金币种返回空字符串
            // 仅 XXX/USDT 或 XXX/USDC 类型的交易对有此值
            usdIndexPrice: string;
        }[];
    };
    // 额外返回信息
    retExtInfo: {
    };
    // 时间戳
    time: number;
}

interface Response {
    success: boolean;
    text: string;
}

export async function getCryptoData(symbol: string): Promise<string> {
    try {
        const symbols = symbol.split(/\s+/);  // 按空格分割多个交易对代码
        const results = await getMultipleCryptosData(symbols);
        return results.join('\n\n');  // 用两个换行符分隔每个交易对的数据，增加可读性
    } catch (error: unknown) {
        if (error instanceof Error) {
            return `❌ 获取 ${symbol} 失败：${error.message}`;
        }
        return `❌ 获取 ${symbol} 失败：未知错误`;
    }
}

// 新增辅助函数用于并行获取多个交易对数据
async function getMultipleCryptosData(symbols: string[]): Promise<string[]> {
    const promises = symbols.map(async (symbol) => {
        try {
            return await getCryptoBasicData(symbol);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return `❌ 获取 ${symbol} 失败：${error.message}`;
            }
            return `❌ 获取 ${symbol} 失败：未知错误`;
        }
    });
    return await Promise.all(promises);
}

export async function getCryptoBasicData(symbol: string): Promise<string> {
    try {
        // 定义数据源优先级列表
        const dataSources = [
            {
                name: 'Binance',
                fetch: () => getBinanceData(symbol)
            },
            {
                name: 'Bitget',
                fetch: () => getBitgetData(symbol)
            },
            {
                name: 'Bybit',
                fetch: () => getBybitData(symbol)
            }
            // 后续可以在这里添加更多数据源
        ];

        // 按优先级依次尝试获取数据
        for (const source of dataSources) {
            try {
                const result = await source.fetch();
                if (result.success) {
                    return result.text;
                }
                console.warn(`${source.name} 数据获取失败，尝试下一个数据源`);
            } catch (error) {
                console.error(`${source.name} API 调用出错:`, error);
                continue;
            }
        }

        return `获取 ${symbol} 数据失败`
    } catch (error) {
        return `获取 ${symbol} 数据失败: ${error.message}`
    }
}

export async function getBitgetData(symbol: string) {
    try {
        const formatSymbol = `${symbol.toLocaleUpperCase()}USDT`;

        const response = await axios.get<BitgetData>(Bitget_API_URL, {
            params: {
                symbol: formatSymbol,
            },
        })

        if (response.status === 200 && response.data.code == '00000') {
            const { data } = response

            const result = data.data.find(item => item.symbol == formatSymbol)

            if (!result) {
                return {
                    success: false,
                    text: `未找到 ${symbol} 的数据`
                }
            }

            const price = Number(result.lastPr)
            const percent = (Number(result.change24h) * 100).toFixed(2)
            const isGrowing = Number(percent) > 0;
            const text = `${result.symbol}: $${price} (${isGrowing ? '📈' : '📉'}${percent}%)`
            return {
                success: true,
                text
            }
        } else {
            return {
                success: false,
                text: `获取 ${symbol} 数据失败: ${response.status}`
            }
        }
    } catch (error) {
        return {
            success: false,
            text: `获取 ${symbol} 数据失败: ${error.message}`
        }
    }
}

export async function getBinanceData(symbol: string): Promise<Response> {
    try {
        const formatSymbol = `${symbol.toLocaleUpperCase()}USDT`;

        const response = await axios.get<BinanceData>(Binance_API_URL, {
            params: {
                symbol: formatSymbol,
            },
        })

        if (response.status === 200) {
            const { data } = response
            const price = Number(data.lastPrice)
            const percent = Number(data.priceChangePercent).toFixed(2)
            const isGrowing = Number(percent) > 0;
            const text = `${data.symbol}: $${price} (${isGrowing ? '📈' : '📉'}${percent}%)`
            return {
                success: true,
                text
            }
        } else {
            return {
                success: false,
                text: `获取 ${symbol} 数据失败: ${response.status}`
            }
        }
    } catch (error) {
        return {
            success: false,
            text: `获取 ${symbol} 数据失败: ${error.message}`
        }
    }
}

export async function getBybitData(symbol: string): Promise<Response> {
    try {
        const formatSymbol = `${symbol.toLocaleUpperCase()}USDT`;

        const response = await axios.get<BybitData>(Bybit_API_URL, {
            params: {
                category: 'spot',
                symbol: formatSymbol,
            },
        })

        if (response.status === 200 && response.data.retCode == 0) {
            const data = response.data.result.list.find(item => item.symbol == formatSymbol)

            if (!data) {
                return {
                    success: false,
                    text: `未找到 ${symbol} 的数据`
                }
            }

            const price = Number(data.lastPrice)
            const percent = (Number(data.price24hPcnt) * 100).toFixed(2)
            const isGrowing = Number(percent) > 0;
            const text = `${data.symbol}: $${price} (${isGrowing ? '📈' : '📉'}${percent}%)`
            return {
                success: true,
                text
            }
        } else {
            return {
                success: false,
                text: `获取 ${symbol} 数据失败: ${response.status}`
            }
        }
    } catch (error) {
        return {
            success: false,
            text: `获取 ${symbol} 数据失败: ${error.message}`
        }
    }
}
