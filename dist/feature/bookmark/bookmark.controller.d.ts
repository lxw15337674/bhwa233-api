import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './bookmark.dto';
export declare class BookmarkController {
    private readonly bookmarkService;
    constructor(bookmarkService: BookmarkService);
    createBookmark(createBookmarkDto: CreateBookmarkDto): unknown;
    getBookmarkByUrl(url: string): unknown;
    deleteBookmarkByUrl(url: string): any;
    healthCheck(): unknown;
}
