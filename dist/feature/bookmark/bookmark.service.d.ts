import type { Bookmark, BookmarkTag } from '@prisma/client';
import { CreateBookmarkDto } from './bookmark.dto';
import { AiService } from '../ai/ai.service';
export interface CompleteBookmark extends Bookmark {
    tags: BookmarkTag[];
}
export declare class BookmarkService {
    private readonly aiService;
    private readonly logger;
    constructor(aiService: AiService);
    createBookmark(data: CreateBookmarkDto): Promise<CompleteBookmark | null>;
    getBookmarkByUrl(url: string): Promise<CompleteBookmark | null>;
    deleteBookmarkByUrl(url: string): Promise<{
        message: string;
    }>;
    getHealthCheck(): {
        status: string;
        timestamp: string;
    };
    private summarizeBookmarkByContent;
    private truncateContent;
    private buildAiPrompt;
    private callAiWithTimeout;
    private parseAiResponse;
    private extractFromText;
    private processBookmarkTags;
    private processBookmarkTagsInTransaction;
    private fallbackUpdate;
    private getBookmarkTags;
}
