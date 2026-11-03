/**
 * use-file-validation 单元测试 —— maxSize / maxCount 校验。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\use-file-validation.test.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import { describe, expect, it } from 'vitest';

import { validateFiles } from './use-file-validation';

describe('use-file-validation', () => {
  describe('validateFiles', () => {
    it('无 maxSize / maxCount 限制时应全部通过', () => {
      const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')];
      const result = validateFiles(files, 0);
      expect(result.valid).toBe(true);
      expect(result.invalidFiles).toHaveLength(0);
    });

    it('maxSize 超限应标记 reason=size 并收集无效文件', () => {
      const small = new File(['x'.repeat(5)], 'small.txt');
      const big = new File(['x'.repeat(100)], 'big.txt');
      const result = validateFiles([small, big], 0, 10);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('size');
      expect(result.invalidFiles).toHaveLength(1);
      expect(result.invalidFiles[0]?.name).toBe('big.txt');
    });

    it('maxSize 未超限时应通过', () => {
      const file = new File(['x'.repeat(5)], 'small.txt');
      const result = validateFiles([file], 0, 1024);
      expect(result.valid).toBe(true);
    });

    it('maxCount 超限应标记 reason=count 并裁剪超出部分', () => {
      const files = [
        new File(['1'], 'a.txt'),
        new File(['2'], 'b.txt'),
        new File(['3'], 'c.txt'),
      ];
      // 已有 1 个，maxCount=2，再加 3 个 → 超出 2 个
      const result = validateFiles(files, 1, undefined, 2);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('count');
      expect(result.invalidFiles).toHaveLength(2);
    });

    it('maxCount 未超限时应通过', () => {
      const files = [new File(['1'], 'a.txt')];
      const result = validateFiles(files, 1, undefined, 3);
      expect(result.valid).toBe(true);
    });

    it('maxSize 优先于 maxCount（大小校验先失败）', () => {
      const big = new File(['x'.repeat(100)], 'big.txt');
      const result = validateFiles([big], 0, 10, 1);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('size');
    });

    it('existingCount 已等于 maxCount 时全部标记为 count 超出', () => {
      const files = [new File(['1'], 'a.txt')];
      const result = validateFiles(files, 2, undefined, 2);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('count');
      expect(result.invalidFiles).toHaveLength(1);
    });
  });
});
