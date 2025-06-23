import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BilibiliAudioController } from './bilibili-audio.controller';
import { BilibiliAudioService } from './bilibili-audio.service';

@Module({
    imports: [HttpModule],
    controllers: [BilibiliAudioController],
    providers: [BilibiliAudioService],
    exports: [BilibiliAudioService]
})
export class BilibiliAudioModule { } 