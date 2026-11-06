/**
 * use-file-list 单元测试 —— 受控 / 非受控桥接、patch、清空。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\use-file-list.test.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import { describe, expect, it, vi } from 'vitest';

import { useFileList } from './use-file-list';

import type { UploadFileItem, YdFileUploadEmits, YdFileUploadProps } from './types';
import type { Ref } from 'vue';

import { nextTick, reactive, ref } from 'vue';

function makeItem(overrides: Partial<UploadFileItem> = {}): UploadFileItem {
  return {
    name: 'test.txt',
    percent: 0,
    size: 1024,
    status: 'ready',
    type: 'text/plain',
    uid: 'uid-1',
    ...overrides,
  };
}

function makeOptions(propsOverrides: Partial<YdFileUploadProps> = {}, emit?: YdFileUploadEmits) {
  const fileList = ref<UploadFileItem[]>() as Ref<UploadFileItem[] | undefined>;
  const hasOverride = 'fileList' in propsOverrides;
  if (!hasOverride) fileList.value = [];
  const props = reactive({
    ...propsOverrides,
    get fileList() {
      return hasOverride ? propsOverrides.fileList : fileList.value;
    },
  }) as unknown as YdFileUploadProps;
  return { emit: emit ?? vi.fn(), fileList, props };
}

describe('use-file-list', () => {
  describe('受控模式', () => {
    it('fileList 有值时应为受控模式', () => {
      const options = makeOptions();
      const list = useFileList(options);
      expect(list.isControlled.value).toBe(true);
    });

    it('fileList=null 时应为非受控模式', () => {
      const options = makeOptions({ fileList: null as unknown as UploadFileItem[] });
      const list = useFileList(options);
      expect(list.isControlled.value).toBe(false);
    });

    it('受控模式下 updateFileList 应触发 update:fileList', async () => {
      const emit = vi.fn();
      const options = makeOptions({}, emit);
      const list = useFileList(options);

      list.updateFileList([makeItem()]);
      await nextTick();

      expect(emit).toHaveBeenCalledWith('update:fileList', [
        expect.objectContaining({ uid: 'uid-1' }),
      ]);
    });

    it('受控模式下 clearFiles 应触发 update:fileList([])', async () => {
      const emit = vi.fn();
      const options = makeOptions({}, emit);
      const list = useFileList(options);

      list.clearFiles();
      await nextTick();

      expect(emit).toHaveBeenCalledWith('update:fileList', []);
    });

    it('受控模式下 patchFileItem 应触发 update:fileList', async () => {
      const emit = vi.fn();
      const item = makeItem();
      const options = makeOptions({ fileList: [item] }, emit);
      const list = useFileList(options);

      list.patchFileItem('uid-1', { status: 'uploading', percent: 50 });
      await nextTick();

      expect(emit).toHaveBeenCalledWith('update:fileList', [
        expect.objectContaining({ uid: 'uid-1', status: 'uploading', percent: 50 }),
      ]);
    });
  });

  describe('非受控模式', () => {
    it('非受控模式下 updateFileList 应写入内部列表', async () => {
      const options = makeOptions({ fileList: null as unknown as UploadFileItem[] });
      const list = useFileList(options);

      list.updateFileList([makeItem()]);
      await nextTick();

      expect(list.currentFileList.value).toHaveLength(1);
      expect(list.currentFileList.value[0]?.name).toBe('test.txt');
    });

    it('非受控模式下 patchFileItem 应更新内部列表', async () => {
      const options = makeOptions({ fileList: null as unknown as UploadFileItem[] });
      const list = useFileList(options);

      list.updateFileList([makeItem()]);
      await nextTick();

      list.patchFileItem('uid-1', { status: 'success', percent: 100 });
      await nextTick();

      expect(list.currentFileList.value[0]?.status).toBe('success');
      expect(list.currentFileList.value[0]?.percent).toBe(100);
    });

    it('非受控模式下 clearFiles 应清空内部列表', async () => {
      const options = makeOptions({ fileList: null as unknown as UploadFileItem[] });
      const list = useFileList(options);

      list.updateFileList([makeItem()]);
      await nextTick();
      expect(list.currentFileList.value).toHaveLength(1);

      list.clearFiles();
      await nextTick();
      expect(list.currentFileList.value).toHaveLength(0);
    });

    it('patchFileItem 对不存在的 uid 应静默忽略', async () => {
      const options = makeOptions({ fileList: null as unknown as UploadFileItem[] });
      const list = useFileList(options);

      list.updateFileList([makeItem()]);
      await nextTick();

      expect(() => list.patchFileItem('not-exist', { status: 'error' })).not.toThrow();
      expect(list.currentFileList.value[0]?.status).toBe('ready');
    });
  });

  describe('状态判断工具', () => {
    it('isFileUploading 应按状态返回', () => {
      const options = makeOptions();
      const list = useFileList(options);
      expect(list.isFileUploading(makeItem({ status: 'uploading' }))).toBe(true);
      expect(list.isFileUploading(makeItem({ status: 'ready' }))).toBe(false);
    });

    it('isFileError 应按状态返回', () => {
      const options = makeOptions();
      const list = useFileList(options);
      expect(list.isFileError(makeItem({ status: 'error' }))).toBe(true);
      expect(list.isFileError(makeItem({ status: 'ready' }))).toBe(false);
    });

    it('isFileSuccess 应按状态返回', () => {
      const options = makeOptions();
      const list = useFileList(options);
      expect(list.isFileSuccess(makeItem({ status: 'success' }))).toBe(true);
      expect(list.isFileSuccess(makeItem({ status: 'ready' }))).toBe(false);
    });

    it('isFileReady 应按状态返回', () => {
      const options = makeOptions();
      const list = useFileList(options);
      expect(list.isFileReady(makeItem({ status: 'ready' }))).toBe(true);
      expect(list.isFileReady(makeItem({ status: 'uploading' }))).toBe(false);
    });
  });

  describe('getFileList', () => {
    it('应返回当前列表快照', async () => {
      const options = makeOptions({ fileList: null as unknown as UploadFileItem[] });
      const list = useFileList(options);

      list.updateFileList([makeItem()]);
      await nextTick();

      const snapshot = list.getFileList();
      expect(snapshot).toHaveLength(1);
      expect(snapshot[0]?.uid).toBe('uid-1');
    });
  });
});
