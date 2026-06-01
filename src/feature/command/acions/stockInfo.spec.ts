import {
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
