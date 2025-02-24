import axios from "axios";
import { decode } from "querystring";

const Future_API_URL = 'http://w.sinajs.cn/' // Replace with your actual API URL
const SUGGESTION_API_URL = 'http://suggest3.sinajs.cn/suggest/' // Replace with your actual API URL

// "var hq_str_hf_XAU=\"2363.44,2356.800,2363.44,2363.79,2366.23,2354.11,15:30:00,2356.80,2356.45,0,0,0,2024-07-05,伦敦金（现货黄金）\";\n"
function extractPrices(hq_str: string, symbol: string) {
    const match = hq_str.match(/(?:"[^"]*")/);
    if (!match) return `获取${symbol}数据失败`;

    const data = match[0].slice(1, -1).split(',');
    const name = data.find(item => /[\u4e00-\u9fa5]/.test(item));
    const currentPrice = parseFloat(data[0]);
    const prePrice = parseFloat(data[8]);

    if (isNaN(currentPrice) || isNaN(prePrice)) {
        return `${symbol}数据格式错误`;
    }

    const isGrowing = currentPrice > prePrice;
    const percent = ((currentPrice - prePrice) / prePrice * 100).toFixed(2);
    return `${name}(${symbol}): ${currentPrice} (${isGrowing ? '📈' : '��'}${percent}%)`;
}
export async function getFutureSuggest(searchText = 'XAU'): Promise<string> {
    try {
        const futureResponse = await axios.get(SUGGESTION_API_URL, {
            params: {
                type: '85,86,88',
                key: encodeURIComponent(searchText)
            }
        });
        const text = futureResponse.data.slice(18, -2)
        if (text === '') {
            return ''
        }
        const arr = text.split(',');
        let code = arr[3];
        const market = arr[1];
        code = code.toUpperCase();
        // 国内交易所
        if (market === '85' || market === '88') {
            code = 'nf_' + code;
        } else if (market === '86') {
            // 海外交易所
            code = 'hf_' + code;
        }
        return code
    } catch (err) {
        return `没有找到${searchText}的期货数据`
    }
}

export async function getFutureData(symbol: string): Promise<string> {
    try {
        symbol = await getFutureSuggest(symbol)

        if (!symbol)
            return `Failed to fetch  data for ${symbol}`

        const response = await axios.get<any>(Future_API_URL, {
            // axios 乱码解决
            responseType: 'arraybuffer',
            transformResponse: [
                (data) => {
                    const decoder = new TextDecoder('GB18030');
                    return decoder.decode(data);
                },
            ],
            params: {
                list: symbol,
            },
            headers: {
                Referer: 'https://gu.sina.cn/ft/hq/hf.php',
            },
        })

        if (response.status === 200) {
            return extractPrices(response.data, symbol)
        }
        else {
            return `获取${symbol}的期货数据失败`
        }
    }
    catch (error) {
        return `没有找到${symbol}的期货数据`
    }
}