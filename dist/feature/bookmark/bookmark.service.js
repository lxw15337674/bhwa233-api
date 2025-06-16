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
var BookmarkService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ai_service_1 = require("../ai/ai.service");
const prisma = new client_1.PrismaClient();
let BookmarkService = BookmarkService_1 = class BookmarkService {
    constructor(aiService) {
        this.aiService = aiService;
        this.logger = new common_1.Logger(BookmarkService_1.name);
    }
    async createBookmark(data) {
        if (!data.url || typeof data.url !== 'string' || data.url.trim() === '') {
            throw new common_1.BadRequestException('URL is required and cannot be empty');
        }
        const bookmarkData = {
            url: data.url,
            title: data.title || '',
            image: data.image || '',
            remark: data.remark || '',
        };
        const newBookmark = await prisma.bookmark.upsert({
            where: { url: bookmarkData.url },
            update: { ...bookmarkData, loading: true },
            create: { ...bookmarkData, loading: true },
        });
        if (data.content && data.content.trim() !== '') {
            try {
                const updatedBookmark = await this.summarizeBookmarkByContent(newBookmark.id, data.content);
                if (updatedBookmark) {
                    return updatedBookmark;
                }
            }
            catch (error) {
                console.error('生成AI摘要失败:', error);
                await prisma.bookmark.update({
                    where: { id: newBookmark.id },
                    data: { loading: false },
                }).catch((updateError) => {
                    console.error('更新loading状态失败:', updateError);
                });
            }
        }
        const completeBookmark = await prisma.bookmark.findUnique({
            where: { id: newBookmark.id },
            include: { tags: true },
        });
        return completeBookmark;
    }
    async getBookmarkByUrl(url) {
        if (!url || typeof url !== 'string' || url.trim() === '') {
            throw new common_1.BadRequestException('URL is required and cannot be empty');
        }
        return await prisma.bookmark.findFirst({
            where: { url },
            include: { tags: true },
        });
    }
    async deleteBookmarkByUrl(url) {
        if (!url || typeof url !== 'string' || url.trim() === '') {
            throw new common_1.BadRequestException('URL is required and cannot be empty');
        }
        const bookmark = await prisma.bookmark.findFirst({
            where: { url },
        });
        if (!bookmark) {
            throw new common_1.NotFoundException('Bookmark not found');
        }
        await prisma.bookmark.delete({
            where: { id: bookmark.id },
        });
        return { message: 'Bookmark deleted successfully' };
    }
    getHealthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
    async summarizeBookmarkByContent(id, content) {
        this.logger.log(`开始为书签 ${id} 生成AI摘要`);
        try {
            const truncatedContent = this.truncateContent(content, 10000);
            this.logger.log(`内容已截断至 ${truncatedContent.length} 字符`);
            const existingTags = await this.getBookmarkTags();
            const existingTagNames = existingTags.map((t) => t.name);
            const aiPrompt = this.buildAiPrompt(truncatedContent, existingTagNames);
            this.logger.log(`开始AI分析，现有标签数量: ${existingTagNames.length}`);
            const aiResponse = await this.callAiWithTimeout(aiPrompt, 30000);
            const parsedData = this.parseAiResponse(aiResponse);
            if (!parsedData) {
                this.logger.warn(`AI响应解析失败，降级处理`);
                return await this.fallbackUpdate(id);
            }
            const limitedTags = parsedData.tags.slice(0, 3);
            this.logger.log(`AI生成标签: ${limitedTags.join(', ')}`);
            const allTags = await this.processBookmarkTags(limitedTags);
            await prisma.bookmark.update({
                where: { id },
                data: {
                    summary: parsedData.summary || '',
                    loading: false,
                    tags: {
                        set: [],
                    },
                },
            });
            await prisma.bookmark.update({
                where: { id },
                data: {
                    tags: {
                        connect: allTags.map(tag => ({ id: tag.id })),
                    },
                },
            });
            const finalBookmark = await prisma.bookmark.findUnique({
                where: { id },
                include: { tags: true },
            });
            this.logger.log(`书签 ${id} AI摘要生成成功，摘要: ${parsedData.summary}，标签: ${limitedTags.join(', ')}`);
            return finalBookmark;
        }
        catch (error) {
            this.logger.error(`书签 ${id} AI摘要生成失败: ${error.message}`);
            return await this.fallbackUpdate(id);
        }
    }
    truncateContent(content, maxLength) {
        if (!content || content.length <= maxLength) {
            return content || '';
        }
        return content.slice(0, maxLength);
    }
    buildAiPrompt(content, existingTagNames) {
        const existingTagsText = existingTagNames.length > 0
            ? `\n参考现有标签（优先使用）：${existingTagNames.join('、')}`
            : '';
        return `你是一个专业的中文网页内容分析师。请分析以下中文网页内容，并返回JSON格式的结果。

要求：
1. 生成50字以内的中文内容摘要
2. 提取最多2个最相关的中文标签
3. 标签应该是通用的中文分类词汇，如：技术、教程、新闻、工具、编程、设计等${existingTagsText}

返回严格的JSON格式：
{
  "summary": "内容摘要",
  "tags": ["标签1", "标签2", "标签3"]
}

网页内容：
${content}`;
    }
    async callAiWithTimeout(prompt, timeoutMs) {
        const aiPromise = this.aiService.generateResponse({
            prompt,
            rolePrompt: '你是一个专业的内容分析师，请严格按照要求返回JSON格式的分析结果。'
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI调用超时')), timeoutMs));
        return Promise.race([aiPromise, timeoutPromise]);
    }
    parseAiResponse(response) {
        try {
            const parsed = JSON.parse(response);
            if (parsed.summary && Array.isArray(parsed.tags)) {
                return {
                    summary: String(parsed.summary).slice(0, 50),
                    tags: parsed.tags.filter((tag) => tag && typeof tag === 'string').map((tag) => String(tag).slice(0, 20))
                };
            }
        }
        catch (error) {
            this.logger.warn(`JSON解析失败，尝试文本提取: ${error.message}`);
        }
        return this.extractFromText(response);
    }
    extractFromText(text) {
        try {
            const summaryMatch = text.match(/"summary":\s*"([^"]+)"/);
            const tagsMatch = text.match(/"tags":\s*\[([^\]]+)\]/);
            if (summaryMatch) {
                let tags = [];
                if (tagsMatch) {
                    tags = tagsMatch[1]
                        .split(',')
                        .map(tag => tag.replace(/["\s]/g, ''))
                        .filter(tag => tag.length > 0)
                        .slice(0, 3);
                }
                return {
                    summary: summaryMatch[1].slice(0, 50),
                    tags
                };
            }
        }
        catch (error) {
            this.logger.warn(`文本提取失败: ${error.message}`);
        }
        return null;
    }
    async processBookmarkTags(tagNames) {
        if (!tagNames || tagNames.length === 0) {
            return [];
        }
        const existingTags = await prisma.bookmarkTag.findMany({
            where: {
                name: { in: tagNames }
            }
        });
        const existingTagNames = existingTags.map((t) => t.name);
        const missingTagNames = tagNames.filter(name => !existingTagNames.includes(name));
        const newTags = await Promise.all(missingTagNames.map(name => prisma.bookmarkTag.create({ data: { name } })));
        this.logger.log(`创建了 ${newTags.length} 个新标签: ${missingTagNames.join(', ')}`);
        return [...existingTags, ...newTags];
    }
    async fallbackUpdate(id) {
        try {
            const updatedBookmark = await prisma.bookmark.update({
                where: { id },
                data: { loading: false },
                include: { tags: true },
            });
            this.logger.log(`书签 ${id} 降级更新完成`);
            return updatedBookmark;
        }
        catch (error) {
            this.logger.error(`书签 ${id} 降级更新失败: ${error.message}`);
            return null;
        }
    }
    async getBookmarkTags() {
        return await prisma.bookmarkTag.findMany();
    }
};
exports.BookmarkService = BookmarkService;
exports.BookmarkService = BookmarkService = BookmarkService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], BookmarkService);
//# sourceMappingURL=bookmark.service.js.map