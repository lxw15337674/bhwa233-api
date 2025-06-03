import { FishingTimeService } from './fishing-time.service';
export declare class FishingTimeController {
    private readonly fishingTimeService;
    constructor(fishingTimeService: FishingTimeService);
    getTime(): Promise<{
        year: number;
        month: number;
        day: number;
        weekday: string;
        passdays: number;
        passhours: number;
        salaryday1: number;
        salaryday5: number;
        salaryday9: number;
        salaryday10: number;
        salaryday15: number;
        salaryday20: number;
        day_to_weekend: number;
        nextHoliday: {
            holiday: boolean;
            name: string;
            wage: number;
            date: string;
            rest: number;
        };
        nextHolidayDate: string;
    }>;
}
