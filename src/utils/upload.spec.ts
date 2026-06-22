import axios from 'axios';
import { uploadImageDataUrl } from './upload';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('uploadImageDataUrl', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset();
  });

  it('uploads supported image data urls and returns the gallery url', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [{ src: 'https://gallery233.pages.dev/demo.png' }],
    });

    const url = await uploadImageDataUrl(
      'data:image/png;base64,aGVsbG8=',
      'demo.png',
    );

    expect(url).toBe('https://gallery233.pages.dev/demo.png');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://gallery233.pages.dev/upload',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  });

  it('rejects unsupported image types before uploading', async () => {
    await expect(
      uploadImageDataUrl('data:image/svg+xml;base64,PHN2Zy8+', 'demo.svg'),
    ).rejects.toThrow('只支持 png、jpeg、webp、gif 图片');

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
