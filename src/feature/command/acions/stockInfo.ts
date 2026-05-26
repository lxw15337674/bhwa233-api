import axios from 'axios';
import { Logger } from '@nestjs/common';
import { convertToNumber, formatAmount } from '../../../utils';
import {
  getStockSuggest,
  FinancialProductType,
} from './stock';

interface Market {
  status_id: number; // 市场状态ID，2代表盘前交易
  region: string; // 地区，例如 "US" 代表美国
  status: string; // 市场状态描述，例如 "盘前交易",5代表盘中交易
  time_zone: string; // 时区，例如 "America/New_York"
  time_zone_desc: string | null; // 时区描述
  delay_tag: number; // 延迟标识
  downgrade_night_session?: boolean; // 是否降级夜盘
  daylight_savings?: boolean; // 是否采用夏令时
}

interface Quote {
  flat_count?: number; // 平盘数
  fall_count?: number; // 下跌数
  rise_count?: number; // 上涨数
  current_ext?: number; // 当前价格（扩展精度）
  symbol: string; // 股票代码
  high52w: number; // 52 周最高价
  percent_ext?: number; // 涨跌幅（扩展精度）
  delayed: number; // 延迟标识
  type: number; // 股票类型
  tick_size: number; // 最小变动单位
  float_shares: number | null; // 流通股数
  high: number; // 当日最高价
  float_market_capital: number | null; // 流通市值
  timestamp_ext?: number; // 时间戳（扩展精度）
  lot_size: number; // 每手股数
  lock_set: number; // 锁定标识
  chg: number; // 涨跌额
  eps?: number; // 每股收益
  last_close: number; // 昨日收盘价
  profit_four?: number; // 四季度净利润
  volume: number; // 成交量
  volume_ratio: number; // 量比
  profit_forecast?: number; // 预测净利润
  turnover_rate: number; // 换手率
  low52w: number; // 52 周最低价
  name: string; // 股票名称
  exchange: string; // 交易所
  pe_forecast?: number; // 预测市盈率
  total_shares: number; // 总股本
  status: number; // 股票状态
  code: string; // 股票代码
  goodwill_in_net_assets?: number; // 商誉占净资产比例
  avg_price: number; // 平均价格
  percent: number; // 涨跌幅
  psr?: number; // 市销率
  amplitude: number; // 振幅
  current: number; // 当前价格
  current_year_percent: number; // 年初至今涨跌幅
  issue_date: number; // 上市日期（时间戳）
  sub_type: string | null; // 子类型
  low: number; // 当日最低价
  market_capital: number; // 总市值
  shareholder_funds?: number; // 股东权益
  dividend?: number | null; // 股息
  dividend_yield?: number | null; // 股息率
  currency: string; // 货币单位
  chg_ext?: number; // 涨跌额（扩展精度）
  navps?: number; // 每股净资产
  profit?: number; // 净利润
  beta?: number | null; // 贝塔系数
  timestamp: number; // 时间戳
  pe_lyr?: number; // 静态市盈率
  amount: number; // 成交额
  pledge_ratio?: number | null; // 质押比例
  short_ratio?: number | null; // 做空比例
  inst_hld?: number | null; // 机构持股比例
  pb?: number; // 市净率
  pe_ttm?: number; // 滚动市盈率
  contract_size?: number; // 合约单位
  variable_tick_size?: string; // 可变最小变动单位
  time: number; // 时间（时间戳）
  open: number; // 开盘价
}

interface Others {
  pankou_ratio: number | null; // 盘口比例
  cyb_switch: boolean; // 创业板标识
}

interface Tag {
  description: string; // 标签描述
  value: number; // 标签值
}

interface StockData {
  data: {
    market: Market; // 市场相关信息
    quote: Quote; // 股票报价信息
    others: Others; // 其他信息
    tags: Tag[]; // 标签信息
  };
  error_code: number; // 错误代码
  error_description: string; // 错误描述
}

const STOCK_API_URL = 'https://stock.xueqiu.com/v5/stock/quote.json'; // Replace with your actual API URL
const SUGGESTION_API_URL = 'https://xueqiu.com/query/v1/suggest_stock.json'; // Replace with your actual API URL
const TENCENT_SMARTBOX_API_URL =
  'https://proxy.finance.qq.com/ifzqgtimg/appstock/smartbox/search/get';
const logger = new Logger('StockInfo');
// 
const STOCK_TAG_API_URL = 'https://raw.githubusercontent.com/lxw15337674/stock-json/refs/heads/main/stockGroup.json';


// 读取环境变量
let Cookie = '';
let cookieTimestamp = 0;
const COOKIE_EXPIRATION_TIME = 1 * 24 * 60 * 60 * 1000; // 2天

export async function getToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && Cookie && now - cookieTimestamp < COOKIE_EXPIRATION_TIME) {
    return Cookie;
  }

  const response = await axios.get('https://xueqiu.com/', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      Referer: 'https://xueqiu.com/',
      Accept: 'application/json, text/plain, */*',
    },
  });

  const cookie = buildCookieFromSetCookieHeader(response.headers['set-cookie']);
  if (!cookie) {
    throw new Error('❌ Failed to get xueqiu cookies.');
  }

  Cookie = cookie;
  cookieTimestamp = now;
  return Cookie;
}

function buildCookieFromSetCookieHeader(setCookie?: string[]): string {
  if (!Array.isArray(setCookie) || setCookie.length === 0) {
    return '';
  }

  const cookieMap = new Map<string, string>();
  for (const row of setCookie) {
    const pair = row?.split(';')?.[0]?.trim();
    if (!pair || !pair.includes('=')) {
      continue;
    }
    const [name, ...rest] = pair.split('=');
    if (!name || rest.length === 0) {
      continue;
    }
    const value = rest.join('=').trim();
    if (!value) {
      continue;
    }
    cookieMap.set(name.trim(), `${name.trim()}=${value}`);
  }

  if (cookieMap.size === 0) {
    return '';
  }
  return `${Array.from(cookieMap.values()).join(';')};`;
}

// https://xueqiu.com/query/v1/suggest_stock.json?q=gzmt
export async function getSuggestStock(q: string): Promise<string | undefined> {
  const query = q.trim();
  if (!query) {
    return undefined;
  }

  const directSymbol = normalizeDirectSymbol(query);
  if (directSymbol) {
    return directSymbol;
  }

  const xueqiuSymbol = await getSuggestStockFromXueqiu(query);
  if (xueqiuSymbol) {
    return xueqiuSymbol;
  }

  const tencentSymbol = await getSuggestStockFromTencent(query);
  if (tencentSymbol) {
    return tencentSymbol;
  }
  return undefined;
}

function normalizeDirectSymbol(query: string): string | undefined {
  const symbol = query.trim();

  if (/^(SH|SZ|BJ)\d{6}$/i.test(symbol)) {
    return symbol.toUpperCase();
  }

  if (/^HK\d{5}$/i.test(symbol)) {
    return symbol.slice(2);
  }

  if (/^\d{6}$/.test(symbol)) {
    if (/^(60|68|90)/.test(symbol)) return `SH${symbol}`;
    if (/^(00|30|12|15|16|18|20)/.test(symbol)) return `SZ${symbol}`;
    if (/^(4|8)/.test(symbol)) return `BJ${symbol}`;
    return symbol;
  }

  if (/^\d{5}$/.test(symbol)) {
    return symbol;
  }

  if (/^\.[A-Z]{2,8}$/.test(symbol)) {
    return symbol.toUpperCase();
  }

  if (/^[A-Z]{2,10}$/.test(symbol)) {
    const hkIndexMap: Record<string, string> = {
      HSI: 'HKHSI',
      HSCEI: 'HKHSCEI',
      HSTECH: 'HKHSTECH',
    };
    if (hkIndexMap[symbol]) {
      return hkIndexMap[symbol];
    }
    // 港股指数/美股代码，如 HSI、AAPL、TX
    return symbol.toUpperCase();
  }

  return undefined;
}

async function getSuggestStockFromXueqiu(
  query: string,
): Promise<string | undefined> {
  try {
    const response = await requestXueqiuSuggest(query);
    const symbol = pickXueqiuSuggestSymbol(response, query);
    if (symbol) {
      return symbol;
    }

    const blockedByLogin = response?.code === 400016 || response?.success === false;
    if (blockedByLogin) {
      const retryResp = await requestXueqiuSuggest(query, true);
      return pickXueqiuSuggestSymbol(retryResp, query);
    }
  } catch (error) {
    logger.warn(`xueqiu suggest failed for "${query}"`);
  }

  return undefined;
}

interface XueqiuSuggestItem {
  code?: string;
  symbol?: string;
  market?: string;
  query?: string;
}

interface XueqiuSuggestResponse {
  code?: number;
  success?: boolean;
  data?: XueqiuSuggestItem[] | { items?: XueqiuSuggestItem[] };
}

async function requestXueqiuSuggest(
  query: string,
  forceRefresh = false,
): Promise<XueqiuSuggestResponse> {
  const response = await axios.get<XueqiuSuggestResponse>(SUGGESTION_API_URL, {
    params: {
      q: query,
    },
    headers: {
      Cookie: await getToken(forceRefresh),
      Referer: 'https://xueqiu.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
    },
    validateStatus: () => true,
  });
  return response.data ?? {};
}

function pickXueqiuSuggestSymbol(
  response: XueqiuSuggestResponse,
  query: string,
): string | undefined {
  const items = Array.isArray(response?.data)
    ? response.data
    : response?.data?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return undefined;
  }

  const queryUpper = query.toUpperCase();
  const best =
    items.find((item) => {
      const code = (item?.code || item?.symbol || '').toUpperCase();
      const alias = (item?.query || '').toUpperCase();
      return code === queryUpper || alias === queryUpper;
    }) ?? items[0];
  return mapXueqiuStockToSymbol(best);
}

function mapXueqiuStockToSymbol(item: XueqiuSuggestItem): string | undefined {
  const raw = (item?.code || item?.symbol || '').trim();
  if (!raw) {
    return undefined;
  }

  const market = (item?.market || '').trim().toUpperCase();
  if (market === 'HK' && /^\d+$/.test(raw)) {
    return raw.padStart(5, '0');
  }
  if (market === 'US') {
    return raw.toUpperCase();
  }
  if (market === 'SH' || market === 'SZ' || market === 'BJ') {
    if (/^\d{6}$/.test(raw)) {
      return `${market}${raw}`;
    }
    return raw.toUpperCase();
  }

  return normalizeDirectSymbol(raw) ?? raw.toUpperCase();
}

type TencentSmartboxItem = [string, string, string, string];

function mapTencentStockToSymbol(
  item: TencentSmartboxItem,
): string | undefined {
  const [market, rawCode] = item;
  const code = (rawCode || '').trim();
  const marketLower = (market || '').trim().toLowerCase();
  if (!code || !marketLower) {
    return undefined;
  }

  if (marketLower === 'sh' || marketLower === 'sz' || marketLower === 'bj') {
    return `${marketLower.toUpperCase()}${code}`;
  }

  if (marketLower === 'hk') {
    if (/^\d+$/.test(code)) {
      return code.padStart(5, '0');
    }
    return `HK${code.toUpperCase()}`;
  }

  if (marketLower === 'us') {
    // 腾讯可能返回 brk.b.us，去掉最后的市场后缀并转大写
    const parts = code.split('.');
    if (parts.length >= 2) {
      return parts.slice(0, parts.length - 1).join('.').toUpperCase();
    }
    return code.toUpperCase();
  }

  return undefined;
}

async function getSuggestStockFromTencent(
  query: string,
): Promise<string | undefined> {
  try {
    const response = await axios.get(TENCENT_SMARTBOX_API_URL, {
      params: {
        q: query,
      },
    });

    const stockList: TencentSmartboxItem[] = response?.data?.data?.stock ?? [];
    if (!Array.isArray(stockList) || stockList.length === 0) {
      return undefined;
    }

    const queryUpper = query.toUpperCase();
    const byExactCode =
      stockList.find((item) => {
        const code = (item?.[1] || '').toUpperCase();
        const abbr = (item?.[3] || '').toUpperCase();
        return code === queryUpper || abbr === queryUpper;
      }) ?? stockList[0];

    return mapTencentStockToSymbol(byExactCode);
  } catch (error) {
    logger.warn(`tencent smartbox failed for "${query}"`);
    return undefined;
  }
}

async function retryWithNewToken<T>(
  fetchFunction: () => Promise<T>,
): Promise<T> {
  try {
    return await fetchFunction();
  } catch (error) {
    // 重新获取 Cookie 并重试
    Cookie = '';
    cookieTimestamp = 0;
    try {
      return await fetchFunction();
    } catch (retryError: unknown) {
      if (retryError instanceof Error) {
        throw new Error(`❌ Failed after retry: ${retryError.message}`);
      }
      throw new Error('❌ Failed after retry: Unknown error');
    }
  }
}

export async function getStockBasicData(
  symbol: string,
): Promise<StockData['data']> {
  try {
    const suggestedSymbol = await getSuggestStock(symbol);

    if (!suggestedSymbol) throw new Error('未找到相关股票');

    const fetchStockData = async () => {
      const response = await axios.get(STOCK_API_URL, {
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
      } else {
        throw new Error(
          `❌ Failed to fetch stock data for ${suggestedSymbol}: ${response.status}`,
        );
      }
    };

    return await retryWithNewToken(fetchStockData);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('❌ Unknown error occurred');
  }
}

// 新增辅助函数用于并行获取多个股票数据
async function getMultipleStocksData(symbols: string[]): Promise<string[]> {
  const promises = symbols.map(async (symbol) => {
    try {
      const { quote, market } = await getStockBasicData(symbol);
      const isGrowing = quote.percent > 0;
      const trend = isGrowing ? '📈' : '📉';
      let text = `${quote?.name}(${quote?.symbol}): ${quote.current} (${trend}${isGrowing ? '+' : ''}${convertToNumber(quote.percent)}%)`;
      if (
        quote.current_ext &&
        quote.percent_ext &&
        quote.current !== quote.current_ext &&
        market.status_id !== 5
      ) {
        const preIsGrowing = quote.percent_ext > 0;
        const preTrend = preIsGrowing ? '📈' : '📉';
        text += `\n⏰ 盘前：${quote.current_ext} ${preTrend} ${preIsGrowing ? '+' : ''}${convertToNumber(quote.percent_ext)}%`;
      }
      return text;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return `❌ 获取 ${symbol} 失败：${error.message}`;
      }
      return `❌ 获取 ${symbol} 失败：未知错误`;
    }
  });
  return await Promise.all(promises);
}

export async function getStocksByTag(tag: string): Promise<string> {
  const response = await axios.get(STOCK_TAG_API_URL)
  const results = await getMultipleStocksData(response.data[tag])
  const textContent = results.join('\n'); // 用换行符分隔每个股票的数据
  try {
    return textContent;
  }
  catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取 ${tag} 失败：${error.message}`;
    }
    return `❌ 获取 ${tag} 失败：未知错误`;
  }
}

export async function getAllStockGroups(): Promise<string> {
  try {
    const response = await axios.get(STOCK_TAG_API_URL);
    const stockGroups = response.data;

    const tagNames = Object.keys(stockGroups);
    return `📊 股票分组标签列表：[${tagNames.join(', ')}]`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取股票分组列表失败：${error.message}`;
    }
    return `❌ 获取股票分组列表失败：未知错误`;
  }
}

export async function getStockCodesByTag(tag: string): Promise<string> {
  try {
    const response = await axios.get(STOCK_TAG_API_URL);
    const stockGroups = response.data;

    if (!stockGroups[tag]) {
      return `❌ 未找到标签 "${tag}" 的股票分组`;
    }

    const stockCodes = stockGroups[tag];
    if (!Array.isArray(stockCodes) || stockCodes.length === 0) {
      return `❌ 标签 "${tag}" 下没有股票代码`;
    }

    return `🏷️ ${tag} 股票代码：\n[${stockCodes.join(', ')}]`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取标签 "${tag}" 的股票代码失败：${error.message}`;
    }
    return `❌ 获取标签 "${tag}" 的股票代码失败：未知错误`;
  }
}

export async function getStockData(symbol: string): Promise<string> {
  try {
    const symbols = symbol.split(/\s+/); // 按空格分割多个股票代码
    const results = await retryWithNewToken(() =>
      getMultipleStocksData(symbols),
    );
    const textContent = results.join('\n'); // 用换行符分隔每个股票的数据
    try {
      return textContent;
    } catch (error) {
      logger.error('Error converting stock data to image:', error);
      // Fallback to text if image creation fails
      return textContent;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取 ${symbol} 失败：${error.message}`;
    }
    return `❌ 获取 ${symbol} 失败：未知错误`;
  }
}

function formatIndexData(quoteData: any) {
  const quote = quoteData.quote;
  const isGrowing = quote.percent > 0;
  const trend = isGrowing ? '📈' : '📉';

  let text = quote?.name
    ? `${quote.name}${quote.symbol ? ` (${quote.symbol})` : ''}\n`
    : '';
  if (quote?.current && quote?.percent !== undefined) {
    text += `💰 现价：${quote.current} ${trend} ${isGrowing ? '+' : ''}${convertToNumber(quote.percent)}%\n`;
  }

  if (quote?.amount) {
    text += `💎 成交额：${formatAmount(quote.amount)}\n`;
  }

  if (quote?.current_year_percent !== undefined) {
    text += `📅 年初至今：${quote.current_year_percent > 0 ? '+' : ''}${convertToNumber(quote.current_year_percent)}%`;
  }
  return text;
}

export async function getCNMarketIndexData() {
  try {
    const [data1, data2, data3, gzjcData] = await Promise.all([
      getStockBasicData('SH000001'),
      getStockBasicData('SZ399001'),
      getStockBasicData('SZ399006'),
      getGzjc()
    ]);

    const data = [
      formatIndexData(data1),
      formatIndexData(data2),
      formatIndexData(data3),
      gzjcData
    ];

    return `${data.join('\n')}`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取市场指数失败：${error.message}`;
    }
    return `❌ 获取市场指数失败：未知错误`;
  }
}

export async function getUSMarketIndexData() {
  try {
    const data = await Promise.all([
      getStockBasicData('.DJI'),
      getStockBasicData('.IXIC'),
      getStockBasicData('.INX'),
    ]);
    return `${data.map(formatIndexData).join('\n')}`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取美国市场指数失败：${error.message}`;
    }
    return `❌ 获取美国市场指数失败：未知错误`;
  }
}

export async function getHKMarketIndexData() {
  try {
    const data = await Promise.all([
      getStockBasicData('HSI'),
      getStockBasicData('HSCEI'),
      getStockBasicData('HSTECH'),
    ]);
    return `${data.map(formatIndexData).join('\n')}`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取港股市场指数失败：${error.message}`;
    }
    return `❌ 获取港股市场指数失败：未知错误`;
  }
}

export async function getStockDetailData(symbol: string): Promise<string> {
  try {
    const { quote } = await getStockBasicData(symbol);
    const isGrowing = quote.percent > 0;
    const trend = isGrowing ? '📈' : '📉';

    let text = `${quote?.name}(${quote?.symbol})\n`;
    text += `🏷️ 现价：${quote.current} ${trend} ${isGrowing ? '+' : ''}${convertToNumber(quote.percent)}%\n`;
    text += `↕️ 振幅：${convertToNumber(quote.amplitude)}%\n`;
    text += `⚡ 成交均价：${convertToNumber(quote.avg_price)}\n`;
    text += `💫 成交额：${formatAmount(quote.amount)}\n`;
    text += `📊 成交量：${formatAmount(quote.volume)}手\n`;
    text += `🔁 换手率：${convertToNumber(quote.turnover_rate)}%\n`;
    text += `🏢 总市值：${formatAmount(quote.market_capital)}\n`;
    text += `📆 年初至今：${quote.current_year_percent > 0 ? '+' : ''}${convertToNumber(quote.current_year_percent)}%\n`;
    text += `📌 市盈率TTM：${convertToNumber(quote.pe_ttm || 0)}\n`;
    text += `📋 市净率：${convertToNumber(quote.pb || 0)}`;

    if (quote.dividend_yield) {
      text += `\n💰 股息率：${convertToNumber(quote.dividend_yield)}%`;
    }

    return text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取 ${symbol} 详情失败：${error.message}`;
    }
    return `❌ 获取 ${symbol} 详情失败：未知错误`;
  }
}

interface FuturesData {
  instrument: string;
  lastprice: string;
  volume: string;
}

/**
 * 从中金所获取期货数据
 * @returns 期货数据数组（包含代码、最新价和成交量）
 */
export async function fetchCFFEXFuturesCodes(): Promise<FuturesData[]> {
  try {
    // 从中金所获取数据
    const response = await axios.get('http://www.cffex.com.cn/quote_IF.txt');
    const data = response.data;

    // 解析数据，提取 instrument、lastprice 和 volume
    // 数据格式: instrument,openprice,highest,lowest,lastprice,...,volume,position
    const lines = data.trim().split('\n');
    const futuresData: FuturesData[] = [];

    for (const line of lines) {
      const fields = line.split(',');
      if (fields.length >= 11 && fields[0].startsWith('IF')) {
        futuresData.push({
          instrument: fields[0],  // 期货代码
          lastprice: fields[4],   // 最新价
          volume: fields[10]      // 成交量
        });
      }
    }

    if (futuresData.length === 0) {
      throw new Error('❌ 无法从中金所获取期货数据');
    }

    logger.log(`成功获取期货数据: ${futuresData.map(d => `${d.instrument}:${d.lastprice}:${d.volume}`).join(', ')}`);

    return futuresData;
  } catch (error) {
    logger.error('获取期货数据失败:', error);
    throw error;
  }
}

export async function getGzjc() {
  try {
    // 并发获取期货数据和沪深300指数数据
    const [futuresData, hs300] = await Promise.all([
      fetchCFFEXFuturesCodes(),
      getStockSuggest('000300', [FinancialProductType.INDEX])
    ]);

    if (!hs300) {
      throw new Error(`❌ 获取 沪深300 数据失败`);
    }

    // 计算总持仓量
    const volumeTotal = futuresData.reduce(
      (sum, item) => sum + Number(item.volume),
      0,
    );

    // 计算加权平均价格
    const weightedPriceSum = futuresData.reduce(
      (sum, item) =>
        sum +
        ((Number(item.volume) || 0) / volumeTotal) *
        (Number(item.lastprice) || 0),
      0,
    );

    const diff = Number(hs300.price) - Number(weightedPriceSum);

    return `沪深300股指基差：${diff.toFixed(2)}`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ ${error.message}`;
    }
    return '❌ 获取股指基差失败：未知错误';
  }
}
