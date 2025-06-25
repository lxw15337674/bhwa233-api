"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockSummary = getStockSummary;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
const utils_1 = require("../../../utils");
const URL = "https://wzq.tenpay.com/cgi/cgi-bin/dapan/index?app=wzq%27";
const logger = new common_1.Logger('StockSummary');
async function getStockSummary() {
    try {
        const response = await (0, axios_1.default)({
            method: 'GET',
            url: URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const data = response.data.data;
        let text = `📊 今日市场概览\n`;
        text += `----------------------------\n`;
        text += `💰 成交情况\n`;
        text += `总成交额: ${(0, utils_1.formatAmount)(data.turnover_dsb.all.amount)}\n`;
        text += `较前日: ${(0, utils_1.formatAmount)(data.turnover_dsb.all.amount_change)}\n\n`;
        text += `📈 市场表现\n`;
        text += `上涨家数: ${data.ups_downs_dsb.up_count}\n`;
        text += `下跌家数: ${data.ups_downs_dsb.down_count}\n`;
        text += `平盘家数: ${data.ups_downs_dsb.flat_count}\n`;
        text += `市场情绪: ${data.ups_downs_dsb.up_ratio_comment}\n\n`;
        text += `🌏 国际联动\n`;
        text += `${data.global_reaction.comment}\n\n`;
        text += `📊 估值水平 (历史百分位)\n`;
        text += `上证指数: ${data.index_valuation.sh000001.pe_hist_percentile}%\n`;
        text += `深圳成指: ${data.index_valuation.sz399001.pe_hist_percentile}%\n`;
        text += `创业板: ${data.index_valuation.sz399006.pe_hist_percentile}%`;
        return text;
    }
    catch (error) {
        const axiosError = error;
        logger.error(`获取热点数据失败: ${axiosError.message}`);
        return `❌ 获取市场数据失败，请稍后重试`;
    }
}
//# sourceMappingURL=stockSummary.js.map