import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DouyinController } from './douyin.controller';
import { DouyinService } from './douyin.service';

@Module({
    imports: [HttpModule],
    controllers: [DouyinController],
    providers: [DouyinService],
})
export class DouyinModule { } 