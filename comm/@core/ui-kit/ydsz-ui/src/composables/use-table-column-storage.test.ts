// cspell:words localstorage
/**
 * useTableColumnStorage 单元测试 —— 验证列配置持久化逻辑。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-column-storage.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StoredColumnConfig } from './use-table-column-storage';
import { useTableColumnStorage } from './use-table-column-storage';

describe('useTableColumnStorage', () => {
  const STORAGE_KEY = 'yd:table:col:test-table';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loadColumnConfig 在无存储时应返回空数组', () => {
    const { loadColumnConfig } = useTableColumnStorage('test-table');
    expect(loadColumnConfig()).toEqual([]);
  });

  it('saveColumnConfig 后应能正确加载', () => {
    const { saveColumnConfig, loadColumnConfig } = useTableColumnStorage('test-table');
    const config: StoredColumnConfig[] = [
      { isHidden: false, key: 'name', sort: 0, width: '120px' },
      { isHidden: true, key: 'age', sort: 1 },
    ];

    saveColumnConfig(config);
    const loaded = loadColumnConfig();

    expect(loaded).toHaveLength(2);
    expect(loaded[0].key).toBe('name');
    expect(loaded[0].width).toBe('120px');
    expect(loaded[1].isHidden).toBe(true);
  });

  it('clearColumnConfig 应清除存储', () => {
    const { saveColumnConfig, loadColumnConfig, clearColumnConfig } = useTableColumnStorage('test-table');
    saveColumnConfig([{ key: 'name' }]);
    clearColumnConfig();
    expect(loadColumnConfig()).toEqual([]);
  });

  it('版本不匹配时应返回空数组', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns: [{ key: 'a' }], version: 999 }));
    const { loadColumnConfig } = useTableColumnStorage('test-table');
    expect(loadColumnConfig()).toEqual([]);
  });

  it('JSON 解析失败时应静默返回空数组', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    const { loadColumnConfig } = useTableColumnStorage('test-table');
    expect(loadColumnConfig()).toEqual([]);
  });

  it('localStorage 不可用时 save 应静默降级', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('disabled');
    });
    const { saveColumnConfig } = useTableColumnStorage('test-table');
    expect(() => saveColumnConfig([{ key: 'a' }])).not.toThrow();
    spy.mockRestore();
  });
});
