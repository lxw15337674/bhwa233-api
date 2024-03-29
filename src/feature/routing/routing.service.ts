import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import _ from 'lodash';

@Injectable()
export class RoutingService {
  constructor(
    private readonly httpService: HttpService,
  ) { }


  async getData(params: any) {
    if(!params?.url) throw new Error('url is required')
    const res = await this.httpService.axiosRef.get(params?.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0', // 添加用户代理头
      },
      params: _.omit(params, 'url')
    })
    return res.data
  }
}
