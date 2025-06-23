import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsOptional, IsEnum } from 'class-validator';
import { AudioQualityEnums } from '../lib/audio-downloader';

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

    @ApiProperty({
        description: 'Audio quality',
        enum: AudioQualityEnums,
        example: AudioQualityEnums.High,
        required: false,
        default: AudioQualityEnums.High
    })
    @IsOptional()
    @IsEnum(AudioQualityEnums, { message: 'Invalid audio quality' })
    quality?: AudioQualityEnums;
} 