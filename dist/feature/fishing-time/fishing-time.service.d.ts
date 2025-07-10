import { HttpService } from '@nestjs/axios';
export declare class FishingTimeService {
    private readonly httpService;
    constructor(httpService: HttpService);
    getNextHoliday(): unknown;
    private dateParse;
    getTime(): unknown;
    getFishingTimeText(): unknown;
}
