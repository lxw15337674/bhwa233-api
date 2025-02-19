import axios from 'axios';
import { Browser, Page, chromium } from 'playwright';
import { API_ENDPOINTS } from '../../../../src/api/config';

export enum MapType {
    hy = 'hy',
    gu = 'gu'
}

export enum Area {
    'hk' = 'hk',
    'us' = 'us',
    'cn' = 'cn'
}


export async function getFutuStockMap(area: string = 'cn', mapType: string): Promise<string> {
    try {
        console.log('Fetching Futu stock map...');
        const { data } = await axios.get(`${API_ENDPOINTS.STOCK_MARKET}/getFutuStockMap?area=${area}&mapType=${mapType}`);
        return data;
    } catch (error) {
        console.error('获取富途热力图失败:', error);
        throw new Error('获取富途热力图失败，请稍后重试');
    }
}

export async function getYuntuStockMap(): Promise<string> {
    try {
        console.log('Fetching Yuntu stock map...');
        console.log(`${API_ENDPOINTS}/getYuntuStockMap`);
        const { data } = await axios.get(`${API_ENDPOINTS.STOCK_MARKET}/getYuntuStockMap`);
        return data;
    } catch (error) {
        console.error('获取云图热力图失败:', error);
        throw new Error('获取云图热力图失败，请稍后重试');
    }
}