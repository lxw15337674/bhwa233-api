import { CommandService } from './command.service';
export declare class CommandController {
    private readonly commandService;
    constructor(commandService: CommandService);
    executeCommand(command: string): unknown;
    getCommandList(): unknown;
}
