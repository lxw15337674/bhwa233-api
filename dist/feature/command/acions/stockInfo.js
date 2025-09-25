"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToken = getToken;
exports.getSuggestStock = getSuggestStock;
exports.getStockBasicData = getStockBasicData;
exports.getStocksByTag = getStocksByTag;
exports.getStockData = getStockData;
exports.getCNMarketIndexData = getCNMarketIndexData;
exports.getUSMarketIndexData = getUSMarketIndexData;
exports.getHKMarketIndexData = getHKMarketIndexData;
exports.getStockDetailData = getStockDetailData;
exports.fetchCFFEXFuturesCodes = fetchCFFEXFuturesCodes;
exports.getGzjc = getGzjc;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
const utils_1 = require("../../../utils");
const stock_1 = require("./stock");
const STOCK_API_URL = 'https://stock.xueqiu.com/v5/stock/quote.json';
const SUGGESTION_API_URL = 'https://xueqiu.com/query/v1/suggest_stock.json';
const logger = new common_1.Logger('StockInfo');
const STOCK_TAG_API_URL = 'https://raw.githubusercontent.com/lxw15337674/stock-json/refs/heads/main/stockGroup.json';
let Cookie = '';
let cookieTimestamp = 0;
const COOKIE_EXPIRATION_TIME = 1 * 24 * 60 * 60 * 1000;
async function getToken() {
    const now = Date.now();
    if (Cookie && now - cookieTimestamp < COOKIE_EXPIRATION_TIME) {
        return Cookie;
    }
    const cookieKey = 'xq_a_token';
    try {
        const res1 = await axios_1.default.get('https://xueqiu.com/about');
        Cookie =
            res1.headers['set-cookie']
                ?.find((c) => c.includes(cookieKey))
                ?.split(';')[0] || '';
        if (!Cookie) {
            throw new Error(`❌ Failed to get ${cookieKey} cookie.`);
        }
        cookieTimestamp = now;
        return Cookie;
    }
    catch (error) {
        logger.error('Error getting cookie:', error);
        throw error;
    }
}
async function getSuggestStock(q) {
    const response = await axios_1.default.get(SUGGESTION_API_URL, {
        params: {
            q,
        },
        headers: {
            Cookie: await getToken(),
        },
    });
    if (response.status === 200 && response.data?.data?.[0]?.code) {
        return response.data.data[0].code;
    }
    return undefined;
}
async function retryWithNewToken(fetchFunction) {
    try {
        return await fetchFunction();
    }
    catch (error) {
        Cookie = '';
        cookieTimestamp = 0;
        try {
            return await fetchFunction();
        }
        catch (retryError) {
            if (retryError instanceof Error) {
                throw new Error(`❌ Failed after retry: ${retryError.message}`);
            }
            throw new Error('❌ Failed after retry: Unknown error');
        }
    }
}
async function getStockBasicData(symbol) {
    try {
        const suggestedSymbol = await getSuggestStock(symbol);
        if (!suggestedSymbol)
            throw new Error('未找到相关股票');
        const fetchStockData = async () => {
            const response = await axios_1.default.get(STOCK_API_URL, {
                params: {
                    symbol: suggestedSymbol,
                    extend: 'detail',
                },
                headers: {
                    Cookie: await getToken(),
                },
            });
            if (response.status === 200 && response?.data?.data?.quote) {
                return response.data.data;
            }
            else {
                throw new Error(`❌ Failed to fetch stock data for ${suggestedSymbol}: ${response.status}`);
            }
        };
        return await retryWithNewToken(fetchStockData);
    }
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('❌ Unknown error occurred');
    }
}
async function getMultipleStocksData(symbols) {
    const promises = symbols.map(async (symbol) => {
        try {
            const { quote, market } = await getStockBasicData(symbol);
            const isGrowing = quote.percent > 0;
            const trend = isGrowing ? '📈' : '📉';
            let text = `${quote?.name}(${quote?.symbol}): ${quote.current} (${trend}${isGrowing ? '+' : ''}${(0, utils_1.convertToNumber)(quote.percent)}%)`;
            if (quote.current_ext &&
                quote.percent_ext &&
                quote.current !== quote.current_ext &&
                market.status_id !== 5) {
                const preIsGrowing = quote.percent_ext > 0;
                const preTrend = preIsGrowing ? '📈' : '📉';
                text += `\n⏰ 盘前：${quote.current_ext} ${preTrend} ${preIsGrowing ? '+' : ''}${(0, utils_1.convertToNumber)(quote.percent_ext)}%`;
            }
            return text;
        }
        catch (error) {
            if (error instanceof Error) {
                return `❌ 获取 ${symbol} 失败：${error.message}`;
            }
            return `❌ 获取 ${symbol} 失败：未知错误`;
        }
    });
    return await Promise.all(promises);
}
async function getStocksByTag(tag) {
    const response = await axios_1.default.get(STOCK_TAG_API_URL);
    const results = await getMultipleStocksData(response.data[tag]);
    const textContent = results.join('\n');
    try {
        return textContent;
    }
    catch (error) {
        if (error instanceof Error) {
            return `❌ 获取 ${tag} 失败：${error.message}`;
        }
        return `❌ 获取 ${tag} 失败：未知错误`;
    }
}
async function getStockData(symbol) {
    try {
        const symbols = symbol.split(/\s+/);
        const results = await retryWithNewToken(() => getMultipleStocksData(symbols));
        const textContent = results.join('\n');
        try {
            return textContent;
        }
        catch (error) {
            logger.error('Error converting stock data to image:', error);
            return textContent;
        }
    }
    catch (error) {
        if (error instanceof Error) {
            return `❌ 获取 ${symbol} 失败：${error.message}`;
        }
        return `❌ 获取 ${symbol} 失败：未知错误`;
    }
}
function formatIndexData(quoteData) {
    const quote = quoteData.quote;
    const isGrowing = quote.percent > 0;
    const trend = isGrowing ? '📈' : '📉';
    let text = quote?.name
        ? `${quote.name}${quote.symbol ? ` (${quote.symbol})` : ''}\n`
        : '';
    if (quote?.current && quote?.percent !== undefined) {
        text += `💰 现价：${quote.current} ${trend} ${isGrowing ? '+' : ''}${(0, utils_1.convertToNumber)(quote.percent)}%\n`;
    }
    if (quote?.amount) {
        text += `💎 成交额：${(0, utils_1.formatAmount)(quote.amount)}\n`;
    }
    if (quote?.current_year_percent !== undefined) {
        text += `📅 年初至今：${quote.current_year_percent > 0 ? '+' : ''}${(0, utils_1.convertToNumber)(quote.current_year_percent)}%`;
    }
    return text;
}
async function getCNMarketIndexData() {
    try {
        const data = (await Promise.all([
            getStockBasicData('SH000001'),
            getStockBasicData('SZ399001'),
            getStockBasicData('SZ399006'),
        ])).map(formatIndexData);
        data.push(await getGzjc());
        return `${data.join('\n')}`;
    }
    catch (error) {
        if (error instanceof Error) {
            return `❌ 获取市场指数失败：${error.message}`;
        }
        return `❌ 获取市场指数失败：未知错误`;
    }
}
async function getUSMarketIndexData() {
    try {
        const data = await Promise.all([
            getStockBasicData('.DJI'),
            getStockBasicData('.IXIC'),
            getStockBasicData('.INX'),
        ]);
        return `${data.map(formatIndexData).join('\n')}`;
    }
    catch (error) {
        if (error instanceof Error) {
            return `❌ 获取美国市场指数失败：${error.message}`;
        }
        return `❌ 获取美国市场指数失败：未知错误`;
    }
}
async function getHKMarketIndexData() {
    try {
        const data = await Promise.all([
            getStockBasicData('HSI'),
            getStockBasicData('HSCEI'),
            getStockBasicData('HSTECH'),
        ]);
        return `${data.map(formatIndexData).join('\n')}`;
    }
    catch (error) {
        if (error instanceof Error) {
            return `❌ 获取港股市场指数失败：${error.message}`;
        }
        return `❌ 获取港股市场指数失败：未知错误`;
    }
}
async function getStockDetailData(symbol) {
    try {
        const { quote } = await getStockBasicData(symbol);
        const isGrowing = quote.percent > 0;
        const trend = isGrowing ? '📈' : '📉';
        let text = `${quote?.name}(${quote?.symbol})\n`;
        text += `🏷️ 现价：${quote.current} ${trend} ${isGrowing ? '+' : ''}${(0, utils_1.convertToNumber)(quote.percent)}%\n`;
        text += `↕️ 振幅：${(0, utils_1.convertToNumber)(quote.amplitude)}%\n`;
        text += `⚡ 成交均价：${(0, utils_1.convertToNumber)(quote.avg_price)}\n`;
        text += `💫 成交额：${(0, utils_1.formatAmount)(quote.amount)}\n`;
        text += `📊 成交量：${(0, utils_1.formatAmount)(quote.volume)}手\n`;
        text += `🔁 换手率：${(0, utils_1.convertToNumber)(quote.turnover_rate)}%\n`;
        text += `🏢 总市值：${(0, utils_1.formatAmount)(quote.market_capital)}\n`;
        text += `📆 年初至今：${quote.current_year_percent > 0 ? '+' : ''}${(0, utils_1.convertToNumber)(quote.current_year_percent)}%\n`;
        text += `📌 市盈率TTM：${(0, utils_1.convertToNumber)(quote.pe_ttm || 0)}\n`;
        text += `📋 市净率：${(0, utils_1.convertToNumber)(quote.pb || 0)}`;
        if (quote.dividend_yield) {
            text += `\n💰 股息率：${(0, utils_1.convertToNumber)(quote.dividend_yield)}%`;
        }
        return text;
    }
    catch (error) {
        if (error instanceof Error) {
            return `❌ 获取 ${symbol} 详情失败：${error.message}`;
        }
        return `❌ 获取 ${symbol} 详情失败：未知错误`;
    }
}
const FUTURES_CACHE_EXPIRATION = 60 * 60 * 1000;
let futuresCache = null;
async function fetchCFFEXFuturesCodes(forceUpdate = false) {
    const now = Date.now();
    if (!forceUpdate && futuresCache && now - futuresCache.timestamp < FUTURES_CACHE_EXPIRATION) {
        logger.log('使用缓存的期货代码');
        return futuresCache.data;
    }
    if (forceUpdate) {
        logger.log('强制更新期货代码');
    }
    else {
        logger.log('缓存过期，获取最新期货代码');
    }
    try {
        const response = await axios_1.default.get('http://www.cffex.com.cn/quote_IF.txt');
        const data = response.data;
        const lines = data.trim().split('\n');
        const futureCodes = [];
        for (const line of lines) {
            const fields = line.split(',');
            if (fields.length > 0 && fields[0].startsWith('IF')) {
                futureCodes.push(fields[0]);
            }
        }
        if (futureCodes.length === 0) {
            throw new Error('❌ 无法从中金所获取期货代码');
        }
        logger.log(`成功获取期货代码: ${futureCodes.join(', ')}`);
        futuresCache = {
            data: futureCodes,
            timestamp: now
        };
        return futureCodes;
    }
    catch (error) {
        logger.error('获取期货代码失败:', error);
        if (futuresCache) {
            logger.warn('使用过期的缓存数据');
            return futuresCache.data;
        }
        throw error;
    }
}
async function getGzjc() {
    try {
        async function processFutureCodes(isRetry = false) {
            const futureCodes = await fetchCFFEXFuturesCodes(isRetry);
            try {
                return await Promise.all(futureCodes.map(async (code) => {
                    const suggest = await (0, stock_1.getStockSuggest)(code, [
                        stock_1.FinancialProductType.FUTURES,
                    ]);
                    if (!suggest) {
                        throw new Error(`❌ 获取 ${code} 期货失败`);
                    }
                    const detail = await (0, stock_1.fetchStockDetailData)(suggest);
                    return {
                        code,
                        price: detail.resultData.tplData.result.minute_data?.cur.price,
                        holdingAmount: detail.resultData.tplData.result.minute_data?.pankouinfos
                            .origin_pankou.holdingAmount,
                    };
                }));
            }
            catch (error) {
                if (!isRetry) {
                    logger.warn(`期货数据获取失败，强制更新期货代码并整体重试: ${error.message}`);
                    return await processFutureCodes(true);
                }
                throw error;
            }
        }
        const results = await processFutureCodes();
        const hs300 = await (0, stock_1.getStockSuggest)('000300', [stock_1.FinancialProductType.INDEX]);
        if (!hs300) {
            throw new Error(`❌ 获取 沪深300 数据失败`);
        }
        const holdingAmountTotal = results.reduce((sum, item) => sum + Number(item.holdingAmount), 0);
        const weightedPriceSum = results.reduce((sum, item) => sum +
            ((Number(item.holdingAmount) || 0) / holdingAmountTotal) *
                (Number(item.price) || 0), 0);
        const diff = Number(hs300.price) - Number(weightedPriceSum);
        return `沪深300股指基差：${diff.toFixed(2)}`;
    }
    catch (error) {
        return error.message;
    }
}
//# sourceMappingURL=stockInfo.js.map