import { BookmarkSummary } from '@/feature/ai/ai.service';

export default async function getSummarizeBookmark(url: string, existingTags: string[]): Promise<BookmarkSummary> {
    try {
        const response = await fetch('/api/ai/summarize-bookmark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, existingTags }),
        });

        if (!response.ok) {
            throw new Error('Failed to get summary');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting bookmark summary:', error);
        return { title: '', summary: '', tags: [], image: '' };
    }
} 