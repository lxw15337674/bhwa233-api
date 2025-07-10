import { FishingTimeService } from './fishing-time.service';
export declare class FishingTimeController {
    private readonly fishingTimeService;
    constructor(fishingTimeService: FishingTimeService);
    getTime(): unknown;
}
