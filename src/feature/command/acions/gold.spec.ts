import { buildGoldQuotes, formatGoldPriceResponse } from './gold';

describe('gold quote parsing', () => {
  it('should map panjia2 indexes to the four displayed metals', () => {
    const priceList = Array.from({ length: 28 }, () => '');
    priceList[12] = '1134.0';
    priceList[16] = '21.4';
    priceList[20] = '503.6';
    priceList[24] = '376.9';

    const quotes = buildGoldQuotes(priceList);
    const result = formatGoldPriceResponse(quotes, '2026-03-10 10:18:41');

    expect(result).toBe([
      '报价时间：2026-03-10 10:18:41',
      '黄金：1134.0元/克',
      '白银：21.4元/克',
      '铂金：503.6元/克',
      '钯金：376.9元/克',
    ].join('\n'));
  });

  it('should throw when no displayable quotes exist', () => {
    expect(() => buildGoldQuotes([])).toThrow('缺少可展示的金价数据');
    expect(() => formatGoldPriceResponse([], '2026-03-10 10:18:41')).toThrow('缺少可展示的金价数据');
  });
});