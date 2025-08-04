import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';

export class BiliUrlDto {
    @ApiProperty({
        description: 'Bilibili video URL',
        example: 'https://www.bilibili.com/video/BV12P4y1s7aD',
        required: true
    })
    @IsNotEmpty({ message: 'URL cannot be empty' })
    @IsString({ message: 'URL must be a string' })
    @IsUrl({}, { message: 'Invalid URL format' })
    url: string;
}

export class BiliDownloadDto extends BiliUrlDto {
    @ApiProperty({
        description: 'Range header for partial content requests',
        example: 'bytes=0-1023',
        required: false
    })
    @IsOptional()
    @IsString()
    range?: string;

    @ApiProperty({
        description: 'Quality preference for video downloads',
        example: '1080p',
        required: false
    })
    @IsOptional()
    @IsString()
    quality?: string;
} 