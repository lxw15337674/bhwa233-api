"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeiboData = getWeiboData;
const dayjs_1 = require("dayjs");
const axios_1 = require("axios");
const BASE_URL = 'https://raw.githubusercontent.com/lxw15337674/weibo-trending-hot-history/master/api';
async function getWeiboData() {
    const date = (0, dayjs_1.default)().format('YYYY-MM-DD');
    const url = `${BASE_URL}/${date}/summary.json`;
    const { data } = await axios_1.default.get(url);
    return data.slice(0, 20).map((item, index) => `${index + 1}. ${item.title} ${item.hot}🔥`).join('\n');
}
//# sourceMappingURL=weibo.js.map