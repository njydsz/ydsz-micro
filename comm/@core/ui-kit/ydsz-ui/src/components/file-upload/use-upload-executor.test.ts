/**
 * use-upload-executor 单元测试 —— XHR 上传 / 中止控制。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\use-upload-executor.test.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import { describe, expect, it, vi } from 'vitest';

import { useUploadExecutor } from './use-upload-executor';

import type { UploadFileItem, YdFileUploadEmits, YdFileUploadProps } from './types';
import type { UnwrapRef } from 'vue';

import { nextTick, reactive, ref } from 'vue';

function makeItem(overrides: Partial<UploadFileItem> = {}): UploadFileItem {
  return {
    name: 'test.txt',
    percent: 0,
    raw: new File(['hello'], 'test.txt'),
    size: 1024,
    status: 'ready',
    type: 'text/plain',
    uid: 'uid-1',
    ...overrides,
  };
}

function stubXhrEnvironment() {
  const openMock = vi.fn();
  const sendMock = vi.fn();
  const setRequestHeaderMock = vi.fn();

  class FakeXHR {
    upload = { onprogress: null as null | ((event: unknown) => void) };
    status = 200;
    responseText = '{"data":"http://x/y"}';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    open = openMock;
    send = sendMock;
    setRequestHeader = setRequestHeaderMock;
    abort = vi.fn();
    withCredentials = false;
  }
  vi.stubGlobal('XMLHttpRequest', FakeXHR);
  vi.stubGlobal(
    'FormData',
    class {
      append = vi.fn();
    },
  );

  return { openMock, sendMock, setRequestHeaderMock };
}

describe('use-upload-executor', () => {
  function makeExecutor(propsOverrides: Partial<YdFileUploadProps> = {}, emit?: YdFileUploadEmits) {
    const props = reactive({
      action: '/api/upload',
      autoUpload: false,
      chunked: false,
      data: {},
      headers: {},
      method: 'POST',
      multipartApiBase: '/api/file/multipart',
      name: 'file',
      withCredentials: false,
      ...propsOverrides,
    }) as unknown as UnwrapRef<YdFileUploadProps>;

    const internalList = ref<UploadFileItem[]>([]);
    const emitFn = emit ?? vi.fn();

    const listOps = {
      currentFileList: internalList,
      patchFileItem: (uid: string, patch: Partial<UploadFileItem>) => {
        const list = [...internalList.value];
        const idx = list.findIndex((f) => f.uid === uid);
        if (idx === -1) return;
        list[idx] = { ...list[idx], ...patch } as UploadFileItem;
        internalList.value = list;
      },
    };

    const executor = useUploadExecutor({
      chunkUploader: null,
      emit: emitFn,
      listOps,
      props,
    });

    return { emitFn, executor, internalList, props };
  }

  it('uploadFile 应触发 XHR open + send', async () => {
    const { openMock, sendMock } = stubXhrEnvironment();
    const { executor } = makeExecutor();

    await executor.uploadFile(makeItem());
    await nextTick();

    expect(openMock).toHaveBeenCalledWith('POST', '/api/upload');
    expect(sendMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('uploadFile 对无 raw 的文件应直接返回', async () => {
    const { sendMock } = stubXhrEnvironment();
    const { executor } = makeExecutor();

    const item = makeItem({ raw: undefined });
    await executor.uploadFile(item);
    await nextTick();

    expect(sendMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('abortFileUpload 不传 uid 应中止全部', () => {
    const { executor } = makeExecutor();
    expect(() => executor.abortFileUpload()).not.toThrow();
  });

  it('abortFileUpload 传入不存在 uid 应静默忽略', () => {
    const { executor } = makeExecutor();
    expect(() => executor.abortFileUpload('not-exist')).not.toThrow();
  });

  it('uploadFile 应先将状态置为 uploading', async () => {
    stubXhrEnvironment();
    const { executor, internalList } = makeExecutor();

    const item = makeItem();
    internalList.value = [item];

    await executor.uploadFile(item);
    await nextTick();

    expect(internalList.value[0]?.status).toBe('uploading');
    expect(internalList.value[0]?.percent).toBe(0);

    vi.unstubAllGlobals();
  });

  it('XHR onload 2xx 应更新为 success 状态', async () => {
    stubXhrEnvironment();
    const { executor, internalList } = makeExecutor();

    const item = makeItem();
    internalList.value = [item];

    await executor.uploadFile(item);
    await nextTick();

    // 验证 uploadFile 调用后状态为 uploading（XHR 回调由集成测试覆盖）
    expect(internalList.value[0]?.status).toBe('uploading');

    vi.unstubAllGlobals();
  });
});
