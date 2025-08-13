"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bookmark_service_1 = require("./bookmark.service");
const api_key_guard_1 = require("../../guards/api-key.guard");
const bookmark_dto_1 = require("./bookmark.dto");
const functions_1 = require("@vercel/functions");
let BookmarkController = class BookmarkController {
    constructor(bookmarkService) {
        this.bookmarkService = bookmarkService;
    }
    async createBookmark(createBookmarkDto) {
        const bookmark = await this.bookmarkService.createBookmark(createBookmarkDto);
        if (bookmark && createBookmarkDto.content && createBookmarkDto.content.trim() !== '') {
            (0, functions_1.waitUntil)(this.bookmarkService.processBookmarkSummaryInBackground(bookmark.id, createBookmarkDto.content));
        }
        return bookmark;
    }
    async getBookmarkByUrl(url) {
        if (!url) {
            throw new common_1.BadRequestException('URL parameter is required');
        }
        return this.bookmarkService.getBookmarkByUrl(url);
    }
    async deleteBookmarkByUrl(url) {
        if (!url) {
            throw new common_1.BadRequestException('URL parameter is required');
        }
        await this.bookmarkService.deleteBookmarkByUrl(url);
    }
    async healthCheck() {
        return this.bookmarkService.getHealthCheck();
    }
};
exports.BookmarkController = BookmarkController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create or update a bookmark' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bookmark created/updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid API key' }),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bookmark_dto_1.CreateBookmarkDto]),
    __metadata("design:returntype", Promise)
], BookmarkController.prototype, "createBookmark", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get bookmark by URL' }),
    (0, swagger_1.ApiQuery)({ name: 'url', description: 'Bookmark URL to search for', example: 'https://example.com' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bookmark retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Bookmark not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL parameter' }),
    (0, common_1.Get)('search'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookmarkController.prototype, "getBookmarkByUrl", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete bookmark by URL' }),
    (0, swagger_1.ApiQuery)({ name: 'url', description: 'Bookmark URL to delete', example: 'https://example.com' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Bookmark deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Bookmark not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL parameter' }),
    (0, common_1.Delete)('search'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Query)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookmarkController.prototype, "deleteBookmarkByUrl", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Health check for bookmark service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    (0, common_1.Get)('health'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookmarkController.prototype, "healthCheck", null);
exports.BookmarkController = BookmarkController = __decorate([
    (0, swagger_1.ApiTags)('Bookmarks'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.Controller)('bookmark'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    })),
    __metadata("design:paramtypes", [bookmark_service_1.BookmarkService])
], BookmarkController);
//# sourceMappingURL=bookmark.controller.js.map