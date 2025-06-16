import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Query,
    UseGuards,
    ValidationPipe,
    UsePipes,
    HttpCode,
    HttpStatus,
    BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { BookmarkService } from './bookmark.service';
import { ApiKeyGuard } from '../../guards/api-key.guard';
import { CreateBookmarkDto } from './bookmark.dto';

@ApiTags('Bookmarks')
@ApiSecurity('api-key')
@Controller('bookmark')
@UseGuards(ApiKeyGuard)
@UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
}))
export class BookmarkController {
    constructor(private readonly bookmarkService: BookmarkService) { }

    @ApiOperation({ summary: 'Create or update a bookmark' })
    @ApiResponse({ status: 201, description: 'Bookmark created/updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Invalid API key' })
    @Post()
    async createBookmark(@Body() createBookmarkDto: CreateBookmarkDto) {
        return this.bookmarkService.createBookmark(createBookmarkDto);
    }

    @ApiOperation({ summary: 'Get bookmark by URL' })
    @ApiQuery({ name: 'url', description: 'Bookmark URL to search for', example: 'https://example.com' })
    @ApiResponse({ status: 200, description: 'Bookmark retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Bookmark not found' })
    @ApiResponse({ status: 400, description: 'Invalid URL parameter' })
    @Get('search')
    async getBookmarkByUrl(@Query('url') url: string) {
        if (!url) {
            throw new BadRequestException('URL parameter is required');
        }
        return this.bookmarkService.getBookmarkByUrl(url);
    }

    @ApiOperation({ summary: 'Delete bookmark by URL' })
    @ApiQuery({ name: 'url', description: 'Bookmark URL to delete', example: 'https://example.com' })
    @ApiResponse({ status: 204, description: 'Bookmark deleted successfully' })
    @ApiResponse({ status: 404, description: 'Bookmark not found' })
    @ApiResponse({ status: 400, description: 'Invalid URL parameter' })
    @Delete('search')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBookmarkByUrl(@Query('url') url: string) {
        if (!url) {
            throw new BadRequestException('URL parameter is required');
        }
        await this.bookmarkService.deleteBookmarkByUrl(url);
    }

    @ApiOperation({ summary: 'Health check for bookmark service' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    @Get('health')
    async healthCheck() {
        return this.bookmarkService.getHealthCheck();
    }
} 