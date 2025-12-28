import { IsString, IsArray, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageDto {
    @ApiProperty({ description: '发送者昵称', example: '张三' })
    @IsString()
    sender: string;

    @ApiProperty({ description: '消息内容', example: '今天天气真好' })
    @IsString()
    content: string;

    @ApiProperty({ description: '时间戳', example: '2025-12-28 10:30' })
    @IsString()
    timestamp: string;
}

export class SummarizeRequestDto {
    @ApiProperty({
        description: '消息列表',
        type: [MessageDto],
        example: [
            { sender: '张三', content: '今天天气真好', timestamp: '2025-12-28 10:30' },
            { sender: '李四', content: '是啊，出去玩吧', timestamp: '2025-12-28 10:31' }
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MessageDto)
    messages: MessageDto[];

    @ApiPropertyOptional({ description: '机器人自己的名字（用于过滤）', example: 'Bot' })
    @IsOptional()
    @IsString()
    selfName?: string;

    @ApiPropertyOptional({ description: '群名', example: '技术交流群' })
    @IsOptional()
    @IsString()
    groupName?: string;

    @ApiPropertyOptional({ description: '是否包含发言排行榜', default: true })
    @IsOptional()
    @IsBoolean()
    includeRanking?: boolean = true;
}
