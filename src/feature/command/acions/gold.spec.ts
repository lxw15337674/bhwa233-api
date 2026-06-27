import { buildGoldQuotes, formatGoldPriceResponse } from './gold';

describe('gold quote parsing', () => {
  it('should map panjia2 indexes to the displayed metals', () => {
    const priceList = Array.from({ length: 28 }, () => '');
    priceList[12] = '1134.0';
    priceList[16] = '21.4';
    priceList[20] = '503.6';

    const quotes = buildGoldQuotes(priceList);
    const result = formatGoldPriceResponse(quotes, '2026-03-10 10:18:41', {
      symbol: 'AU9999',
      currentYearPercent: 12.345,
    });

    expect(result).toBe([
      '报价时间：2026-03-10 10:18:41',
      '当前金价：1134.0元/克',
      '年内涨幅：+12.34%（基准 AU9999）',
      '白银：21.4元/克',
      '铂金：503.6元/克',
    ].join('\n'));
  });

  it('should show fallback text when benchmark performance is unavailable', () => {
    const quotes = buildGoldQuotes(
      Object.assign(Array.from({ length: 28 }, () => ''), {
        12: '1134.0',
      }),
    );

    const result = formatGoldPriceResponse(quotes, undefined, {
      symbol: 'AU9999',
    });

    expect(result).toBe([
      '当前金价：1134.0元/克',
      '年内涨幅：暂不可用（基准 AU9999）',
    ].join('\n'));
  });

  it('should throw when no displayable quotes exist', () => {
    expect(() => buildGoldQuotes([])).toThrow('缺少可展示的金价数据');
    expect(() => formatGoldPriceResponse([], '2026-03-10 10:18:41')).toThrow('缺少可展示的金价数据');
  });
});
