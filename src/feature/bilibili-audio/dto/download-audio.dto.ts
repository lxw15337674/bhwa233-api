import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class DownloadAudioDto {
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