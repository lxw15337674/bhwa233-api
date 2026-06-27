import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { AiModule } from '../ai/ai.module';
import { ScreenshotService } from '../../utils/screenshot.service';
import { HttpModule } from '@nestjs/axios';
import { AiSessionCacheService } from './ai-session-cache.service';
import { CustomCommandService } from './custom-command.service';
import { CommandAuthService } from './command-auth.service';

@Module({
  imports: [AiModule, HttpModule],
  controllers: [CommandController],
  providers: [
    CommandService,
    ScreenshotService,
    AiSessionCacheService,
    CustomCommandService,
    CommandAuthService,
  ],
  exports: [CommandService],
})
export class CommandModule {}
