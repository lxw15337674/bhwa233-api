import { ProxyRequestDto } from './dto/proxy-request.dto';
import { ProxyServiceResponse } from './interfaces/proxy-response.interface';
export declare class ProxyService {
    private readonly logger;
    makeProxyRequest(requestDto: ProxyRequestDto): Promise<ProxyServiceResponse>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        service: string;
    }>;
}
