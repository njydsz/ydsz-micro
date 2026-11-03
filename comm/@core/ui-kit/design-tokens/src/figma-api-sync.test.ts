/**
 * figma-api-sync 模块测试。
 *
 * @path comm\@core\ui-kit\design-tokens\src\figma-api-sync.test.ts
 * @author ydsz-ai
 * @since 26.11.03
 */

import { describe, expect, it } from 'vitest';

import { buildFigmaVariablesPayload, getFigmaConfig } from './figma-api-sync.ts';

describe('figma-api-sync', () => {
  describe('getFigmaConfig', () => {
    it('未设置环境变量时返回 null', () => {
      // 清除环境变量
      const originalToken = process.env.FIGMA_ACCESS_TOKEN;
      const originalFileKey = process.env.FIGMA_FILE_KEY;

      delete process.env.FIGMA_ACCESS_TOKEN;
      delete process.env.FIGMA_FILE_KEY;

      expect(getFigmaConfig()).toBeNull();

      // 恢复
      if (originalToken) process.env.FIGMA_ACCESS_TOKEN = originalToken;
      if (originalFileKey) process.env.FIGMA_FILE_KEY = originalFileKey;
    });

    it('设置环境变量后返回配置', () => {
      const originalToken = process.env.FIGMA_ACCESS_TOKEN;
      const originalFileKey = process.env.FIGMA_FILE_KEY;

      process.env.FIGMA_ACCESS_TOKEN = 'test-token';
      process.env.FIGMA_FILE_KEY = 'test-file-key';

      const config = getFigmaConfig();
      expect(config).not.toBeNull();
      expect(config?.accessToken).toBe('test-token');
      expect(config?.fileKey).toBe('test-file-key');

      // 恢复
      if (originalToken !== undefined) process.env.FIGMA_ACCESS_TOKEN = originalToken;
      else delete process.env.FIGMA_ACCESS_TOKEN;
      if (originalFileKey !== undefined) process.env.FIGMA_FILE_KEY = originalFileKey;
      else delete process.env.FIGMA_FILE_KEY;
    });
  });

  describe('buildFigmaVariablesPayload', () => {
    it('生成包含颜色 variables', () => {
      const payload = buildFigmaVariablesPayload();
      const colorVars = payload.variables.filter((v) => v.resolvedType === 'COLOR');

      expect(colorVars.length).toBeGreaterThan(0);
    });

    it('生成包含间距 variables', () => {
      const payload = buildFigmaVariablesPayload();
      const spacingVars = payload.variables.filter((v) => v.name.startsWith('spacing/'));

      expect(spacingVars.length).toBeGreaterThan(0);
    });

    it('生成包含字体大小 variables', () => {
      const payload = buildFigmaVariablesPayload();
      const fontSizeVars = payload.variables.filter((v) => v.name.startsWith('fontSize/'));

      expect(fontSizeVars.length).toBeGreaterThan(0);
    });

    it('每个 variable 都有 valuesByMode', () => {
      const payload = buildFigmaVariablesPayload();

      for (const v of payload.variables) {
        expect(v.valuesByMode).toBeDefined();
        expect(Object.keys(v.valuesByMode).length).toBeGreaterThan(0);
      }
    });

    it('颜色 variable 值为 RGBA 格式', () => {
      const payload = buildFigmaVariablesPayload();
      const colorVar = payload.variables.find((v) => v.resolvedType === 'COLOR');

      expect(colorVar).toBeDefined();
      const value = colorVar?.valuesByMode.default as { b: number; g: number; r: number };
      expect(value.r).toBeDefined();
      expect(value.g).toBeDefined();
      expect(value.b).toBeDefined();
      expect(typeof value.r).toBe('number');
      expect(typeof value.g).toBe('number');
      expect(typeof value.b).toBe('number');
    });
  });
});
