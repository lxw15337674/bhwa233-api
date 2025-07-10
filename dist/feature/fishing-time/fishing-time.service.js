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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FishingTimeService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
let FishingTimeService = class FishingTimeService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async getNextHoliday() {
        const res = await this.httpService.axiosRef.get('http://timor.tech/api/holiday/next', {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            params: {
                type: true,
                week: true
            }
        });
        return res.data.holiday;
    }
    dateParse(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    }
    async getTime() {
        const nextHoliday = await this.getNextHoliday();
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const day = new Date().getDate();
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date().getDay()];
        const passdays = Math.floor((+new Date() - +new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
        const passhours = Math.floor((+new Date() - +new Date(year, 0, 0)) / (1000 * 60 * 60));
        const salaryday1 = lastDayOfMonth - day;
        const salaryday9 = day <= 9 ? 9 - day : lastDayOfMonth - day + 9;
        const salaryday5 = day <= 5 ? 5 - day : lastDayOfMonth - day + 5;
        const salaryday10 = day <= 10 ? 10 - day : lastDayOfMonth - day + 10;
        const salaryday15 = day <= 15 ? 15 - day : lastDayOfMonth - day + 15;
        const salaryday20 = day <= 20 ? 20 - day : lastDayOfMonth - day + 20;
        const day_to_weekend = 6 - new Date().getDay();
        const nextHolidayDate = nextHoliday.date;
        return {
            year,
            month,
            day,
            weekday,
            passdays,
            passhours,
            salaryday1,
            salaryday5,
            salaryday9,
            salaryday10,
            salaryday15,
            salaryday20,
            day_to_weekend,
            nextHoliday,
            nextHolidayDate
        };
    }
    async getFishingTimeText() {
        const { year, month, day, weekday, passdays, passhours, salaryday1, salaryday5, salaryday9, salaryday10, salaryday15, salaryday20, day_to_weekend, nextHoliday, nextHolidayDate } = await this.getTime();
        return `
      【摸鱼办】提醒您: ${year} 年 已经过去 ${passdays} 天 ${passhours} 小时
      今天是 ${year}年${month}月${day}日, 星期${weekday}
      你好, 摸鱼人！工作再忙, 一定不要忘记摸鱼哦！
      有事没事起身去茶水间, 去厕所, 去走廊走走, 去找同事聊聊八卦别老在工位上坐着, 钱是老板的但命是自己的。
      【工资】
      - 距离【月底发工资】: ${salaryday1} 天
      - 距离【05号发工资】: ${salaryday5} 天
      - 距离【09号发工资】: ${salaryday9} 天
      - 距离【10号发工资】: ${salaryday10} 天
      - 距离【15号发工资】: ${salaryday15} 天
      - 距离【20号发工资】: ${salaryday20} 天
     【假期】
      - 距离【周六】还有 ${day_to_weekend} 天
      - 距离下一个法定节假日【${nextHoliday.name}】${this.dateParse(nextHolidayDate)}，还有 ${nextHoliday.rest} 天
      `;
    }
};
exports.FishingTimeService = FishingTimeService;
exports.FishingTimeService = FishingTimeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], FishingTimeService);
//# sourceMappingURL=fishing-time.service.js.map