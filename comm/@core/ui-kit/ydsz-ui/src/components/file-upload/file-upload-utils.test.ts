/**
 * file-upload-utils 单元测试 —— 纯函数覆盖。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\file-upload-utils.test.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHUNK_BYTES,
  formatFileSize,
  generateUid,
  getFileIconType,
  getThumbnailUrl,
  isImage,
} from './file-upload-utils';

import type { UploadFileItem } from './types';

describe('file-upload-utils', () => {
  describe('DEFAULT_CHUNK_BYTES', () => {
    it('应为 5 MB', () => {
      expect(DEFAULT_CHUNK_BYTES).toBe(5 * 1024 * 1024);
    });
  });

  describe('generateUid', () => {
    it('应生成非空字符串', () => {
      const uid = generateUid();
      expect(typeof uid).toBe('string');
      expect(uid.length).toBeGreaterThan(0);
    });

    it('两次生成应不同', () => {
      const a = generateUid();
      const b = generateUid();
      expect(a).not.toBe(b);
    });
  });

  describe('formatFileSize', () => {
    it('0 / undefined / NaN 应返回 0 B', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(undefined)).toBe('0 B');
      expect(formatFileSize(Number.NaN)).toBe('0 B');
    });

    it('字节级应不保留小数', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('KB / MB / GB 应保留 1 位小数', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });

    it('超出 GB 应停留在 GB 单位', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 5)).toBe('5.0 GB');
    });
  });

  describe('getFileIconType', () => {
    it('图片 MIME 返回 image', () => {
      expect(getFileIconType('image/png')).toBe('image');
      expect(getFileIconType('image/jpeg')).toBe('image');
    });

    it('PDF 返回 pdf', () => {
      expect(getFileIconType('application/pdf')).toBe('pdf');
    });

    it('文本 MIME 返回 text', () => {
      expect(getFileIconType('text/plain')).toBe('text');
    });

    it('其他返回 file', () => {
      expect(getFileIconType('application/octet-stream')).toBe('file');
    });
  });

  describe('isImage', () => {
    it('image/* 应返回 true', () => {
      expect(isImage('image/png')).toBe(true);
      expect(isImage('image/svg+xml')).toBe(true);
    });

    it('非图片应返回 false', () => {
      expect(isImage('text/plain')).toBe(false);
      expect(isImage('application/pdf')).toBe(false);
    });
  });

  describe('getThumbnailUrl', () => {
    it('应优先返回已上传的 url', () => {
      const file: UploadFileItem = {
        name: 'a.png',
        size: 1024,
        status: 'success',
        type: 'image/png',
        uid: 'u1',
        url: 'http://x/y.png',
      };
      expect(getThumbnailUrl(file)).toBe('http://x/y.png');
    });

    it('对无 url 的非图片返回 undefined', () => {
      const file: UploadFileItem = {
        name: 'a.pdf',
        size: 1024,
        status: 'ready',
        type: 'application/pdf',
        uid: 'u2',
      };
      expect(getThumbnailUrl(file)).toBeUndefined();
    });
  });
});
