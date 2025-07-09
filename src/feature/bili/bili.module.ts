import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { BiliController } from './bili.controller';
import { BiliService } from './bili.service';
import { BiliApiClient } from './lib/bili-api-client';
import { BiliStreamHandler } from './lib/bili-stream-handler';

@Module({
    imports: [HttpModule],
    controllers: [BiliController],
    providers: [
        BiliService,
        BiliApiClient,
        BiliStreamHandler
    ],
    exports: [BiliService],
})
export class BiliModule {} 