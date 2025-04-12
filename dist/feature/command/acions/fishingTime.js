"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRestDays = void 0;
exports.holiday = holiday;
const axios_1 = require("axios");
const calculateRestDays = (dateString) => {
    const date = new Date(dateString);
    const currentTime = new Date().getTime();
    const targetTime = date.getTime();
    const difference = targetTime - currentTime + 1000 * 60 * 60 * 24;
    if (difference <= 0) {
        return -1;
    }
    return Math.floor(difference / 1000 / 60 / 60 / 24);
};
exports.calculateRestDays = calculateRestDays;
async function holiday() {
    try {
        return await axios_1.default.get('https://s3.cn-north-1.amazonaws.com.cn/general.lesignstatic.com/config/jiaqi.json').then((res) => {
            const text = res?.data.vacation.reduce((pre, cur) => {
                const restDays = (0, exports.calculateRestDays)(cur.holiday);
                if (restDays < 0) {
                    return pre;
                }
                return pre + `距离${cur.holiday}【${cur.name}】 还有${restDays}天\n`;
            }, '');
            return text.trim();
        });
    }
    catch (error) {
        return '获取数据失败';
    }
}
//# sourceMappingURL=fishingTime.js.map