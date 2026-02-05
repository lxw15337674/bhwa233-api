import axios from 'axios';
import dayjs from 'dayjs';

interface MetalPrice {
  name: string;
  sellPrice: string;
  todayPrice: string;
  highPrice: string;
  lowPrice: string;
  unit: string;
}

const METAL_CONFIGS = [
  { name: '今日金价', start: 1 },
  { name: '黄金价格', start: 1 },
  { name: '黄金_9999', start: 17 },
  { name: '黄金_T+D', start: 21 },
  { name: '伦敦金(现货黄金)', start: 57 },
  { name: '纽约黄金(美国)', start: 33 },
  { name: '白银价格', start: 5 },
  { name: '铂金价格', start: 9 },
  { name: '钯金价格', start: 13 },
] as const;

const UNIT_MAP: Record<string, string> = {
  今日金价: '元/克',
  黄金价格: '元/克',
  黄金_9999: '元/克',
  '黄金_T+D': '元/克',
  '伦敦金(现货黄金)': '美元/盎司',
  '纽约黄金(美国)': '美元/盎司',
  白银价格: '元/克',
  铂金价格: '元/克',
  钯金价格: '元/克',
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parseMetals(list: string[]): MetalPrice[] {
  return METAL_CONFIGS.map(({ name, start }) => ({
    name,
    sellPrice: list[start] ?? 'N/A',
    todayPrice: list[start + 1] ?? 'N/A',
    highPrice: list[start + 2] ?? 'N/A',
    lowPrice: list[start + 3] ?? 'N/A',
    unit: UNIT_MAP[name],
  }));
}

export async function getGoldPrice(): Promise<string> {
  const url = `http://res.huangjinjiage.com.cn/panjia1.js?t=${Date.now()}`;
  const { data } = await axios.get<string>(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  const match = /panjia\s*=\s*"(?<listStr>[^"]+)"/.exec(data);
  if (!match?.groups?.listStr) {
    throw new Error('金价数据解析失败');
  }

  const list = match.groups.listStr.split(',');
  const metals = parseMetals(list);
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const metalTexts = metals
    .map((metal) => `${metal.name}: ${metal.sellPrice}${metal.unit}`)
    .join('\n');

  return `贵金属价格 (${now})\n\n〓 实时行情 〓\n${metalTexts}`;
}
