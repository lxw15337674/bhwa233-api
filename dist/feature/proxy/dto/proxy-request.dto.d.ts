export declare enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH"
}
export declare class ProxyRequestDto {
    url: string;
    method?: HttpMethod;
    origin?: string;
    referer?: string;
    userAgent?: string;
    headers?: string;
    body?: string;
}
