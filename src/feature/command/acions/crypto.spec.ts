import axios from 'axios';
import {
  formatCryptoDetailResponse,
  getCryptoDetailData,
} from './crypto';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('crypto detail', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should format crypto detail output', () => {
    const result = formatCryptoDetailResponse({
      name: 'Bitcoin',
      symbol: 'BTC',
      currentPrice: 109876.5432,
      priceChangePercentage24h: 3.456,
      currentYearPercent: 15.6595,
      marketCap: 2.12e12,
      totalVolume: 5.2e10,
      marketCapRank: 1,
    });

    expect(result).toBe([
      'Bitcoin (BTC)',
      '现价：$109,876.54',
      '24h：📈 +3.45%',
      '今年以来：+15.65%',
      '总市值：$2.12T',
      '24h 成交额：$52B',
      '市值排名：#1',
    ].join('\n'));
  });

  it('should fetch crypto detail data with year-to-date performance', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        status: 200,
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 109876.5432,
            market_cap: 2.12e12,
            market_cap_rank: 1,
            total_volume: 5.2e10,
            price_change_percentage_24h: 3.456,
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          market_data: {
            current_price: {
              usd: 95000,
            },
          },
        },
      } as never);

    const result = await getCryptoDetailData('btc');

    expect(result).toContain('Bitcoin (BTC)');
    expect(result).toContain('今年以来：+15.65%');
    expect(result).toContain('市值排名：#1');
  });

  it('should fall back when year-to-date history is unavailable', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        status: 200,
        data: [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 109876.5432,
            market_cap: 2.12e12,
            market_cap_rank: 1,
            total_volume: 5.2e10,
            price_change_percentage_24h: 3.456,
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        status: 500,
        data: {},
      } as never);

    const result = await getCryptoDetailData('btc');

    expect(result).toContain('今年以来：暂不可用');
  });
});
