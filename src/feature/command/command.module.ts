import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { AiModule } from '../ai/ai.module';
import { ScreenshotService } from '../../utils/screenshot.service';

@Module({
  imports: [ AiModule],
  controllers: [CommandController],
  providers: [CommandService, ScreenshotService],
  exports: [CommandService],
})
export class CommandModule {}