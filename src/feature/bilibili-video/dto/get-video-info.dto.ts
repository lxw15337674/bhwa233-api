import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetVideoInfoDto {
    @ApiProperty({
        description: 'B站视频链接',
        example: 'https://www.bilibili.com/video/BV1234567890',
    })
    @IsNotEmpty({ message: '请提供视频URL' })
    @IsString({ message: 'URL必须是字符串' })
    url: string;
} 