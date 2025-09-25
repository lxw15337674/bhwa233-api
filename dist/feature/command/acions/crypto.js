"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCryptoData = getCryptoData;
exports.getCryptoBasicData = getCryptoBasicData;
exports.getBitgetData = getBitgetData;
exports.getBinanceData = getBinanceData;
exports.getBybitData = getBybitData;
exports.getGateioData = getGateioData;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
const Binance_API_URL = 'https://data-api.binance.vision/api/v3/ticker/24hr';
const logger = new common_1.Logger('Crypto');
const Bitget_API_URL = 'https://api.bitget.com/api/v2/spot/market/tickers';
const Bybit_API_URL = 'https://api.bybit.com/v5/market/tickers';
const Gateio_API_URL = 'https://www.gate.io/apiw/v2/market/tickers';
async function getCryptoData(symbol) {
    try {
        const symbols = symbol.split(/\s+/);
        const results = await getMultipleCryptosData(symbols);
        return results.join('\n');
    }
    catch (error) {
        if (error instanceof Error) {
            return `❌ 获取 ${symbol} 失败：${error.message}`;
        }
        return `❌ 获取 ${symbol} 失败：未知错误`;
    }
}
async function getMultipleCryptosData(symbols) {
    const promises = symbols.map(async (symbol) => {
        try {
            return await getCryptoBasicData(symbol);
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
async function getCryptoBasicData(symbol) {
    try {
        const dataSources = [
            {
                name: 'Binance',
                fetch: () => getBinanceData(symbol),
            },
            {
                name: 'Bitget',
                fetch: () => getBitgetData(symbol),
            },
            {
                name: 'Bybit',
                fetch: () => getBybitData(symbol),
            },
            {
                name: 'Gateio',
                fetch: () => getGateioData(symbol),
            },
        ];
        for (const source of dataSources) {
            try {
                const result = await source.fetch();
                if (result.success) {
                    return result.text;
                }
                logger.warn(`${source.name} 数据获取失败，尝试下一个数据源`);
            }
            catch (error) {
                logger.error(`${source.name} API 调用出错:`, error);
                continue;
            }
        }
        return `获取 ${symbol} 数据失败`;
    }
    catch (error) {
        return `获取 ${symbol} 数据失败: ${error.message}`;
    }
}
async function getBitgetData(symbol) {
    try {
        const formatSymbol = `${symbol.toLocaleUpperCase()}USDT`;
        const response = await axios_1.default.get(Bitget_API_URL, {
            params: {
                symbol: formatSymbol,
            },
        });
        if (response.status === 200 && response.data.code == '00000') {
            const { data } = response;
            const result = data.data.find((item) => item.symbol == formatSymbol);
            if (!result) {
                return {
                    success: false,
                    text: `未找到 ${symbol} 的数据`,
                };
            }
            const price = Number(result.lastPr);
            const percent = (Number(result.change24h) * 100).toFixed(2);
            const isGrowing = Number(percent) > 0;
            const text = `${result.symbol}: $${price} (${isGrowing ? '📈' : '📉'}${percent}%)`;
            return {
                success: true,
                text,
            };
        }
        else {
            return {
                success: false,
                text: `获取 ${symbol} 数据失败: ${response.status}`,
            };
        }
    }
    catch (error) {
        return {
            success: false,
            text: `获取 ${symbol} 数据失败: ${error.message}`,
        };
    }
}
async function getBinanceData(symbol) {
    try {
        const formatSymbol = `${symbol.toLocaleUpperCase()}USDT`;
        const response = await axios_1.default.get(Binance_API_URL, {
            params: {
                symbol: formatSymbol,
            },
        });
        if (response.status === 200) {
            const { data } = response;
            const price = Number(data.lastPrice);
            const percent = Number(data.priceChangePercent).toFixed(2);
            const isGrowing = Number(percent) > 0;
            const text = `${data.symbol}: $${price} (${isGrowing ? '📈' : '📉'}${percent}%)`;
            return {
                success: true,
                text,
            };
        }
        else {
            return {
                success: false,
                text: `获取 ${symbol} 数据失败: ${response.status}`,
            };
        }
    }
    catch (error) {
        return {
            success: false,
            text: `获取 ${symbol} 数据失败: ${error.message}`,
        };
    }
}
async function getBybitData(symbol) {
    try {
        const formatSymbol = `${symbol.toLocaleUpperCase()}USDT`;
        const response = await axios_1.default.get(Bybit_API_URL, {
            params: {
                category: 'spot',
                symbol: formatSymbol,
            },
        });
        if (response.status === 200 && response.data.retCode == 0) {
            const data = response.data.result.list.find((item) => item.symbol == formatSymbol);
            if (!data) {
                return {
                    success: false,
                    text: `未找到 ${symbol} 的数据`,
                };
            }
            const price = Number(data.lastPrice);
            const percent = (Number(data.price24hPcnt) * 100).toFixed(2);
            const isGrowing = Number(percent) > 0;
            const text = `${data.symbol}: $${price} (${isGrowing ? '📈' : '📉'}${percent}%)`;
            return {
                success: true,
                text,
            };
        }
        else {
            return {
                success: false,
                text: `获取 ${symbol} 数据失败: ${response.status}`,
            };
        }
    }
    catch (error) {
        return {
            success: false,
            text: `获取 ${symbol} 数据失败: ${error.message}`,
        };
    }
}
async function getGateioData(symbol) {
    try {
        const formatSymbol = `${symbol.toLocaleUpperCase()}_USDT`;
        const response = await axios_1.default.get(Gateio_API_URL + '/' + formatSymbol);
        if (response.status === 200 && response.data.code === 200) {
            const { data } = response;
            const price = Number(data.data.rate);
            const percent = Number(data.data.change).toFixed(2);
            const isGrowing = Number(percent) > 0;
            const text = `${symbol.toLocaleUpperCase()}USDT: $${price} (${isGrowing ? '📈' : '📉'}${percent}%)`;
            return {
                success: true,
                text,
            };
        }
        else {
            return {
                success: false,
                text: `获取 ${symbol} 数据失败: ${response.status}`,
            };
        }
    }
    catch (error) {
        return {
            success: false,
            text: `获取 ${symbol} 数据失败: ${error.message}`,
        };
    }
}
//# sourceMappingURL=crypto.js.map