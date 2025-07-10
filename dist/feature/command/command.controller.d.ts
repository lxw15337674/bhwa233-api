import { CommandService } from './command.service';
export declare class CommandController {
    private readonly commandService;
    constructor(commandService: CommandService);
    executeCommand(command: string): Promise<{
        content: string;
        type: "text" | "image";
    }>;
    getCommandList(): Promise<import("./command.service").Command[]>;
}
