import axios, { AxiosError } from "axios";
import { Logger } from '@nestjs/common';

const URL = "https://www.iwencai.com/unifiedwap/unified-wap/index?is_index=0&is_recommend=0&query_types=stock";
const logger = new Logger('StockHotSpot');

interface HotSpot {
    desc: string;
    title: string;
}
export async function getHotSpot(): Promise<string | undefined> {
    try {
        const response = await axios({
            method: 'GET',
            url: URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const hotSpot = response.data.data?.concept_data.list as HotSpot[];
        const formattedList =  hotSpot.map(item => `${item.title}: ${item.desc}`).join('\n');
        return `📈 今日市场热点概念\n\n${formattedList}`;
    } catch (error) {
        const axiosError = error as AxiosError;
        logger.error(`获取热点数据失败: ${axiosError.message}`);
        return undefined;
    }
}
