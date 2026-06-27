import axios from 'axios';
import { Logger } from '@nestjs/common';
import { convertToNumber } from '../../../utils';

const Binance_API_URL = 'https://data-api.binance.vision/api/v3/ticker/24hr';
const logger = new Logger('Crypto');
const Bitget_API_URL = 'https://api.bitget.com/api/v2/spot/market/tickers';
const Bybit_API_URL = 'https://api.bybit.com/v5/market/tickers';
const Gateio_API_URL = 'https://www.gate.io/apiw/v2/market/tickers';
const CoinGecko_Markets_API_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const CoinGecko_Coin_API_URL = 'https://api.coingecko.com/api/v3/coins';

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
  // 时间戳
  time: number;
}

interface GateioData {
  timestamp: number;
  method: string;
  code: number;
  message: string;
  page?: any;
  limit?: any;
  total?: any;
  data: {
    pair: string;
    type: number;
    rate: string;
    open: string;
    high_24h: string;
    low_24h: string;
    vol_base: string;
    vol_quote: string;
    change: string;
    inflow_usd_24h: string;
    rankCap: string;
    marketCap: string;
    rank_cap: string;
    market_cap: string;
  };
}

interface Response {
  success: boolean;
  text: string;
}

interface CoinGeckoMarketCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
}

interface CoinGeckoHistoryResponse {
  market_data?: {
    current_price?: {
      usd?: number;
    };
  };
}

interface CryptoDetailQuote {
  name: string;
  symbol: string;
  currentPrice?: number;
  priceChangePercentage24h?: number;
  currentYearPercent?: number;
  marketCap?: number;
  totalVolume?: number;
  marketCapRank?: number;
}

const USD_COMPACT_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 2,
});

export async function getCryptoData(symbol: string): Promise<string> {
  try {
    const symbols = symbol.split(/\s+/); // 按空格分割多个交易对代码
    const results = await getMultipleCryptosData(symbols);
    return results.join('\n'); // 用两个换行符分隔每个交易对的数据，增加可读性
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取 ${symbol} 失败：${error.message}`;
    }
    return `❌ 获取 ${symbol} 失败：未知错误`;
  }
}

export async function getCryptoDetailData(symbol: string): Promise<string> {
  try {
    const symbols = symbol.split(/\s+/);
    const results = await Promise.all(
      symbols.map((item) => getSingleCryptoDetailData(item)),
    );
    return results.join('\n\n');
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取 ${symbol} 详情失败：${error.message}`;
    }
    return `❌ 获取 ${symbol} 详情失败：未知错误`;
  }
}

async function getSingleCryptoDetailData(symbol: string): Promise<string> {
  try {
    const marketCoin = await getCoinGeckoMarketCoin(symbol);
    const currentPrice =
      typeof marketCoin.current_price === 'number'
        ? marketCoin.current_price
        : undefined;
    const currentYearPercent = await getCoinGeckoCurrentYearPercent(
      marketCoin.id,
      currentPrice,
    );

    return formatCryptoDetailResponse({
      name: marketCoin.name,
      symbol: marketCoin.symbol.toUpperCase(),
      currentPrice,
      priceChangePercentage24h:
        typeof marketCoin.price_change_percentage_24h === 'number'
          ? marketCoin.price_change_percentage_24h
          : undefined,
      currentYearPercent,
      marketCap:
        typeof marketCoin.market_cap === 'number'
          ? marketCoin.market_cap
          : undefined,
      totalVolume:
        typeof marketCoin.total_volume === 'number'
          ? marketCoin.total_volume
          : undefined,
      marketCapRank:
        typeof marketCoin.market_cap_rank === 'number'
          ? marketCoin.market_cap_rank
          : undefined,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取 ${symbol} 详情失败：${error.message}`;
    }
    return `❌ 获取 ${symbol} 详情失败：未知错误`;
  }
}

async function getCoinGeckoMarketCoin(
  symbol: string,
): Promise<CoinGeckoMarketCoin> {
  const normalizedSymbol = symbol.trim().toLowerCase();
  if (!normalizedSymbol) {
    throw new Error('请输入数字货币代码，例如: bd btc');
  }

  const response = await axios.get<CoinGeckoMarketCoin[]>(
    CoinGecko_Markets_API_URL,
    {
      params: {
        vs_currency: 'usd',
        symbols: normalizedSymbol,
        include_tokens: 'top',
        precision: 'full',
      },
      validateStatus: () => true,
    },
  );

  if (response.status !== 200) {
    throw new Error(`CoinGecko 行情接口返回 ${response.status}`);
  }

  const coins = Array.isArray(response.data) ? response.data : [];
  const candidates = coins
    .filter((item) => item?.symbol?.toLowerCase() === normalizedSymbol)
    .sort((a, b) => {
      const rankA = a.market_cap_rank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.market_cap_rank ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

  const marketCoin = candidates[0];
  if (!marketCoin) {
    throw new Error('未找到相关数字货币');
  }

  return marketCoin;
}

async function getCoinGeckoCurrentYearPercent(
  coinId: string,
  currentPrice?: number,
): Promise<number | undefined> {
  if (!currentPrice || currentPrice <= 0) {
    return undefined;
  }

  const currentYear = new Date().getFullYear();
  const response = await axios.get<CoinGeckoHistoryResponse>(
    `${CoinGecko_Coin_API_URL}/${encodeURIComponent(coinId)}/history`,
    {
      params: {
        date: `01-01-${currentYear}`,
        localization: false,
      },
      validateStatus: () => true,
    },
  );

  if (response.status !== 200) {
    return undefined;
  }

  const startPrice = response.data?.market_data?.current_price?.usd;
  if (typeof startPrice !== 'number' || !Number.isFinite(startPrice) || startPrice <= 0) {
    return undefined;
  }

  return ((currentPrice - startPrice) / startPrice) * 100;
}

function formatUsdPrice(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '-';
  }

  if (value >= 1000) {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (value >= 1) {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }

  if (value >= 0.01) {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })}`;
  }

  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })}`;
}

function formatUsdCompactAmount(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '-';
  }

  return `$${USD_COMPACT_FORMATTER.format(value)}`;
}

function formatSignedPercent(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '暂不可用';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${convertToNumber(value)}%`;
}

export function formatCryptoDetailResponse(detail: CryptoDetailQuote): string {
  const dayPercent = detail.priceChangePercentage24h;
  const has24hPercent =
    typeof dayPercent === 'number' && Number.isFinite(dayPercent);
  const isGrowing = has24hPercent && dayPercent > 0;
  const dayChangeText = has24hPercent
    ? `${isGrowing ? '📈' : '📉'} ${formatSignedPercent(
        dayPercent,
      )}`
    : '暂不可用';

  return [
    `${detail.name} (${detail.symbol})`,
    `现价：${formatUsdPrice(detail.currentPrice)}`,
    `24h：${dayChangeText}`,
    `今年以来：${formatSignedPercent(detail.currentYearPercent)}`,
    `总市值：${formatUsdCompactAmount(detail.marketCap)}`,
    `24h 成交额：${formatUsdCompactAmount(detail.totalVolume)}`,
  ].join('\n');
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
      // 后续可以在这里添加更多数据源
    ];

    // 按优先级依次尝试获取数据
    for (const source of dataSources) {
      try {
        const result = await source.fetch();
        if (result.success) {
          return result.text;
        }
        logger.warn(`${source.name} 数据获取失败，尝试下一个数据源`);
      } catch (error) {
        logger.error(`${source.name} API 调用出错:`, error);
        continue;
      }
    }

    return `获取 ${symbol} 数据失败`;
  } catch (error) {
    return `获取 ${symbol} 数据失败: ${error.message}`;
  }
}

export async function getBitgetData(symbol: string) {
  try {
    const formatSymbol = `${symbol.toLocaleUpperCase()}USDT`;

    const response = await axios.get<BitgetData>(Bitget_API_URL, {
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
    } else {
      return {
        success: false,
        text: `获取 ${symbol} 数据失败: ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      text: `获取 ${symbol} 数据失败: ${error.message}`,
    };
  }
}

export async function getBinanceData(symbol: string): Promise<Response> {
  try {
    const formatSymbol = `${symbol.toLocaleUpperCase()}USDT`;

    const response = await axios.get<BinanceData>(Binance_API_URL, {
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
    } else {
      return {
        success: false,
        text: `获取 ${symbol} 数据失败: ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      text: `获取 ${symbol} 数据失败: ${error.message}`,
    };
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
    });

    if (response.status === 200 && response.data.retCode == 0) {
      const data = response.data.result.list.find(
        (item) => item.symbol == formatSymbol,
      );

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
    } else {
      return {
        success: false,
        text: `获取 ${symbol} 数据失败: ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      text: `获取 ${symbol} 数据失败: ${error.message}`,
    };
  }
}

export async function getGateioData(symbol: string): Promise<Response> {
  try {
    const formatSymbol = `${symbol.toLocaleUpperCase()}_USDT`;

    const response = await axios.get<GateioData>(
      Gateio_API_URL + '/' + formatSymbol,
    );

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
    } else {
      return {
        success: false,
        text: `获取 ${symbol} 数据失败: ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      text: `获取 ${symbol} 数据失败: ${error.message}`,
    };
  }
}
