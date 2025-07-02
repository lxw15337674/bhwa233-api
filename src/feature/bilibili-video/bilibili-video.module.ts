import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BilibiliVideoController } from './bilibili-video.controller';
import { BilibiliVideoService } from './bilibili-video.service';

@Module({
    imports: [HttpModule],
    controllers: [BilibiliVideoController],
    providers: [BilibiliVideoService],
    exports: [BilibiliVideoService],
})
export class BilibiliVideoModule { } 