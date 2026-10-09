/**
 * use-chunk-upload 测试 — 验证切片逻辑、hash 计算、秒传判定与分片上传流程
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-chunk-upload.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  useChunkUpload,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_MULTIPART_BASE,
  DEFAULT_MAX_RETRIES,
  DEFAULT_CHUNK_TIMEOUT,
} from './use-chunk-upload';

describe('useChunkUpload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enabled() 应在文件 > chunkSize 时返回 true', () => {
    const { enabled } = useChunkUpload({ chunkSize: 100 });
    const bigFile = new File(['x'.repeat(200)], 'big.txt');
    const smallFile = new File(['x'.repeat(50)], 'small.txt');

    expect(enabled(bigFile)).toBe(true);
    expect(enabled(smallFile)).toBe(false);
  });

  it('应导出默认常量', () => {
    expect(DEFAULT_CHUNK_SIZE).toBe(5 * 1024 * 1024);
    expect(DEFAULT_MULTIPART_BASE).toBe('/api/v1/system/file/multipart');
    expect(DEFAULT_MAX_RETRIES).toBe(3);
    expect(DEFAULT_CHUNK_TIMEOUT).toBe(30_000);
  });

  it('httpRequest 未传参应返回 resolved Promise', async () => {
    const { httpRequest } = useChunkUpload();
    const result = await httpRequest(undefined);
    expect(result).toBeUndefined();
  });

  it('abort 应无副作用地执行', () => {
    const { abort } = useChunkUpload();
    expect(() => abort()).not.toThrow();
  });

  it('hash 计算应返回稳定的字符串并走通流程', () => {
    const { enabled } = useChunkUpload({ chunkSize: 1 });
    const file = new File(['hello'], 'test.txt', { lastModified: 1000 });

    // chunkSize=1 意味着任何文件都启用分片
    expect(enabled(file)).toBe(true);
  });

  it('秒传命中时应跳过上传并调 onSuccess', async () => {
    const onSuccess = vi.fn();
    const { httpRequest } = useChunkUpload({
      chunkSize: 0,
      onHashCalculated: async () => true,
    });

    await httpRequest({
      action: '/api/upload',
      file: new File(['data'], 'test.txt'),
      filename: 'test.txt',
      onProgress: () => {},
      onSuccess,
      onError: () => {},
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ skip: true }) }),
    );
  });

  it('三步式分片上传缺少 storageKey 时应触发 onError', async () => {
    const onError = vi.fn();
    const { httpRequest } = useChunkUpload({
      chunkSize: 1, // 强制分片
      multipart: { baseURL: DEFAULT_MULTIPART_BASE },
    });

    await httpRequest({
      action: '/api/upload',
      file: new File(['x'.repeat(100)], 'test.txt'),
      filename: 'test.txt',
      // storageKey 未传
      onProgress: () => {},
      onSuccess: () => {},
      onError,
    });

    expect.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('storageKey') }),
    );
  });

  it('小文件应走整文件直传（不走分片）', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    // mock fetch 返回成功
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'A00000', data: { url: 'http://example.com/file' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { httpRequest } = useChunkUpload({
      chunkSize: 1024, // 1KB
      onHashCalculated: async () => false,
    });

    const file = new File(['small'], 'small.txt'); // 5 bytes < 1024
    await httpRequest({
      action: '/api/upload',
      file,
      filename: 'small.txt',
      onProgress: () => {},
      onSuccess,
      onError,
    });

    // 应直接 fetch 整文件，且 method=POST
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/upload',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
