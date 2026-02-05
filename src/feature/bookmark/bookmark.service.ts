import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateBookmarkDto } from './bookmark.dto';
import { AiService } from '../ai/ai.service';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { Bookmark, BookmarkTag, Prisma, PrismaClient } from '@prisma/client';

// 创建数据库连接适配器
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

// 使用适配器创建 Prisma 客户端
const prisma = new PrismaClient({ adapter });

export interface CompleteBookmark extends Bookmark {
    tags: BookmarkTag[];
}

@Injectable()
export class BookmarkService {
    private readonly logger = new Logger(BookmarkService.name);

    constructor(private readonly aiService: AiService) { }

    async createBookmark(data: CreateBookmarkDto): Promise<CompleteBookmark | null> {
        // 验证 URL
        if (!data.url || typeof data.url !== 'string' || data.url.trim() === '') {
            throw new BadRequestException('URL is required and cannot be empty');
        }

        const bookmarkData = {
            url: data.url,
            title: data.title || '',
            image: data.image || '',
            remark: data.remark || '',
        };

        // 创建或更新书签
        const newBookmark = await prisma.bookmark.upsert({
            where: { url: bookmarkData.url },
            update: { ...bookmarkData, loading: data.content ? true : false },
            create: { ...bookmarkData, loading: data.content ? true : false },
            include: { tags: true },
        });

        // 返回书签信息（如果有内容，loading: true；否则 loading: false）
        return newBookmark;
    }

    // 新增：专门用于后台AI摘要处理的方法
    async processBookmarkSummaryInBackground(id: string, content: string): Promise<void> {
        try {
            this.logger.log(`开始后台处理书签 ${id} 的AI摘要`);
            await this.summarizeBookmarkByContent(id, content);
            this.logger.log(`书签 ${id} 后台AI摘要处理完成`);
        } catch (error) {
            this.logger.error(`书签 ${id} 后台AI摘要处理失败:`, error);
            // 确保即使失败也要更新loading状态
            await this.fallbackUpdate(id);
        }
    }

    async getBookmarkByUrl(url: string): Promise<CompleteBookmark | null> {
        if (!url || typeof url !== 'string' || url.trim() === '') {
            throw new BadRequestException('URL is required and cannot be empty');
        }

        return await prisma.bookmark.findFirst({
            where: { url },
            include: { tags: true },
        });
    }

    async deleteBookmarkByUrl(url: string): Promise<{ message: string }> {
        if (!url || typeof url !== 'string' || url.trim() === '') {
            throw new BadRequestException('URL is required and cannot be empty');
        }

        const bookmark = await prisma.bookmark.findFirst({
            where: { url },
        });

        if (!bookmark) {
            throw new NotFoundException('Bookmark not found');
        }

        await prisma.bookmark.delete({
            where: { id: bookmark.id },
        });

        return { message: 'Bookmark deleted successfully' };
    }

    // 健康检查
    getHealthCheck(): { status: string; timestamp: string } {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    // AI摘要功能
    private async summarizeBookmarkByContent(id: string, content: string): Promise<CompleteBookmark | null> {
        this.logger.log(`开始为书签 ${id} 生成AI摘要`);

        try {
            // 1. 内容预处理 - 限制10,000字符
            const truncatedContent = this.truncateContent(content, 10000);

            // 2. 获取现有标签作为AI参考
            const existingTags = await this.getBookmarkTags();
            const existingTagNames = existingTags.map((t: BookmarkTag) => t.name);

            // 3. 构建AI请求
            const aiPrompt = this.buildAiPrompt(truncatedContent, existingTagNames);

            // 4. 调用AI服务
            const aiResponse = await this.aiService.generateResponse({
                prompt: aiPrompt,
                rolePrompt: '你是一个专业的内容分析师，请严格按照要求返回JSON格式的分析结果。'
            });

            // 5. 解析AI响应
            const parsedData = this.parseAiResponse(aiResponse);
            if (!parsedData) {
                this.logger.warn(`AI响应解析失败，降级处理`);
                return await this.fallbackUpdate(id);
            }

            // 6. 限制标签数量为3个
            const limitedTags = parsedData.tags.slice(0, 3);
            this.logger.log(`AI生成标签: ${limitedTags.join(', ')}`);

            // 7. 在事务中处理标签和更新书签 - 单次原子操作
            const finalBookmark = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // 处理标签 - 查找现有标签并创建新标签
                const allTags = await this.processBookmarkTagsInTransaction(tx, limitedTags);

                // 一次性更新书签（包括摘要、loading状态和标签关联）
                return await tx.bookmark.update({
                    where: { id },
                    data: {
                        summary: parsedData.summary || '',
                        loading: false,
                        tags: {
                            set: allTags.map((tag: BookmarkTag) => ({ id: tag.id }))
                        }
                    },
                    include: { tags: true }
                });
            });

            this.logger.log(`书签 ${id} AI摘要生成成功，摘要: ${parsedData.summary}，标签: ${limitedTags.join(', ')}`);
            return finalBookmark;

        } catch (error) {
            this.logger.error(`书签 ${id} AI摘要生成失败: ${error.message}`);
            return await this.fallbackUpdate(id);
        }
    }

    // 内容截断
    private truncateContent(content: string, maxLength: number): string {
        if (!content || content.length <= maxLength) {
            return content || '';
        }
        return content.slice(0, maxLength);
    }

    // 构建AI Prompt
    private buildAiPrompt(content: string, existingTagNames: string[]): string {
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

    // 解析AI响应
    private parseAiResponse(response: string): { summary: string; tags: string[] } | null {
        try {
            // 尝试直接解析JSON
            const parsed = JSON.parse(response);

            if (parsed.summary && Array.isArray(parsed.tags)) {
                return {
                    summary: parsed.summary,
                    tags: parsed.tags.filter((tag: any) => tag && typeof tag === 'string').map((tag: any) => String(tag)) // 限制标签长度
                };
            }
        } catch (error) {
            this.logger.warn(`JSON解析失败，尝试文本提取: ${error.message}`);
        }

        // 尝试从文本中提取信息
        return this.extractFromText(response);
    }

    // 从文本中提取信息
    private extractFromText(text: string): { summary: string; tags: string[] } | null {
        try {
            const summaryMatch = text.match(/"summary":\s*"([^"]+)"/);
            const tagsMatch = text.match(/"tags":\s*\[([^\]]+)\]/);

            if (summaryMatch) {
                let tags: string[] = [];
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
        } catch (error) {
            this.logger.warn(`文本提取失败: ${error.message}`);
        }

        return null;
    }

    // 处理书签标签
    private async processBookmarkTags(tagNames: string[]): Promise<BookmarkTag[]> {
        if (!tagNames || tagNames.length === 0) {
            return [];
        }

        // 查找现有标签
        const existingTags = await prisma.bookmarkTag.findMany({
            where: {
                name: { in: tagNames }
            }
        });

        // 创建缺失的标签
        const existingTagNames = existingTags.map((t: BookmarkTag) => t.name);
        const missingTagNames = tagNames.filter(name => !existingTagNames.includes(name));

        const newTags = await Promise.all(
            missingTagNames.map(name =>
                prisma.bookmarkTag.create({ data: { name } })
            )
        );

        this.logger.log(`创建了 ${newTags.length} 个新标签: ${missingTagNames.join(', ')}`);

        return [...existingTags, ...newTags];
    }

    // 在事务中处理书签标签
    private async processBookmarkTagsInTransaction(tx: Prisma.TransactionClient, tagNames: string[]): Promise<BookmarkTag[]> {
        if (!tagNames || tagNames.length === 0) {
            return [];
        }

        // 查找现有标签
        const existingTags = await tx.bookmarkTag.findMany({
            where: {
                name: { in: tagNames }
            }
        });

        // 创建缺失的标签
        const existingTagNames = existingTags.map((t: BookmarkTag) => t.name);
        const missingTagNames = tagNames.filter(name => !existingTagNames.includes(name));

        const newTags = await Promise.all(
            missingTagNames.map(name =>
                tx.bookmarkTag.create({ data: { name } })
            )
        );

        const allTags = [...existingTags, ...newTags];
        this.logger.log(`标签处理完成: ${allTags.map(t => t.name).join(', ')} (新增${newTags.length}个)`);

        return allTags;
    }

    // 降级更新 - AI失败时只更新loading状态
    private async fallbackUpdate(id: string): Promise<CompleteBookmark | null> {
        try {
            const updatedBookmark = await prisma.bookmark.update({
                where: { id },
                data: { loading: false },
                include: { tags: true },
            });
            this.logger.log(`书签 ${id} 降级更新完成`);
            return updatedBookmark;
        } catch (error) {
            this.logger.error(`书签 ${id} 降级更新失败: ${error.message}`);
            return null;
        }
    }

    private async getBookmarkTags(): Promise<BookmarkTag[]> {
        return await prisma.bookmarkTag.findMany();
    }
}