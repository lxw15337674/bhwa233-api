import axios from 'axios';
import { Logger } from '@nestjs/common';
import { convertToNumber, formatAmount } from '../../../utils';
import { getStockSuggest, FinancialProductType } from './stock';

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

interface EastmoneyStockResponse {
  rc: number;
  data?: {
    f43?: number | string;
    f44?: number | string;
    f45?: number | string;
    f46?: number | string;
    f47?: number | string;
    f48?: number | string;
    f57?: string;
    f58?: string;
    f59?: number;
    f60?: number | string;
    f116?: number | string;
    f122?: number | string;
    f162?: number | string;
    f167?: number | string;
    f168?: number | string;
    f169?: number | string;
    f170?: number | string;
    f171?: number | string;
  } | null;
}

interface EastmoneySuggestItem {
  Code?: string;
  UnifiedCode?: string;
  Name?: string;
  QuoteID?: string;
  SecurityTypeName?: string;
  Classify?: string;
}

interface EastmoneySuggestResponse {
  QuotationCodeTable?: {
    Data?: EastmoneySuggestItem[];
  };
}
interface ExtendedHoursQuote {
  label: '⏰ 盘前' | '🌙 盘后';
  price: number;
  percent: number;
  pricePrecision: number;
}

interface YahooExtendedHoursMetaLike {
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketPreviousClose?: number;
  regularMarketPrice?: number;
}

interface YahooQuoteResultLike extends YahooExtendedHoursMetaLike {
  marketState?: string;
  preMarketPrice?: number;
  preMarketChangePercent?: number;
  preMarketChange?: number;
  postMarketPrice?: number;
  postMarketChangePercent?: number;
  postMarketChange?: number;
}

export interface EastmoneyQuote {
  name: string;
  symbol: string;
  current: number;
  percent: number;
  pricePrecision: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  volume?: number;
  amount?: number;
  currentYearPercent?: number;
  marketCapital?: number;
  pe?: number;
  pb?: number;
  turnoverRate?: number;
  amplitude?: number;
  extended?: ExtendedHoursQuote;
}
const STOCK_API_URL = 'https://stock.xueqiu.com/v5/stock/quote.json'; // Replace with your actual API URL
const SUGGESTION_API_URL = 'https://xueqiu.com/query/v1/suggest_stock.json'; // Replace with your actual API URL
const TENCENT_SMARTBOX_API_URL =
  'https://proxy.finance.qq.com/ifzqgtimg/appstock/smartbox/search/get';
const EASTMONEY_STOCK_API_URL =
  'https://push2delay.eastmoney.com/api/qt/stock/get';
const EASTMONEY_SUGGEST_API_URL =
  'https://searchapi.eastmoney.com/api/suggest/get';
const YAHOO_QUOTE_API_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';
const YAHOO_CHART_API_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const EASTMONEY_STOCK_FIELDS = [
  'f43',
  'f44',
  'f45',
  'f46',
  'f47',
  'f48',
  'f57',
  'f58',
  'f59',
  'f60',
  'f116',
  'f122',
  'f162',
  'f167',
  'f168',
  'f169',
  'f170',
  'f171',
].join(',');
const logger = new Logger('StockInfo');
//
const STOCK_TAG_API_URL =
  'https://raw.githubusercontent.com/lxw15337674/stock-json/refs/heads/main/stockGroup.json';

// 读取环境变量
let Cookie = '';
let cookieTimestamp = 0;
const COOKIE_EXPIRATION_TIME = 1 * 24 * 60 * 60 * 1000; // 2天

export async function getToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (
    !forceRefresh &&
    Cookie &&
    now - cookieTimestamp < COOKIE_EXPIRATION_TIME
  ) {
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
  const tencentSymbol = await getSuggestStockFromTencent(query);
  const numericSymbol = resolveNumericSymbol(query, {
    xueqiuSymbol,
    tencentSymbol,
  });
  if (numericSymbol) {
    return numericSymbol;
  }

  if (xueqiuSymbol) {
    return xueqiuSymbol;
  }

  if (tencentSymbol) {
    return tencentSymbol;
  }

  if (/^[a-zA-Z][a-zA-Z0-9.-]{0,14}$/.test(query)) {
    return query.toUpperCase();
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

function normalizeNumericSymbolFallback(query: string): string | undefined {
  const symbol = query.trim();
  if (!/^\d{6}$/.test(symbol)) {
    return undefined;
  }

  if (/^(51|56|58|60|68|90|10|11)/.test(symbol)) return `SH${symbol}`;
  if (/^(00|12|15|16|18|20|30)/.test(symbol)) return `SZ${symbol}`;
  if (/^(4|8)/.test(symbol)) return `BJ${symbol}`;
  return undefined;
}

export function resolveNumericSymbol(
  query: string,
  suggestions: {
    xueqiuSymbol?: string;
    tencentSymbol?: string;
  } = {},
): string | undefined {
  const symbol = query.trim();
  if (!/^\d{6}$/.test(symbol)) {
    return undefined;
  }

  return (
    suggestions.xueqiuSymbol ||
    suggestions.tencentSymbol ||
    normalizeNumericSymbolFallback(symbol)
  );
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

    const blockedByLogin =
      response?.code === 400016 || response?.success === false;
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
  label?: string;
  stock_type?: number;
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

function hasChineseCharacter(text: string): boolean {
  return /[\u3400-\u9fff]/.test(text);
}

function normalizeSuggestText(text?: string): string {
  return (text || '').trim().toUpperCase();
}

function isAdrLikeLabel(text?: string): boolean {
  return /\bADR\b|\bADS\b|\bOTC\b|DEPOSITARY|存托|预托/i.test(text || '');
}

function getXueqiuSuggestMarket(item: XueqiuSuggestItem): string {
  const market = normalizeSuggestText(item.market);
  if (market) {
    return market;
  }

  const stockType = item.stock_type;
  if (stockType === 6) return 'US';
  if (stockType === 12 || stockType === 30) return 'HK';
  if (stockType === 1) return 'SH';
  if (stockType === 2) return 'SZ';
  if (stockType === 3) return 'BJ';
  return '';
}

function matchTextScore(text: string, query: string): number {
  if (!text) {
    return 0;
  }
  if (text === query) {
    return 100;
  }
  if (text.startsWith(query)) {
    return 80;
  }
  if (text.includes(query)) {
    return 60;
  }
  return 0;
}

function scoreXueqiuSuggestItem(
  item: XueqiuSuggestItem,
  query: string,
  hasHKCandidate: boolean,
  hasUSCandidate: boolean,
): number {
  const queryUpper = normalizeSuggestText(query);
  const code = normalizeSuggestText(item.code || item.symbol);
  const alias = normalizeSuggestText(item.query);
  const label = normalizeSuggestText(item.label);
  const market = getXueqiuSuggestMarket(item);

  let score = 0;

  if (code === queryUpper || alias === queryUpper) {
    score += 1000;
  }

  score += Math.max(
    matchTextScore(code, queryUpper),
    matchTextScore(alias, queryUpper),
    matchTextScore(label, queryUpper),
  );

  if (hasChineseCharacter(query) && hasHKCandidate && hasUSCandidate) {
    if (market === 'HK') {
      score += 80;
    }
    if (market === 'US') {
      score -= 20;
      if (isAdrLikeLabel(`${item.label || ''} ${item.query || ''}`)) {
        score -= 80;
      }
    }
  }

  return score;
}

export function pickXueqiuSuggestSymbol(
  response: XueqiuSuggestResponse,
  query: string,
): string | undefined {
  const items = Array.isArray(response?.data)
    ? response.data
    : response?.data?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return undefined;
  }

  const hasHKCandidate = items.some(
    (item) => getXueqiuSuggestMarket(item) === 'HK',
  );
  const hasUSCandidate = items.some(
    (item) => getXueqiuSuggestMarket(item) === 'US',
  );

  const best = items.reduce((currentBest, item) => {
    if (!currentBest) {
      return item;
    }

    const currentScore = scoreXueqiuSuggestItem(
      currentBest,
      query,
      hasHKCandidate,
      hasUSCandidate,
    );
    const nextScore = scoreXueqiuSuggestItem(
      item,
      query,
      hasHKCandidate,
      hasUSCandidate,
    );
    return nextScore > currentScore ? item : currentBest;
  }, items[0]);

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
      return parts
        .slice(0, parts.length - 1)
        .join('.')
        .toUpperCase();
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

    return pickTencentSuggestSymbol(stockList, query);
  } catch (error) {
    logger.warn(`tencent smartbox failed for "${query}"`);
    return undefined;
  }
}

function scoreTencentSuggestItem(
  item: TencentSmartboxItem,
  query: string,
  hasHKCandidate: boolean,
  hasUSCandidate: boolean,
): number {
  const [market, rawCode, name, abbr] = item;
  const queryUpper = normalizeSuggestText(query);
  const code = normalizeSuggestText(rawCode);
  const alias = normalizeSuggestText(abbr);
  const label = normalizeSuggestText(name);
  const marketUpper = normalizeSuggestText(market);

  let score = 0;

  if (code === queryUpper || alias === queryUpper) {
    score += 1000;
  }

  score += Math.max(
    matchTextScore(code, queryUpper),
    matchTextScore(alias, queryUpper),
    matchTextScore(label, queryUpper),
  );

  if (hasChineseCharacter(query) && hasHKCandidate && hasUSCandidate) {
    if (marketUpper === 'HK') {
      score += 80;
    }
    if (marketUpper === 'US') {
      score -= 20;
      if (isAdrLikeLabel(`${name || ''} ${abbr || ''}`)) {
        score -= 80;
      }
    }
  }

  return score;
}

export function pickTencentSuggestSymbol(
  stockList: TencentSmartboxItem[],
  query: string,
): string | undefined {
  if (!Array.isArray(stockList) || stockList.length === 0) {
    return undefined;
  }

  const hasHKCandidate = stockList.some(
    (item) => normalizeSuggestText(item?.[0]) === 'HK',
  );
  const hasUSCandidate = stockList.some(
    (item) => normalizeSuggestText(item?.[0]) === 'US',
  );

  const best = stockList.reduce((currentBest, item) => {
    if (!currentBest) {
      return item;
    }

    const currentScore = scoreTencentSuggestItem(
      currentBest,
      query,
      hasHKCandidate,
      hasUSCandidate,
    );
    const nextScore = scoreTencentSuggestItem(
      item,
      query,
      hasHKCandidate,
      hasUSCandidate,
    );
    return nextScore > currentScore ? item : currentBest;
  }, stockList[0]);

  return mapTencentStockToSymbol(best);
}

function getEastmoneySecid(
  symbol: string,
):
  | { secid: string; displaySymbol: string; pricePrecision: number }
  | undefined {
  const normalized =
    normalizeDirectSymbol(symbol) ?? symbol.trim().toUpperCase();

  const predefinedIndexSecidMap: Record<
    string,
    { secid: string; displaySymbol: string; pricePrecision: number }
  > = {
    '.DJI': { secid: '100.DJIA', displaySymbol: 'DJIA', pricePrecision: 2 },
    'DJI': { secid: '100.DJIA', displaySymbol: 'DJIA', pricePrecision: 2 },
    '.IXIC': { secid: '100.NDX', displaySymbol: 'NDX', pricePrecision: 2 },
    'IXIC': { secid: '100.NDX', displaySymbol: 'NDX', pricePrecision: 2 },
    '.INX': { secid: '100.SPX', displaySymbol: 'SPX', pricePrecision: 2 },
    'INX': { secid: '100.SPX', displaySymbol: 'SPX', pricePrecision: 2 },
    'HSI': { secid: '100.HSI', displaySymbol: 'HSI', pricePrecision: 2 },
    'HKHSI': { secid: '100.HSI', displaySymbol: 'HSI', pricePrecision: 2 },
    'HSCEI': {
      secid: '100.HSCEI',
      displaySymbol: 'HSCEI',
      pricePrecision: 2,
    },
    'HKHSCEI': {
      secid: '100.HSCEI',
      displaySymbol: 'HSCEI',
      pricePrecision: 2,
    },
    'HSTECH': {
      secid: '124.HSTECH',
      displaySymbol: 'HSTECH',
      pricePrecision: 2,
    },
    'HKHSTECH': {
      secid: '124.HSTECH',
      displaySymbol: 'HSTECH',
      pricePrecision: 2,
    },
  };

  if (predefinedIndexSecidMap[normalized]) {
    return predefinedIndexSecidMap[normalized];
  }

  if (/^SH\d{6}$/.test(normalized)) {
    return {
      secid: `1.${normalized.slice(2)}`,
      displaySymbol: normalized,
      pricePrecision: 2,
    };
  }

  if (/^SZ\d{6}$/.test(normalized)) {
    return {
      secid: `0.${normalized.slice(2)}`,
      displaySymbol: normalized,
      pricePrecision: 2,
    };
  }

  if (/^BJ\d{6}$/.test(normalized)) {
    return {
      secid: `0.${normalized.slice(2)}`,
      displaySymbol: normalized,
      pricePrecision: 2,
    };
  }

  if (/^\d{5}$/.test(normalized)) {
    return {
      secid: `116.${normalized}`,
      displaySymbol: normalized,
      pricePrecision: 3,
    };
  }

  if (/^HK\d{5}$/.test(normalized)) {
    const code = normalized.slice(2);
    return {
      secid: `116.${code}`,
      displaySymbol: code,
      pricePrecision: 3,
    };
  }

  return undefined;
}

async function resolveEastmoneySymbol(query: string): Promise<string> {
  const normalizedQuery = query.trim();
  const directSymbol = normalizeDirectSymbol(normalizedQuery);
  if (directSymbol) {
    return directSymbol;
  }

  const xueqiuSymbol = await getSuggestStockFromXueqiu(normalizedQuery);
  const tencentSymbol = await getSuggestStockFromTencent(normalizedQuery);
  const numericSymbol = resolveNumericSymbol(normalizedQuery, {
    xueqiuSymbol,
    tencentSymbol,
  });
  if (numericSymbol) {
    return numericSymbol;
  }

  if (xueqiuSymbol) {
    return xueqiuSymbol;
  }

  if (tencentSymbol) {
    return tencentSymbol;
  }

  if (/^[a-zA-Z][a-zA-Z0-9.-]{0,14}$/.test(normalizedQuery)) {
    return normalizedQuery.toUpperCase();
  }

  throw new Error('未找到相关股票');
}

function canResolveFromEastmoneySearch(symbol: string): boolean {
  return /^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol.trim().toUpperCase());
}

async function getEastmoneySecidFromSearch(
  symbol: string,
): Promise<
  { secid: string; displaySymbol: string; pricePrecision: number } | undefined
> {
  const query = symbol.trim().toUpperCase();
  if (!canResolveFromEastmoneySearch(query)) {
    return undefined;
  }

  const response = await axios.get<EastmoneySuggestResponse>(
    EASTMONEY_SUGGEST_API_URL,
    {
      params: {
        input: query,
        type: 14,
        count: 10,
      },
      validateStatus: () => true,
    },
  );

  if (response.status !== 200) {
    logger.warn(`eastmoney suggest failed for "${query}": ${response.status}`);
    return undefined;
  }

  const items = response.data?.QuotationCodeTable?.Data;
  if (!Array.isArray(items) || items.length === 0) {
    return undefined;
  }

  const exact =
    items.find((item) => {
      const code = (item.Code || item.UnifiedCode || '').toUpperCase();
      return code === query && item.QuoteID;
    }) ?? items.find((item) => !!item.QuoteID);

  if (!exact?.QuoteID) {
    return undefined;
  }

  return {
    secid: exact.QuoteID,
    displaySymbol: (exact.Code || exact.UnifiedCode || query).toUpperCase(),
    pricePrecision: 3,
  };
}
function parseEastmoneyScaledNumber(
  value: number | string | undefined,
  precision: number,
): number | undefined {
  if (value === undefined || value === null || value === '-') {
    return undefined;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return numericValue / Math.pow(10, precision);
}

function formatEastmoneyPrice(value: number, precision: number): string {
  const fixed = value.toFixed(precision);
  return fixed.includes('.')
    ? fixed.replace(/0+$/, '').replace(/\.$/, '')
    : fixed;
}

function formatEastmoneyOptionalPrice(
  value: number | undefined,
  precision: number,
): string {
  return value === undefined ? '-' : formatEastmoneyPrice(value, precision);
}

function formatEastmoneyOptionalPercent(value: number | undefined): string {
  return value === undefined ? '-' : `${convertToNumber(value)}%`;
}

function formatEastmoneyOptionalAmount(value: number | undefined): string {
  return value === undefined ? '-' : formatAmount(value);
}

function formatPositiveMetric(value: number | undefined): string | undefined {
  if (value === undefined || value <= 0) {
    return undefined;
  }
  return convertToNumber(value);
}

function isUSEastmoneySecid(secid: string): boolean {
  return /^(105|106|107)\./.test(secid);
}

function toYahooSymbol(symbol: string): string {
  return symbol.replace(/\./g, '-');
}

export function getExtendedHoursBasePrice(
  label: ExtendedHoursQuote['label'],
  meta: YahooExtendedHoursMetaLike | undefined,
  fallbackPreviousClose?: number,
): number | undefined {
  if (!meta) {
    return fallbackPreviousClose;
  }

  if (label === '⏰ 盘前') {
    return (
      meta.regularMarketPreviousClose ??
      fallbackPreviousClose ??
      meta.previousClose ??
      meta.chartPreviousClose
    );
  }

  return (
    meta.regularMarketPrice ??
    meta.regularMarketPreviousClose ??
    fallbackPreviousClose ??
    meta.previousClose ??
    meta.chartPreviousClose
  );
}

export function parseYahooQuoteExtendedHours(
  quote: YahooQuoteResultLike | undefined,
  pricePrecision: number,
  fallbackPreviousClose?: number,
): ExtendedHoursQuote | undefined {
  if (!quote) {
    return undefined;
  }

  if (
    typeof quote.preMarketPrice === 'number' &&
    Number.isFinite(quote.preMarketPrice)
  ) {
    const percent =
      typeof quote.preMarketChangePercent === 'number' &&
      Number.isFinite(quote.preMarketChangePercent)
        ? quote.preMarketChangePercent
        : undefined;
    const basePrice = getExtendedHoursBasePrice(
      '⏰ 盘前',
      quote,
      fallbackPreviousClose,
    );
    if (percent !== undefined || basePrice) {
      return {
        label: '⏰ 盘前',
        price: quote.preMarketPrice,
        percent:
          percent ??
          ((quote.preMarketPrice - (basePrice as number)) / (basePrice as number)) *
            100,
        pricePrecision,
      };
    }
  }

  if (
    typeof quote.postMarketPrice === 'number' &&
    Number.isFinite(quote.postMarketPrice)
  ) {
    const percent =
      typeof quote.postMarketChangePercent === 'number' &&
      Number.isFinite(quote.postMarketChangePercent)
        ? quote.postMarketChangePercent
        : undefined;
    const basePrice = getExtendedHoursBasePrice(
      '🌙 盘后',
      quote,
      fallbackPreviousClose,
    );
    if (percent !== undefined || basePrice) {
      return {
        label: '🌙 盘后',
        price: quote.postMarketPrice,
        percent:
          percent ??
          ((quote.postMarketPrice - (basePrice as number)) / (basePrice as number)) *
            100,
        pricePrecision,
      };
    }
  }

  return undefined;
}

function findLastCloseInPeriod(
  timestamps: number[] | undefined,
  closes: Array<number | null | undefined> | undefined,
  start: number,
  end: number,
): number | undefined {
  if (!Array.isArray(timestamps) || !Array.isArray(closes)) {
    return undefined;
  }

  for (
    let index = Math.min(timestamps.length, closes.length) - 1;
    index >= 0;
    index -= 1
  ) {
    const timestamp = timestamps[index];
    const close = closes[index];
    if (
      typeof timestamp === 'number' &&
      timestamp >= start &&
      timestamp < end &&
      typeof close === 'number' &&
      Number.isFinite(close)
    ) {
      return close;
    }
  }

  return undefined;
}

async function getYahooExtendedHoursQuote(
  symbol: string,
  pricePrecision: number,
  fallbackPreviousClose?: number,
): Promise<ExtendedHoursQuote | undefined> {
  try {
    const yahooSymbol = toYahooSymbol(symbol);
    const quoteResponse = await axios.get(YAHOO_QUOTE_API_URL, {
      params: { symbols: yahooSymbol },
      timeout: 2500,
      validateStatus: () => true,
    });
    if (quoteResponse.status === 200) {
      const quoteResult = quoteResponse.data?.quoteResponse?.result?.[0];
      const directQuote = parseYahooQuoteExtendedHours(
        quoteResult,
        pricePrecision,
        fallbackPreviousClose,
      );
      if (directQuote) {
        return directQuote;
      }
    } else {
      logger.warn(`yahoo quote failed for "${symbol}": ${quoteResponse.status}`);
    }

    const response = await axios.get(
      `${YAHOO_CHART_API_URL}/${encodeURIComponent(yahooSymbol)}`,
      {
        params: {
          interval: '1m',
          range: '1d',
          includePrePost: 'true',
        },
        timeout: 2500,
        validateStatus: () => true,
      },
    );

    if (response.status !== 200) {
      logger.warn(`yahoo chart failed for "${symbol}": ${response.status}`);
      return undefined;
    }

    const result = response.data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta?.hasPrePostMarketData) {
      return undefined;
    }

    const now = Math.floor(Date.now() / 1000);
    const pre = meta.currentTradingPeriod?.pre;
    const post = meta.currentTradingPeriod?.post;
    let label: ExtendedHoursQuote['label'] | undefined;
    let start: number | undefined;
    let end: number | undefined;
    let basePrice: number | undefined;

    if (
      typeof pre?.start === 'number' &&
      typeof pre?.end === 'number' &&
      now >= pre.start &&
      now < pre.end
    ) {
      label = '⏰ 盘前';
      start = pre.start;
      end = pre.end;
    } else if (
      typeof post?.start === 'number' &&
      typeof post?.end === 'number' &&
      now >= post.start &&
      now < post.end
    ) {
      label = '🌙 盘后';
      start = post.start;
      end = post.end;
    }

    if (label) {
      basePrice = getExtendedHoursBasePrice(
        label,
        meta,
        fallbackPreviousClose,
      );
    }

    if (!label || start === undefined || end === undefined || !basePrice) {
      return undefined;
    }

    const close = findLastCloseInPeriod(
      result.timestamp,
      result.indicators?.quote?.[0]?.close,
      start,
      end,
    );
    if (close === undefined) {
      return undefined;
    }

    return {
      label,
      price: close,
      percent: ((close - basePrice) / basePrice) * 100,
      pricePrecision,
    };
  } catch (error) {
    logger.warn(`yahoo chart failed for "${symbol}"`);
    return undefined;
  }
}

function formatExtendedHoursQuote(extended: ExtendedHoursQuote): string {
  const isGrowing = extended.percent > 0;
  const trend = isGrowing ? '📈' : '📉';
  return `${extended.label}：${formatEastmoneyPrice(extended.price, extended.pricePrecision)} ${trend} ${isGrowing ? '+' : ''}${convertToNumber(extended.percent)}%`;
}
export async function getEastmoneyStockQuote(
  query: string,
): Promise<EastmoneyQuote> {
  const resolvedSymbol = await resolveEastmoneySymbol(query);
  let secidInfo = getEastmoneySecid(resolvedSymbol);
  if (!secidInfo) {
    secidInfo = await getEastmoneySecidFromSearch(resolvedSymbol);
  }
  if (!secidInfo) {
    throw new Error(`暂不支持的股票代码：${resolvedSymbol}`);
  }

  const response = await axios.get<EastmoneyStockResponse>(
    EASTMONEY_STOCK_API_URL,
    {
      params: {
        secid: secidInfo.secid,
        fields: EASTMONEY_STOCK_FIELDS,
      },
      validateStatus: () => true,
    },
  );

  if (response.status !== 200) {
    throw new Error(`东方财富行情接口返回 ${response.status}`);
  }

  const data = response.data?.data;
  if (response.data?.rc !== 0 || !data) {
    throw new Error(`东方财富未返回行情数据：${secidInfo.secid}`);
  }

  const precision =
    typeof data.f59 === 'number' && data.f59 >= 0
      ? data.f59
      : secidInfo.pricePrecision;
  const current = parseEastmoneyScaledNumber(data.f43, precision);
  const percent = parseEastmoneyScaledNumber(data.f170, 2);
  if (current === undefined || percent === undefined) {
    throw new Error(`东方财富行情数据不完整：${secidInfo.secid}`);
  }

  const quote: EastmoneyQuote = {
    name: data.f58 || secidInfo.displaySymbol,
    symbol: secidInfo.displaySymbol,
    current,
    percent,
    pricePrecision: precision,
    open: parseEastmoneyScaledNumber(data.f46, precision),
    high: parseEastmoneyScaledNumber(data.f44, precision),
    low: parseEastmoneyScaledNumber(data.f45, precision),
    previousClose: parseEastmoneyScaledNumber(data.f60, precision),
    volume: parseEastmoneyScaledNumber(data.f47, 0),
    amount: parseEastmoneyScaledNumber(data.f48, 0),
    currentYearPercent: parseEastmoneyScaledNumber(data.f122, 2),
    marketCapital: parseEastmoneyScaledNumber(data.f116, 0),
    pe: parseEastmoneyScaledNumber(data.f162, 2),
    pb: parseEastmoneyScaledNumber(data.f167, 2),
    turnoverRate: parseEastmoneyScaledNumber(data.f168, 2),
    amplitude: parseEastmoneyScaledNumber(data.f171, 2),
  };

  if (isUSEastmoneySecid(secidInfo.secid)) {
    quote.extended = await getYahooExtendedHoursQuote(
      quote.symbol,
      precision,
      quote.previousClose,
    );
  }

  return quote;
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
      const quote = await getEastmoneyStockQuote(symbol);
      const isGrowing = quote.percent > 0;
      const trend = isGrowing ? '📈' : '📉';
      const precision = quote.pricePrecision;
      let text = `${quote.name}(${quote.symbol}): ${formatEastmoneyPrice(quote.current, precision)} (${trend}${isGrowing ? '+' : ''}${convertToNumber(quote.percent)}%)`;
      if (quote.extended) {
        text += `\n${formatExtendedHoursQuote(quote.extended)}`;
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
  const response = await axios.get(STOCK_TAG_API_URL);
  const results = await getMultipleStocksData(response.data[tag]);
  const textContent = results.join('\n'); // 用换行符分隔每个股票的数据
  try {
    return textContent;
  } catch (error: unknown) {
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

function formatEastmoneyIndexData(quote: EastmoneyQuote): string {
  const isGrowing = quote.percent > 0;
  const trend = isGrowing ? '📈' : '📉';

  let text = quote?.name
    ? `${quote.name}${quote.symbol ? ` (${quote.symbol})` : ''}\n`
    : '';
  text += `💰 现价：${formatEastmoneyPrice(quote.current, quote.pricePrecision)} ${trend} ${isGrowing ? '+' : ''}${convertToNumber(quote.percent)}%\n`;

  if (quote?.amount !== undefined) {
    text += `💎 成交额：${formatAmount(quote.amount)}\n`;
  }

  if (quote?.currentYearPercent !== undefined) {
    text += `📅 年初至今：${quote.currentYearPercent > 0 ? '+' : ''}${convertToNumber(quote.currentYearPercent)}%`;
  }
  return text.trimEnd();
}

export async function getCNMarketIndexData() {
  try {
    const [data1, data2, data3, data4, gzjcData] = await Promise.all([
      getEastmoneyStockQuote('SH000001'),
      getEastmoneyStockQuote('SZ399001'),
      getEastmoneyStockQuote('SZ399006'),
      getEastmoneyStockQuote('SH000688'),
      getGzjc(),
    ]);

    const data = [
      formatEastmoneyIndexData(data1),
      formatEastmoneyIndexData(data2),
      formatEastmoneyIndexData(data3),
      formatEastmoneyIndexData(data4),
      gzjcData,
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
      getEastmoneyStockQuote('.DJI'),
      getEastmoneyStockQuote('.IXIC'),
      getEastmoneyStockQuote('.INX'),
    ]);
    return `${data.map(formatEastmoneyIndexData).join('\n')}`;
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
      getEastmoneyStockQuote('HSI'),
      getEastmoneyStockQuote('HSCEI'),
      getEastmoneyStockQuote('HSTECH'),
    ]);
    return `${data.map(formatEastmoneyIndexData).join('\n')}`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `❌ 获取港股市场指数失败：${error.message}`;
    }
    return `❌ 获取港股市场指数失败：未知错误`;
  }
}

export async function getStockDetailData(symbol: string): Promise<string> {
  try {
    const quote = await getEastmoneyStockQuote(symbol);
    const isGrowing = quote.percent > 0;
    const trend = isGrowing ? '📈' : '📉';
    const pricePrecision = quote.pricePrecision;

    let text = `${quote.name}(${quote.symbol})\n`;
    text += `🏷️ 现价：${formatEastmoneyPrice(quote.current, pricePrecision)} ${trend} ${isGrowing ? '+' : ''}${convertToNumber(quote.percent)}%\n`;
    if (quote.extended) {
      text += `${formatExtendedHoursQuote(quote.extended)}\n`;
    }
    text += `↕️ 振幅：${formatEastmoneyOptionalPercent(quote.amplitude)}\n`;
    text += `📈 今开：${formatEastmoneyOptionalPrice(quote.open, pricePrecision)}\n`;
    text += `🔼 最高：${formatEastmoneyOptionalPrice(quote.high, pricePrecision)}\n`;
    text += `🔽 最低：${formatEastmoneyOptionalPrice(quote.low, pricePrecision)}\n`;
    text += `💫 成交额：${formatEastmoneyOptionalAmount(quote.amount)}\n`;
    text += `🔁 换手率：${formatEastmoneyOptionalPercent(quote.turnoverRate)}\n`;
    text += `🏢 总市值：${formatEastmoneyOptionalAmount(quote.marketCapital)}\n`;
    const pe = formatPositiveMetric(quote.pe);
    if (pe) {
      text += `📌 市盈率：${pe}\n`;
    }
    const pb = formatPositiveMetric(quote.pb);
    if (pb) {
      text += `📋 市净率：${pb}\n`;
    }
    text += `📅 今年以来：${formatEastmoneyOptionalPercent(quote.currentYearPercent)}`;

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
          instrument: fields[0], // 期货代码
          lastprice: fields[4], // 最新价
          volume: fields[10], // 成交量
        });
      }
    }

    if (futuresData.length === 0) {
      throw new Error('❌ 无法从中金所获取期货数据');
    }

    logger.log(
      `成功获取期货数据: ${futuresData.map((d) => `${d.instrument}:${d.lastprice}:${d.volume}`).join(', ')}`,
    );

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
      getStockSuggest('000300', [FinancialProductType.INDEX]),
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
