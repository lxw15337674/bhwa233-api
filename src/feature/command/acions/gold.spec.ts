import { formatGoldPriceResponse } from './gold';

describe('formatGoldPriceResponse', () => {
  it('should format gold data with quote time and plain price lines', () => {
    const result = formatGoldPriceResponse({
      code: 200,
      message: 'ok',
      data: {
        date: '2026-03-10',
        metals: [
          {
            name: '今日金价',
            sell_price: '1147.44',
            today_price: '1148.00',
            high_price: '1150.00',
            low_price: '1140.00',
            unit: '元/克',
            updated: '2026-03-10 09:56:02',
          },
          {
            name: '黄金_9999',
            sell_price: '1148.10',
            today_price: '1147.80',
            high_price: '1151.00',
            low_price: '1142.00',
            unit: '元/克',
          },
          {
            name: '黄金_T+D',
            sell_price: '1146.50',
            today_price: '1145.00',
            high_price: '1149.00',
            low_price: '1139.00',
            unit: '元/克',
          },
          {
            name: '伦敦金(现货黄金)',
            sell_price: '2980.60',
            today_price: '2982.00',
            high_price: '2990.00',
            low_price: '2970.00',
            unit: '美元/盎司',
          },
          {
            name: '纽约黄金(美国)',
            sell_price: '2981.20',
            today_price: '2983.00',
            high_price: '2991.00',
            low_price: '2971.00',
            unit: '美元/盎司',
          },
          {
            name: '白银价格',
            sell_price: '12.30',
            today_price: '12.10',
            high_price: '12.50',
            low_price: '12.00',
            unit: '元/克',
          },
          {
            name: '铂金价格',
            sell_price: '280.00',
            today_price: '279.00',
            high_price: '282.00',
            low_price: '278.00',
            unit: '元/克',
          },
          {
            name: '钯金价格',
            sell_price: '310.00',
            today_price: '309.00',
            high_price: '312.00',
            low_price: '308.00',
            unit: '元/克',
          },
        ],
      },
    });

    expect(result).toBe([
      '报价时间：2026-03-10 09:56:02',
      '黄金：1147.44元/克',
      '白银：12.30元/克',
      '铂金：280.00元/克',
      '钯金：310.00元/克',
    ].join('\n'));
    expect(result).not.toContain('黄金9999');
    expect(result).not.toContain('黄金T+D');
    expect(result).not.toContain('伦敦金');
    expect(result).not.toContain('纽约金');
    expect(result).not.toContain('黄金速览');
    expect(result).not.toContain('数据日期');
  });

  it('should throw when payload is invalid', () => {
    expect(() =>
      formatGoldPriceResponse({
        code: 500,
        message: 'bad gateway',
      }),
    ).toThrow('bad gateway');

    expect(() =>
      formatGoldPriceResponse({
        code: 200,
        message: 'ok',
        data: { metals: [] },
      }),
    ).toThrow('金价数据为空');
  });
});