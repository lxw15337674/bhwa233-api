import { Module } from '@nestjs/common';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [AiModule],
    controllers: [BookmarkController],
    providers: [BookmarkService],
    exports: [BookmarkService],
})
export class BookmarkModule { } 