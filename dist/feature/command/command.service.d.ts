import { AiService } from '../ai/ai.service';
export interface CommandParams {
    args?: string;
    key: string;
}
export interface Command {
    key: string;
    description: string;
    type?: 'text' | 'image';
}
export declare class CommandService {
    private readonly aiService;
    private readonly logger;
    constructor(aiService: AiService);
    private commandMap;
    executeCommand(msg: string): Promise<{
        content: string;
        type: 'text' | 'image';
    }>;
    getCommandList(): Promise<Command[]>;
}
