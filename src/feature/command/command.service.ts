import { Injectable } from '@nestjs/common';
import { getCryptoData } from './acions/crypto';
import { holiday } from './acions/fishingTime';
import { getFutureData } from './acions/future';
import { getHotSpot } from './acions/stockHotSpot';
import { getCNMarketIndexData, getHKMarketIndexData, getStockData, getStockDetailData, getUSMarketIndexData } from './acions/stockInfo';
import { getStockSummary } from './acions/stockSummary';
import { StockMarketService } from '../stock-market/stock-market.service';
import { getWeiboData } from './acions/weibo';
import { AiService } from '../ai/ai.service';
import uploadBase64Image from './acions/upload';

export interface CommandParams {
    args?: string,
    key: string,
}


export interface Command {
    key: string;
    description: string;
    type?: 'text' | 'image';
}

@Injectable()
export class CommandService {
    constructor(
        private readonly stockMarketService: StockMarketService,
        private readonly aiService: AiService,
    ) { }

    private commandMap: {
        key: string,
        callback: (params: CommandParams) => Promise<{ content: string, type: 'text' | 'image' }>,
        msg: string,
        hasArgs: boolean,
        enable?: boolean,
        type?: 'text' | 'image'
    }[] = [
            // AI对话
            {
                key: 'a ',
                callback: async (params) => {
                    const content = await this.aiService.generateResponse(params?.args ?? '');
                    return {
                        content,
                        type: 'text'
                    };
                },
                msg: 'a [问题] - 获取鸡哥回答 例如: a 你好鸡哥',
                hasArgs: true,
            },
            // 股市相关命令
            {
                key: 'ss',
                callback: async () => {
                    const result = await getCNMarketIndexData();
                    return {
                        content: result || '获取数据失败',
                        type: 'text'
                    };
                },
                msg: 'ss - 获取上证指数信息，包含大盘涨跌幅、成交量等核心数据',
                hasArgs: false,
            },
            {
                key: 'sus',
                callback: async (params: CommandParams) => {
                    const result = await getUSMarketIndexData();
                    return {
                        content: result || '获取美股指数数据失败',
                        type: 'text'
                    };
                },
                msg: 'sus - 获取美股指数信息，包含大盘涨跌幅、成交量等核心数据',
                hasArgs: false,
            },
            {
                key: 'shk',
                callback: async (params: CommandParams) => {
                    const result = await getHKMarketIndexData();
                    return {
                        content: result || '获取港股指数数据失败',
                        type: 'text'
                    };
                },
                msg: 'shk - 获取港股指数信息，包含大盘涨跌幅、成交量等核心数据',
                hasArgs: false,
            },
            {
                key: 's ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: s 600519 000858');
                    }
                    const result = await getStockData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 's [股票代码] - 获取股票信息,支持一次查询多只股票 例如: s 600519 000858',
                hasArgs: true,
            },
            {
                key: 'sd ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: sd gzmt');
                    }
                    const result = await getStockDetailData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'sd [股票代码] - 获取股票详细信息 例如: sd gzmt',
                hasArgs: true,
            },
            {
                key: 'dp',
                callback: async (params: CommandParams) => {
                    const result = await getStockSummary();
                    return {
                        content: result || '获取大盘数据失败',
                        type: 'text'
                    };
                },
                msg: 'dp - 获取大盘市场信息，包括涨跌家数、板块概览等',
                hasArgs: false,
            },
            {
                key: 'm',
                callback: async (params) => {
                    if (!params.args || params.args === 'dp') {
                        const imageData = await this.stockMarketService.getYuntuStockMap();
                        const src = await uploadBase64Image(imageData);
                        return {
                            content: src,
                            type: 'image'
                        };
                    }

                    const [market, type] = params.args.split(' ');
                    if (!['cn', 'hk', 'us'].includes(market)) {
                        throw new Error('市场类型无效，请使用: cn (A股) 或 hk (港股) 或 us (美股)');
                    }

                    const imageData = await this.stockMarketService.getFutuStockMap(market, type);
                    const src = await uploadBase64Image(imageData);
                    return {
                        content: src,
                        type: 'image'
                    };
                },
                msg: 'm [市场] [类型] - 获取热力图\n  m - 获取云图大盘热力图\n  m cn/hk/us hy/gu - 获取富途热力图 (hy:行业图 gu:个股图)',
                hasArgs: true,
                type: 'image'
            },
            // 股票、期货、外汇、基金、指数集合
            {
                key: 'c ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: c 小米集团');
                    }
                    const result = await getFutureData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'c [股票代码] - 获取股票信息 例如: c 小米集团',
                hasArgs: true,
            },
            // 数字货币
            {
                key: 'b ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入数字货币代码，例如: b btc');
                    }
                    const result = await getCryptoData(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'b [货币代码] - 获取数字货币信息 例如: b btc',
                hasArgs: true,
            },
            // 热点资讯
            {
                key: 'hot',
                callback: async (params: CommandParams) => {
                    const result = await getHotSpot();
                    return {
                        content: result || '获取数据失败',
                        type: 'text'
                    };
                },
                msg: 'hot - 获取今日热点概念板块及相关个股',
                hasArgs: false,
            },
            {
                key: 'wb',
                callback: async (params: CommandParams) => {
                    const result = await getWeiboData();
                    return {
                        content: result || '获取微博热搜失败',
                        type: 'text'
                    };
                },
                msg: 'wb - 获取微博热搜',
                hasArgs: false,
            },
            // 其他工具
            {
                key: 'hy',
                callback: async (params: CommandParams) => {
                    const result = await holiday();
                    return {
                        content: result || '获取节假日信息失败',
                        type: 'text'
                    };
                },
                msg: 'hy - 获取节假日信息',
                hasArgs: false,
            },
            // 随机图片命令
            // {
            //   key: 'img',
            //   callback: getRandomImage,
            //   msg: 'img - 获取一张随机图片',
            //   hasArgs: false,
            // },
            {
                key: 'hp',
                callback: async (params: CommandParams) => {
                    const commandMsg = this.commandMap
                        .filter(command => command.enable !== false)
                        .map(command => command.msg)
                        .join('\n');
                    return {
                        content: `命令列表：\n${commandMsg}\n项目地址：https://github.com/lxw15337674/weixin-robot`,
                        type: 'text'
                    };
                },
                msg: 'hp - 获取命令帮助',
                hasArgs: false,
            }
        ];

    async executeCommand(msg: string): Promise<{ content: string, type: 'text' | 'image' }> {
        for (const command of this.commandMap) {
            if (msg.startsWith(command.key)) {
                const args = command.hasArgs ? msg.slice(command.key.length).trim() : undefined;
                const result = await command.callback({
                    args,
                    key: command.key,
                });

                console.log(`\x1B[32m====================[命令执行开始]====================\x1B[0m\n[时间] ${new Date().toLocaleString()}\n[命令] ${command.key}\n[参数] ${args || '无'}\n[结果] ${result.content}\n\x1B[32m====================[命令执行结束]====================\x1B[0m`)

                return result;
            }
        }
        return {
            content: '',
            type: 'text'
        };
    }

    async getCommandList(): Promise<Command[]> {
        const commandMsg = this.commandMap
            .filter(command => command.enable !== false)
            .map(command => ({
                key: command.key,
                description: command.msg,
                type: command.type,
            }));
        return commandMsg;
    }
}
