import {
  getExtendedHoursBasePrice,
  parseYahooQuoteExtendedHours,
  pickTencentSuggestSymbol,
  pickXueqiuSuggestSymbol,
  resolveNumericSymbol,
} from './stockInfo';

describe('stock suggest ranking', () => {
  it('prefers HK listing over US ADR for Chinese Xueqiu queries', () => {
    const symbol = pickXueqiuSuggestSymbol(
      {
        data: [
          {
            code: 'MPNGY',
            market: 'US',
            query: '美团ADR',
            label: '美团 ADR',
            stock_type: 6,
          },
          {
            code: '03690',
            market: 'HK',
            query: '美团-W',
            label: '美团-W',
            stock_type: 30,
          },
        ],
      },
      '美团',
    );

    expect(symbol).toBe('03690');
  });

  it('keeps US listing when there is no HK alternative', () => {
    const symbol = pickXueqiuSuggestSymbol(
      {
        data: [
          {
            code: 'PDD',
            market: 'US',
            query: '拼多多',
            label: '拼多多',
            stock_type: 6,
          },
        ],
      },
      '拼多多',
    );

    expect(symbol).toBe('PDD');
  });

  it('still prefers exact Tencent code matches', () => {
    const symbol = pickTencentSuggestSymbol(
      [
        ['hk', '3690', '美团-W', 'meituan'],
        ['us', 'MPNGY.us', '美团 ADR', 'mpngy'],
      ],
      'mpngy',
    );

    expect(symbol).toBe('MPNGY');
  });

  it('prefers suggest result for six-digit ETF codes', () => {
    const symbol = resolveNumericSymbol('513300', {
      xueqiuSymbol: 'SH513300',
      tencentSymbol: 'SZ513300',
    });

    expect(symbol).toBe('SH513300');
  });

  it('falls back to local exchange inference when suggest is unavailable', () => {
    expect(resolveNumericSymbol('513300')).toBe('SH513300');
    expect(resolveNumericSymbol('159915')).toBe('SZ159915');
    expect(resolveNumericSymbol('830799')).toBe('BJ830799');
  });
});

describe('extended hours base price', () => {
  it('prefers regular market previous close for pre-market quotes', () => {
    expect(
      getExtendedHoursBasePrice('⏰ 盘前', {
        previousClose: 205,
        chartPreviousClose: 205,
        regularMarketPreviousClose: 219.43,
      }),
    ).toBe(219.43);
  });

  it('falls back to regular market price for post-market quotes', () => {
    expect(
      getExtendedHoursBasePrice('🌙 盘后', {
        previousClose: 205,
        chartPreviousClose: 205,
        regularMarketPreviousClose: 219.43,
        regularMarketPrice: 220.1,
      }),
    ).toBe(220.1);
  });
});

describe('yahoo extended hours parsing', () => {
  it('prefers direct pre-market fields and preserves Yahoo percent', () => {
    expect(
      parseYahooQuoteExtendedHours(
        {
          preMarketPrice: 269.19,
          preMarketChangePercent: 22.68,
          previousClose: 205.01,
          regularMarketPreviousClose: 219.43,
        },
        2,
      ),
    ).toEqual({
      label: '⏰ 盘前',
      price: 269.19,
      percent: 22.68,
      pricePrecision: 2,
    });
  });

  it('falls back to regular market previous close when Yahoo percent is absent', () => {
    const extended = parseYahooQuoteExtendedHours(
      {
        preMarketPrice: 268.19,
        previousClose: 205.01,
        regularMarketPreviousClose: 219.43,
      },
      2,
    );

    expect(extended?.label).toBe('⏰ 盘前');
    expect(extended?.price).toBe(268.19);
    expect(extended?.percent).toBeCloseTo(22.22, 2);
  });

  it('uses caller fallback previous close before Yahoo chart previousClose', () => {
    const extended = parseYahooQuoteExtendedHours(
      {
        preMarketPrice: 272.54,
        previousClose: 205.01,
        chartPreviousClose: 205.01,
      },
      2,
      219.43,
    );

    expect(extended?.label).toBe('⏰ 盘前');
    expect(extended?.price).toBe(272.54);
    expect(extended?.percent).toBeCloseTo(24.2, 1);
  });
});
