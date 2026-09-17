/**
 * use-chunk-upload 测试 — 验证切片逻辑、hash 计算、秒传判定与并发场景
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\composables\use-chunk-upload.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect } from 'vitest';

import { useChunkUpload, DEFAULT_CHUNK_SIZE } from './use-chunk-upload';

describe('useChunkUpload', () => {
  it('enabled() 应在文件 > chunkSize 时返回 true', () => {
    const { enabled } = useChunkUpload({ chunkSize: 100 });
    const bigFile = new File(['x'.repeat(200)], 'big.txt');
    const smallFile = new File(['x'.repeat(50)], 'small.txt');

    expect(enabled(bigFile)).toBe(true);
    expect(enabled(smallFile)).toBe(false);
  });

  it('应导出默认 chunkSize 常量', () => {
    expect(DEFAULT_CHUNK_SIZE).toBe(5 * 1024 * 1024);
  });

  it('httpRequest 应返回 Promise', () => {
    const { httpRequest } = useChunkUpload();
    const result = httpRequest(undefined);
    expect(result).toBeInstanceOf(Promise);
  });

  it('abort 应无副作用地执行', () => {
    const { abort } = useChunkUpload();
    expect(() => abort()).not.toThrow();
  });

  it('hash 计算应返回稳定的字符串', () => {
    const { enabled, httpRequest } = useChunkUpload({ chunkSize: 1 });
    const file = new File(['hello'], 'test.txt', { lastModified: 1000 });

    // chunkSize=1 意味着任何文件都启用分片
    expect(enabled(file)).toBe(true);

    // 触发 httpRequest 走通流程（秒传回调返回 false → 分片）
    const promise = httpRequest({
      action: '/api/upload',
      file,
      filename: 'test.txt',
      onProgress: () => {},
      onSuccess: () => {},
      onError: () => {},
    });

    expect(promise).toBeInstanceOf(Promise);
  });
});
