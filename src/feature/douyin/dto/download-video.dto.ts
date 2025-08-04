import { IsString, IsUrl, IsOptional } from 'class-validator';

export class DownloadVideoDto {
    @IsString()
    @IsUrl(undefined, { message: '请输入有效的抖音分享链接' })
    url: string;

    @IsOptional()
    @IsString()
    range?: string;

    @IsOptional()
    @IsString()
    quality?: string;
} 