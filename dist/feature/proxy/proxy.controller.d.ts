import { Response } from 'express';
import { ProxyService } from './proxy.service';
import { ProxyRequestDto } from './dto/proxy-request.dto';
import { ProxyResponse } from './interfaces/proxy-response.interface';
export declare class ProxyController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    getProxyRequest(query: ProxyRequestDto): Promise<ProxyResponse>;
    postProxyRequest(body: ProxyRequestDto): Promise<ProxyResponse>;
    streamProxyRequest(query: ProxyRequestDto, res: Response): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        service: string;
    }>;
}
