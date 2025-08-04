export interface ProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  headers?: Record<string, string>;
  contentType?: string;
}

export interface ProxyServiceResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
  contentType: string;
} 