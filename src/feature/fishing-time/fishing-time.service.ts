import { Injectable } from '@nestjs/common';
import { CreateFishingTimeDto } from './dto/create-fishing-time.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

interface HolidayData {
  code: number;
  holiday: {
    holiday: boolean;
    name: string;
    wage: number;
    date: string;
    rest: number;
  };
  workday: null;
}

@Injectable()
export class FishingTimeService {
  constructor(
    private readonly httpService: HttpService,
  ) { }


  async getNextHoliday() {
    const res = await this.httpService.axiosRef.get<HolidayData>('http://timor.tech/api/holiday/next', {
      headers: {
        'User-Agent': 'Mozilla/5.0', // 添加用户代理头
      },
      params: {
        type: true,
        week: true
      }
    })
    return res.data.holiday
  }

  private dateParse(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月份从 0 开始，所以要加 1
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }

  async getText() {
    const nextHoliday = await this.getNextHoliday()
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
    const nextHolidayDate = new Date(nextHoliday.date);
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

   【放假】
    距离【周六】还有 ${day_to_weekend} 天
    距离下一个法定节假日【${nextHoliday.name}】${this.dateParse(nextHolidayDate)}，还有 ${nextHoliday.rest} 天
    `
  }
}
