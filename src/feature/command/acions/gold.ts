import axios from 'axios';
import dayjs from 'dayjs';
import { convertToNumber } from '../../../utils';
import { getEastmoneyStockQuote } from './stockInfo';

interface GoldQuote {
  label: string;
  price: string;
  unit: string;
}

interface GoldBenchmarkQuote {
  symbol: string;
  currentYearPercent?: number;
}

const GOLD_PRICE_SCRIPT_URL = 'http://res.huangjinjiage.com.cn/panjia2.js';
const GOLD_TIME_SCRIPT_URL = 'http://res.huangjinjiage.com.cn/panjia1.js';
const GOLD_BENCHMARK_SYMBOL = 'AU9999';

const DISPLAY_ITEMS = [
  { label: '黄金', start: 12, unit: '元/克' },
  { label: '白银', start: 16, unit: '元/克' },
  { label: '铂金', start: 20, unit: '元/克' },
] as const;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractScriptList(script: string, variableName: string): string[] {
  const match = new RegExp(`${variableName}\\s*=\\s*"(?<listStr>[^"]+)"`).exec(script);
  const listStr = match?.groups?.listStr;

  if (!listStr) {
    throw new Error('金价数据解析失败');
  }

  return listStr.split(',');
}

function extractQuoteTime(script: string): string | undefined {
  const list = extractScriptList(script, 'panjia');
  const rawTime = list.at(-1)?.trim();

  if (!rawTime || !/^\d{1,2}:\d{2}:\d{2}$/.test(rawTime)) {
    return undefined;
  }

  return `${dayjs().format('YYYY-MM-DD')} ${rawTime}`;
}

function formatBenchmarkPerformance(
  benchmark?: GoldBenchmarkQuote,
): string | undefined {
  if (!benchmark) {
    return undefined;
  }

  if (benchmark.currentYearPercent === undefined) {
    return `年内涨幅：暂不可用（基准 ${benchmark.symbol}）`;
  }

  const sign = benchmark.currentYearPercent > 0 ? '+' : '';
  return `年内涨幅：${sign}${convertToNumber(benchmark.currentYearPercent)}%（基准 ${benchmark.symbol}）`;
}

export function buildGoldQuotes(priceList: string[]): GoldQuote[] {
  const quotes: GoldQuote[] = [];

  DISPLAY_ITEMS.forEach(({ label, start, unit }) => {
    const price = priceList[start]?.trim();
    if (!price || price === '--' || price === 'N/A') {
      return;
    }

    quotes.push({ label, price, unit });
  });

  if (quotes.length === 0) {
    throw new Error('缺少可展示的金价数据');
  }

  return quotes;
}

export function formatGoldPriceResponse(
  quotes: GoldQuote[],
  quoteTime?: string,
  benchmark?: GoldBenchmarkQuote,
): string {
  if (quotes.length === 0) {
    throw new Error('缺少可展示的金价数据');
  }

  const performanceLine = formatBenchmarkPerformance(benchmark);
  const goldIndex = quotes.findIndex((quote) => quote.label === '黄金');
  const lines = quotes.map((quote) =>
    quote.label === '黄金'
      ? `当前金价：${quote.price}${quote.unit}`
      : `${quote.label}：${quote.price}${quote.unit}`,
  );

  if (performanceLine) {
    const insertIndex = goldIndex >= 0 ? goldIndex + 1 : 1;
    lines.splice(insertIndex, 0, performanceLine);
  }

  if (!quoteTime) {
    return lines.join('\n');
  }

  return [`报价时间：${quoteTime}`, ...lines].join('\n');
}

async function getGoldBenchmarkQuote(): Promise<GoldBenchmarkQuote> {
  try {
    const quote = await getEastmoneyStockQuote(GOLD_BENCHMARK_SYMBOL);
    return {
      symbol: quote.symbol,
      currentYearPercent: quote.currentYearPercent,
    };
  } catch {
    return {
      symbol: GOLD_BENCHMARK_SYMBOL,
    };
  }
}

export async function getGoldPrice(): Promise<string> {
  const [{ data: priceScript }, { data: timeScript }, benchmark] = await Promise.all([
    axios.get<string>(GOLD_PRICE_SCRIPT_URL, {
      headers: { 'User-Agent': USER_AGENT },
    }),
    axios.get<string>(GOLD_TIME_SCRIPT_URL, {
      headers: { 'User-Agent': USER_AGENT },
    }),
    getGoldBenchmarkQuote(),
  ]);

  const priceList = extractScriptList(priceScript, 'panjia2');
  const quotes = buildGoldQuotes(priceList);
  const quoteTime = extractQuoteTime(timeScript);

  return formatGoldPriceResponse(quotes, quoteTime, benchmark);
}
