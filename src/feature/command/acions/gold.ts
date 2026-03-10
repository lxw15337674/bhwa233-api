import axios from 'axios';

interface GoldMetal {
  name: string;
  sell_price: string;
  today_price: string;
  high_price: string;
  low_price: string;
  unit: string;
  updated?: string;
  updated_at?: number;
}

interface GoldPriceApiResponse {
  code: number;
  message: string;
  data?: {
    date?: string;
    metals?: GoldMetal[];
  };
}

const GOLD_API_URL = 'https://60s.viki.moe/v2/gold-price?encoding=json';

const DISPLAY_ITEMS = [
  { names: ['今日金价', '黄金价格'], label: '黄金' },
  { names: ['白银价格'], label: '白银' },
  { names: ['铂金价格'], label: '铂金' },
  { names: ['钯金价格'], label: '钯金' },
] as const;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function formatMetalLine(label: string, metal: GoldMetal): string {
  return `${label}：${metal.sell_price}${metal.unit}`;
}

function getUpdatedTime(metals: GoldMetal[]): string | undefined {
  return metals.find((metal) => metal.updated)?.updated;
}

function findMetalByNames(
  metalMap: Map<string, GoldMetal>,
  names: readonly string[],
): GoldMetal | undefined {
  return names.map((name) => metalMap.get(name)).find((metal) => Boolean(metal));
}

export function formatGoldPriceResponse(payload: GoldPriceApiResponse): string {
  if (payload.code !== 200) {
    throw new Error(payload.message || '金价接口返回异常');
  }

  const metals = payload.data?.metals;

  if (!Array.isArray(metals) || metals.length === 0) {
    throw new Error('金价数据为空');
  }

  const metalMap = new Map(metals.map((metal) => [metal.name, metal]));
  const lines = DISPLAY_ITEMS.map(({ names, label }) => {
    const metal = findMetalByNames(metalMap, names);
    if (!metal?.sell_price || !metal.unit) {
      return null;
    }

    return formatMetalLine(label, metal);
  }).filter((line): line is string => Boolean(line));

  if (lines.length === 0) {
    throw new Error('缺少可展示的金价数据');
  }

  const updatedTime = getUpdatedTime(metals);

  if (!updatedTime) {
    return lines.join('\n');
  }

  return [`报价时间：${updatedTime}`, ...lines].join('\n');
}

export async function getGoldPrice(): Promise<string> {
  const { data } = await axios.get<GoldPriceApiResponse>(GOLD_API_URL, {
    headers: { 'User-Agent': USER_AGENT },
  });

  return formatGoldPriceResponse(data);
}
