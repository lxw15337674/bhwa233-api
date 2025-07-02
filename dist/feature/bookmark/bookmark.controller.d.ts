import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './bookmark.dto';
export declare class BookmarkController {
    private readonly bookmarkService;
    constructor(bookmarkService: BookmarkService);
    createBookmark(createBookmarkDto: CreateBookmarkDto): Promise<import("./bookmark.service").CompleteBookmark | null>;
    getBookmarkByUrl(url: string): Promise<import("./bookmark.service").CompleteBookmark | null>;
    deleteBookmarkByUrl(url: string): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
