import axios from 'axios';
import { Logger } from '@nestjs/common';

const SUGGESTION_API_URL = 'https://finance.pae.baidu.com/selfselect/sug';
const logger = new Logger('Stock');
const BD_GST_API_URL = 'https://gushitong.baidu.com/opendata';

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

// 定义金融产品类型枚举
export enum FinancialProductType {
  INDEX = 'index',
  FUTURES = 'futures',
  STOCK = 'stock',
  FOREIGN = 'foreign',
}

export async function getStockSuggest(
  searchText = '上证指数',
  type: FinancialProductType[] = [
    FinancialProductType.INDEX,
    FinancialProductType.FUTURES,
    FinancialProductType.STOCK,
    FinancialProductType.FOREIGN,
  ],
): Promise<Stock | undefined> {
  try {
    // 获取ab-sr值作为Cookie
    const abSr = await getBaiduAbSr();
    const headers: Record<string, string> = {
      Host: 'finance.pae.baidu.com',
    };

    // 如果成功获取到ab-sr值，添加到Cookie中，并设置域名
    if (abSr) {
      headers['Cookie'] = `ab-sr=${abSr};`;
    }

    const response = await axios.get<SuggestData>(SUGGESTION_API_URL, {
      params: {
        wd: searchText,
        skip_login: 1,
        finClientType: 'pc',
      },
      headers,
    });

    if (response.status === 200 && response.data.Result.stock.length > 0) {
      return response.data.Result.stock.find((stock) => {
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
    const symbols = symbol.split(/\s+/); // 按空格分割多个股票代码
    const results = await getMultipleStocksData(symbols);
    return results.join('\n'); // 用两个换行符分隔每个股票的数据，增加可读性
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

function formatOutMarketInfo(data: MinuteData): string {
  const { outMarketInfo } = data;

  const outMarketPrice = parseFloat(outMarketInfo.price);
  const outMarketIsGrowing = parseFloat(outMarketInfo.increase) >= 0;
  const typeMap: Record<string, string> = {
    '1': '盘前',
    '2': '盘后',
  };
  const type = typeMap[outMarketInfo.type] || '';

  return `${type}：${outMarketPrice} (${outMarketIsGrowing ? '📈' : '📉'}${outMarketInfo.ratio})`;
}

function formatBasicInfo(data: MinuteData) {
  const { basicinfos, cur } = data;

  const name = basicinfos.name;
  const currentPrice = parseFloat(cur.price);
  const isGrowing = parseFloat(cur.increase) >= 0;

  return `${name}(${basicinfos.code}): ${currentPrice} (${isGrowing ? '📈' : '📉'}${cur.ratio})`;
}

export async function getStockBasicData(symbol: string): Promise<string> {
  const suggestedSymbol = await getStockSuggest(symbol);
  if (!suggestedSymbol) throw new Error('未找到相关股票');

  const result = await fetchStockDetailData(suggestedSymbol);

  const data = result.resultData.tplData.result.minute_data;
  if (!data) throw new Error('未找到相关股票');

  const text: string[] = [];

  text.push(formatBasicInfo(data));

  if (data.outMarketInfo) {
    text.push(formatOutMarketInfo(data));
  }

  return text.join('\n');
}

export async function getStockDetailData(symbol: string) {
  const suggestedSymbol = await getStockSuggest(symbol);
  if (!suggestedSymbol) throw new Error('未找到相关股票');

  const result = await fetchStockDetailData(suggestedSymbol);

  const data = result.resultData.tplData.result.minute_data;
  if (!data) throw new Error('未找到相关股票');

  const text: string[] = [];

  text.push(formatBasicInfo(data));

  if (data.outMarketInfo) {
    text.push(formatOutMarketInfo(data));
  }

  const { pankouinfos } = data;
  pankouinfos.list.forEach((item) => {
    text.push(`${item.name}: ${item.value}`);
  });

  return text.join('\n');
}

export async function fetchStockDetailData(suggest: {
  code: string;
  type: string;
  market: string;
}) {
  // 定义资源ID映射
  const RESOURCE_IDS = {
    ab: '5429',
    hk: '5430',
    us: '5431',
    index: '5352',
    foreign: '5343',
    uk: '5566',
    bk: '5782',
    block: '50748',
    futures: '51287',
  } as const;

  const params = {
    openapi: '1',
    dspName: 'iphone',
    client: 'app',
    query: suggest.code,
    code: suggest.code,
    word: suggest.code,
    resource_id:
      RESOURCE_IDS[suggest.type as keyof typeof RESOURCE_IDS] ||
      RESOURCE_IDS[suggest.market as keyof typeof RESOURCE_IDS],
    finClientType: 'pc',
    market: suggest.market,
  };

  // 获取ab-sr值作为Cookie
  const abSr = await getBaiduAbSr();
  const headers: Record<string, string> = {};

  // 如果成功获取到ab-sr值，添加到Cookie中，并设置域名
  if (abSr) {
    headers['Cookie'] = `ab-sr=${abSr};`;
  }

  const response = await axios.get<StockDetail>(BD_GST_API_URL, {
    params,
    headers,
  });

  const result = response.data.Result?.find((item) =>
    ['stock_quotation_info', 'unitstatic', 'index_sf_quotations'].includes(
      item.DisplayData.strategy.tempName,
    ),
  );

  if (!result) throw new Error('未找到相关股票');

  return result.DisplayData;
}

let abSrCache = {
  value: '',
  timestamp: 0,
};
const CACHE_EXPIRATION_TIME = 2 * 60 * 60 * 1000; // 2小时

async function getBaiduAbSr(): Promise<string | undefined> {
  const now = Date.now();
  if (abSrCache.value && now - abSrCache.timestamp < CACHE_EXPIRATION_TIME) {
    return abSrCache.value;
  }

  try {
    const data =
      '{"data":"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","key_id":"c79a4f25f66d4879","enc":2}';
    const headers = {
      headers: {
        Origin: 'https://gushitong.baidu.com',
        Referer: 'https://gushitong.baidu.com/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
        Host: 'miao.baidu.com',
      },
    };

    const response = await axios.post(
      'https://miao.baidu.com/abdr?_o=https://gushitong.baidu.com',
      data,
      headers,
    );

    // 从响应头中获取Ab-Sr值并缓存
    const abSr = response.headers['ab-sr'] as string;
    if (abSr) {
      abSrCache = {
        value: abSr,
        timestamp: now,
      };
    }
    return abSr;
  } catch (error) {
    logger.error('获取百度Ab-Sr失败:', error);
    return undefined;
  }
}
