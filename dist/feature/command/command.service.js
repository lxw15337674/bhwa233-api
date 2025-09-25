"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CommandService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("./acions/crypto");
const fishingTime_1 = require("./acions/fishingTime");
const stock_1 = require("./acions/stock");
const stockHotSpot_1 = require("./acions/stockHotSpot");
const stockInfo_1 = require("./acions/stockInfo");
const stockSummary_1 = require("./acions/stockSummary");
const weibo_1 = require("./acions/weibo");
const ai_service_1 = require("../ai/ai.service");
let CommandService = CommandService_1 = class CommandService {
    constructor(aiService) {
        this.aiService = aiService;
        this.logger = new common_1.Logger(CommandService_1.name);
        this.commandMap = [
            {
                key: 'a ',
                callback: async (params) => {
                    const response = await this.aiService.generateResponse({ prompt: params?.args ?? '', rolePrompt: '你是坤哥，你会为用户提供安全，有帮助，准确的回答，回答控制在300字以内。回答开头是：坤哥告诉你，结尾是：厉不厉害 你坤哥🐔' });
                    return {
                        content: response,
                        type: 'text'
                    };
                },
                msg: 'a [问题] - 获取鸡哥回答 例如: a 你好鸡哥',
                hasArgs: true,
            },
            {
                key: 'ss',
                callback: async () => {
                    const result = await (0, stockInfo_1.getCNMarketIndexData)();
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
                callback: async (params) => {
                    const result = await (0, stockInfo_1.getUSMarketIndexData)();
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
                callback: async (params) => {
                    const result = await (0, stockInfo_1.getHKMarketIndexData)();
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
                    const result = await (0, stockInfo_1.getStockData)(params.args);
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
                    const result = await (0, stockInfo_1.getStockDetailData)(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'sd [股票代码] - 获取股票详细信息 例如: sd gzmt',
                hasArgs: true,
            },
            {
                key: 'sb ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票标签，例如: sb 互联网');
                    }
                    const result = await (0, stockInfo_1.getStocksByTag)(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'sb [标签] - 根据标签获取股票分组信息，例如: sb 互联网',
                hasArgs: true,
            },
            {
                key: 'sbl',
                callback: async () => {
                    const result = await (0, stockInfo_1.getAllStockGroups)();
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'sbl - 显示所有股票分组内容，格式为[标签名]: [股票代码数组]',
                hasArgs: false,
            },
            {
                key: 'dp',
                callback: async (params) => {
                    const result = await (0, stockSummary_1.getStockSummary)();
                    return {
                        content: result || '获取大盘数据失败',
                        type: 'text'
                    };
                },
                msg: 'dp - 获取大盘市场信息，包括涨跌家数、板块概览等',
                hasArgs: false,
            },
            {
                key: 'c ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: c 小米集团');
                    }
                    const result = await (0, stock_1.getStockData)(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'c [股票代码] - 获取股票信息 例如: c 小米集团',
                hasArgs: true,
            },
            {
                key: 'cd ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入股票代码，例如: cd 小米集团');
                    }
                    const result = await (0, stock_1.getStockDetailData)(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'cd [股票代码] - 获取股票详细信息 例如: cd 小米集团',
                hasArgs: true,
            },
            {
                key: 'b ',
                callback: async (params) => {
                    if (!params.args) {
                        throw new Error('请输入数字货币代码，例如: b btc');
                    }
                    const result = await (0, crypto_1.getCryptoData)(params.args);
                    return {
                        content: result,
                        type: 'text'
                    };
                },
                msg: 'b [货币代码] - 获取数字货币信息 例如: b btc',
                hasArgs: true,
            },
            {
                key: 'hot',
                callback: async (params) => {
                    const result = await (0, stockHotSpot_1.getHotSpot)();
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
                callback: async (params) => {
                    const result = await (0, weibo_1.getWeiboData)();
                    return {
                        content: result || '获取微博热搜失败',
                        type: 'text'
                    };
                },
                msg: 'wb - 获取微博热搜',
                hasArgs: false,
            },
            {
                key: 'hy',
                callback: async (params) => {
                    const result = await (0, fishingTime_1.holiday)();
                    return {
                        content: result || '获取节假日信息失败',
                        type: 'text'
                    };
                },
                msg: 'hy - 获取节假日信息',
                hasArgs: false,
            },
            {
                key: 'hp',
                callback: async (params) => {
                    const commandMsg = this.commandMap
                        .filter(command => command.enable !== false)
                        .map(command => command.msg)
                        .join('\n');
                    const content = `===== 命令帮助 =====\n${commandMsg}\n项目地址：https://github.com/lxw15337674/bhwa233-api`;
                    try {
                        return {
                            content,
                            type: 'text'
                        };
                    }
                    catch (error) {
                        this.logger.error('Error creating help image:', error);
                        return {
                            content,
                            type: 'text'
                        };
                    }
                },
                msg: 'hp - 获取命令帮助',
                hasArgs: true,
                type: 'image'
            }
        ];
    }
    async executeCommand(msg) {
        for (const command of this.commandMap) {
            if (msg.startsWith(command.key)) {
                const args = command.hasArgs ? msg.slice(command.key.length).trim() : undefined;
                const result = await command.callback({
                    args,
                    key: command.key,
                });
                this.logger.log(`====================[命令执行开始]====================\n[时间] ${new Date().toLocaleString()}\n[命令] ${command.key}\n[参数] ${args || '无'}\n[结果] ${result.content}\n====================[命令执行结束]====================`);
                return result;
            }
        }
        return {
            content: '',
            type: 'text'
        };
    }
    async getCommandList() {
        const commandMsg = this.commandMap
            .filter(command => command.enable !== false)
            .map(command => ({
            key: command.key,
            description: command.msg,
            type: command.type,
        }));
        return commandMsg;
    }
};
exports.CommandService = CommandService;
exports.CommandService = CommandService = CommandService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], CommandService);
//# sourceMappingURL=command.service.js.map