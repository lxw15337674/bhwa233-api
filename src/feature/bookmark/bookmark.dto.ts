import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateBookmarkDto {
    @ApiProperty({
        description: 'Bookmark URL',
        example: 'https://example.com'
    })
    @IsNotEmpty({ message: 'URL cannot be empty' })
    @IsUrl({}, { message: 'Invalid URL format' })
    url: string;

    @ApiProperty({
        description: 'Bookmark title',
        example: 'Example Website',
        required: false
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({
        description: 'Bookmark image URL',
        example: 'https://example.com/image.jpg',
        required: false
    })
    @IsOptional()
    @IsString()
    image?: string;

    @ApiProperty({
        description: 'Bookmark remark',
        example: 'This is a useful website',
        required: false
    })
    @IsOptional()
    @IsString()
    remark?: string;

    @ApiProperty({
        description: 'Page content for AI summary',
        required: false
    })
    @IsOptional()
    @IsString()
    content?: string;
} 