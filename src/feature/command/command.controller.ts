import { Controller, Get, Query } from '@nestjs/common';
import { CommandService } from './command.service';

@Controller('command')
export class CommandController {
  constructor(private readonly commandService: CommandService) {}

  @Get('')
  async executeCommand(@Query('command') command: string) {
    return this.commandService.executeCommand(command);
  }
}