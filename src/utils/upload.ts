import axios from 'axios';
import { Logger } from '@nestjs/common';

interface GalleryUploadResponse {
  src: string;
}

interface ParsedImageDataUrl {
  buffer: Buffer;
  mimeType: string;
}

const GALLERY_URL = 'https://gallery233.pages.dev';
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const logger = new Logger('UploadUtil');

function parseImageDataUrl(imageData: string): ParsedImageDataUrl {
  const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!match) {
    throw new Error('图片必须是 data:image/...;base64,... 格式');
  }

  const mimeType = match[1].toLowerCase();
  if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error('只支持 png、jpeg、webp、gif 图片');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) {
    throw new Error('图片内容为空');
  }
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('图片过大，请控制在 8MB 以内');
  }

  return { buffer, mimeType };
}

function sanitizeFileName(
  fileName: string | undefined,
  mimeType: string,
): string {
  const fallbackExtension = IMAGE_EXTENSIONS[mimeType] || 'png';
  const fallback = `uploaded_image.${fallbackExtension}`;
  if (!fileName) {
    return fallback;
  }

  const safeName = fileName
    .trim()
    .replace(/[/\\?%*:|"<>\x00-\x1F]/g, '-')
    .slice(0, 180);
  if (!safeName) {
    return fallback;
  }

  return /\.[a-zA-Z0-9]+$/.test(safeName)
    ? safeName
    : `${safeName}.${fallbackExtension}`;
}

export async function uploadImageDataUrl(
  imageData: string,
  fileName?: string,
): Promise<string> {
  const { buffer, mimeType } = parseImageDataUrl(imageData);
  return uploadImageBuffer(
    buffer,
    mimeType,
    sanitizeFileName(fileName, mimeType),
  );
}

export async function uploadImageBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName?: string,
): Promise<string> {
  try {
    if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new Error('只支持 png、jpeg、webp、gif 图片');
    }
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('图片过大，请控制在 8MB 以内');
    }

    const formData = new FormData();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    formData.append(
      'file',
      new Blob([arrayBuffer], { type: mimeType }),
      sanitizeFileName(fileName, mimeType),
    );

    const response = await axios.post<GalleryUploadResponse[]>(
      `${GALLERY_URL}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    const url = response.data?.[0]?.src;
    if (!url) {
      throw new Error('No upload response data');
    }

    return url;
  } catch (error) {
    logger.error(`上传失败: ${error}`);
    throw new Error(
      `Error uploading image: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export default uploadImageDataUrl;
