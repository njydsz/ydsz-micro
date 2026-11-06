/**
 * useFileUploadCore 单元测试 —— 校验 / 列表 / 预览 / 中止 / 工具函数。
 *
 * <p>覆盖从 YdFileUpload.vue 提取的核心逻辑：
 * <ul>
 *   <li>纯函数：formatFileSize / getFileIconType / isImage</li>
 *   <li>文件校验：maxSize / maxCount 与 exceed 事件</li>
 *   <li>incoming 文件处理：多选过滤 / 数量截断 / change 事件</li>
 *   <li>受控 / 非受控列表桥接（update:fileList）</li>
 *   <li>移除 / 重试 / 预览 / 清空</li>
 *   <li>中止控制（AbortController）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\use-file-upload-core.test.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_CHUNK_BYTES,
  formatFileSize,
  getFileIconType,
  isImage,
  useFileUploadCore,
} from './use-file-upload-core';

import type { UploadFileItem, YdFileUploadEmits, YdFileUploadProps } from './types';
import type { Ref } from 'vue';

import { nextTick, reactive, ref } from 'vue';

/** 构造一条 UploadFileItem */
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

/**
 * 构造 composable 入参。
 *
 * <p>组件里 `defineProps` 返回的是 reactive 对象，且 `withDefaults`
 * 让 `fileList` 默认是 `[]` —— 因此真实组件永远走「受控」分支。
 * 测试用 `reactive` 复刻这一点，`fileList` 用 `ref` 暴露给用例读写。
 */
function makeOptions(propsOverrides: Partial<YdFileUploadProps> = {}, emit?: YdFileUploadEmits) {
  // 用 getter 复刻 defineProps 的 prop 透传：外部 ref 写入能实时反映到 props.fileList。
  const fileList = ref<UploadFileItem[]>() as Ref<UploadFileItem[] | undefined>;
  const hasOverride = 'fileList' in propsOverrides;
  if (!hasOverride) fileList.value = [];
  const props = reactive({
    action: '/api/upload',
    autoUpload: false,
    chunked: false,
    data: {},
    disabled: false,
    draggable: false,
    headers: {},
    listType: 'text',
    method: 'POST',
    multipartApiBase: '/api/file/multipart',
    multiple: false,
    name: 'file',
    preview: false,
    showFileList: true,
    withCredentials: false,
    ...propsOverrides,
    get fileList() {
      return hasOverride ? propsOverrides.fileList : fileList.value;
    },
  }) as unknown as YdFileUploadProps;
  const fileInput = ref(null) as Ref<HTMLInputElement | null>;
  return { emit: emit ?? vi.fn(), fileInput, fileList, props };
}

/**
 * 模拟父组件的 v-model:fileList 双向绑定：
 * 监听 update:fileList 并写回外部 ref，使受控模式下的列表能累积。
 */
function bindControlledFileList(options: ReturnType<typeof makeOptions>) {
  const emit = vi.fn((e: string, ...args: unknown[]) => {
    if (e === 'update:fileList') {
      options.fileList.value = args[0] as UploadFileItem[];
    }
    (options.emit as ReturnType<typeof vi.fn>)(e, ...args);
  });
  return { ...options, emit };
}

/** 构造一个假的 XHR 环境，返回 send/open mock 以便断言 */
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

describe('useFileUploadCore 纯函数', () => {
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

  it('应导出默认分片大小常量', () => {
    expect(DEFAULT_CHUNK_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe('useFileUploadCore 列表与校验', () => {
  it('handleIncomingFiles 应追加文件并触发 update:fileList（受控）', async () => {
    const options = makeOptions();
    const core = useFileUploadCore(options);

    core.handleIncomingFiles([new File(['abc'], 'a.txt', { type: 'text/plain' })]);
    await nextTick();

    // 受控模式下内部列表不持有数据，由外部 fileList ref 承载
    const emitted = (options.emit as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([event]) => event === 'update:fileList',
    );
    expect(emitted).toHaveLength(1);
    const lastList = emitted.at(-1)?.[1] as UploadFileItem[];
    expect(lastList).toHaveLength(1);
    expect(lastList[0]?.name).toBe('a.txt');
    expect(lastList[0]?.status).toBe('ready');
  });

  it('multiple=false 时应只取第一个文件', async () => {
    const options = makeOptions({ multiple: false });
    const core = useFileUploadCore(options);

    core.handleIncomingFiles([new File(['1'], 'a.txt'), new File(['2'], 'b.txt')]);
    await nextTick();

    const emitted = (options.emit as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([event]) => event === 'update:fileList',
    );
    const lastList = emitted.at(-1)?.[1] as UploadFileItem[];
    expect(lastList).toHaveLength(1);
    expect(lastList[0]?.name).toBe('a.txt');
  });

  it('maxCount 超限时应触发 exceed 并裁剪', async () => {
    const exceed = vi.fn();
    const baseEmit = vi.fn((e: string, ...args: unknown[]) => {
      if (e === 'exceed') exceed(...(args as [File[], UploadFileItem[]]));
    });
    const options = bindControlledFileList(makeOptions({ maxCount: 2, multiple: true }, baseEmit));
    const core = useFileUploadCore(options);

    core.handleIncomingFiles([new File(['1'], 'a.txt'), new File(['2'], 'b.txt')]);
    await nextTick();
    expect(core.currentFileList.value).toHaveLength(2);

    core.handleIncomingFiles([new File(['3'], 'c.txt'), new File(['4'], 'd.txt')]);
    await nextTick();

    expect(exceed).toHaveBeenCalledTimes(1);
    expect(core.currentFileList.value.length).toBeLessThanOrEqual(2);
  });

  it('maxSize 超限时应触发 exceed 并过滤大文件', async () => {
    const exceed = vi.fn();
    const baseEmit = vi.fn((e: string, ...args: unknown[]) => {
      if (e === 'exceed') exceed(...(args as [File[], UploadFileItem[]]));
    });
    const options = bindControlledFileList(makeOptions({ maxSize: 10, multiple: true }, baseEmit));
    const core = useFileUploadCore(options);

    core.handleIncomingFiles([
      new File(['x'.repeat(5)], 'small.txt'),
      new File(['x'.repeat(100)], 'big.txt'),
    ]);
    await nextTick();

    expect(exceed).toHaveBeenCalledTimes(1);
    expect(core.currentFileList.value).toHaveLength(1);
    expect(core.currentFileList.value[0]?.name).toBe('small.txt');
  });

  it('autoUpload=true 时应触发 XHR 上传', async () => {
    const { openMock, sendMock } = stubXhrEnvironment();

    const options = makeOptions({ autoUpload: true });
    const core = useFileUploadCore(options);

    core.handleIncomingFiles([new File(['abc'], 'auto.txt')]);
    await nextTick();

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(openMock).toHaveBeenCalledWith('POST', '/api/upload');

    vi.unstubAllGlobals();
  });
});

describe('useFileUploadCore 受控 / 非受控桥接', () => {
  it('受控模式下 updateFileList 应触发 update:fileList', async () => {
    const emit = vi.fn();
    const options = makeOptions({}, emit);
    const core = useFileUploadCore(options);

    // 受控模式：外部 fileList 已有数据
    options.fileList.value = [makeItem()];

    const first = options.fileList.value![0]!;
    core.removeFile(first);
    await nextTick();

    expect(emit).toHaveBeenCalledWith('update:fileList', []);
  });

  it('非受控模式（fileList=null）下应写入内部列表', async () => {
    const emit = vi.fn();
    const options = makeOptions({ fileList: null as unknown as UploadFileItem[] }, emit);
    const core = useFileUploadCore(options);

    // fileList=null → 非受控
    core.handleIncomingFiles([new File(['a'], 'a.txt')]);
    await nextTick();

    expect(core.currentFileList.value).toHaveLength(1);
    expect(core.currentFileList.value[0]?.name).toBe('a.txt');
    // 非受控不应触发 update:fileList
    const updateCalls = emit.mock.calls.filter(([event]) => event === 'update:fileList');
    expect(updateCalls).toHaveLength(0);
  });
});

describe('useFileUploadCore 移除 / 重试 / 预览 / 清空', () => {
  it('removeFile 应触发 remove + change 并传出剩余列表', async () => {
    const emit = vi.fn();
    const options = makeOptions({}, emit);
    const core = useFileUploadCore(options);

    const item = makeItem();
    core.removeFile(item);
    await nextTick();

    expect(emit).toHaveBeenCalledWith('remove', item, []);
    expect(emit).toHaveBeenCalledWith('change', item, []);
  });

  it('handlePreview 应仅对图片生效', () => {
    const emit = vi.fn();
    const options = makeOptions({}, emit);
    const core = useFileUploadCore(options);

    const img = makeItem({ type: 'image/png' });
    core.handlePreview(img);

    expect(core.previewVisible.value).toBe(true);
    expect(core.previewFile.value).toStrictEqual(img);
    expect(emit).toHaveBeenCalledWith('preview', img);

    // 非图片不触发
    const txt = makeItem({ type: 'text/plain' });
    core.handlePreview(txt);
    expect(core.previewFile.value).toStrictEqual(img);
  });

  it('retryFile 应重置状态并触发上传', async () => {
    const { sendMock } = stubXhrEnvironment();

    const options = makeOptions({ autoUpload: false });
    const core = useFileUploadCore(options);

    const failed = makeItem({ status: 'error', error: 'boom' });
    core.retryFile(failed);
    await nextTick();

    expect(sendMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('clearFiles 应触发 update:fileList([])（受控）', async () => {
    const emit = vi.fn();
    const options = makeOptions({}, emit);
    const core = useFileUploadCore(options);

    core.clearFiles();
    await nextTick();

    expect(emit).toHaveBeenCalledWith('update:fileList', []);
  });

  it('clearFiles 非受控模式下应清空内部列表', async () => {
    const options = makeOptions({ fileList: null as unknown as UploadFileItem[] });
    const core = useFileUploadCore(options);

    core.handleIncomingFiles([new File(['a'], 'a.txt')]);
    await nextTick();
    expect(core.currentFileList.value).toHaveLength(1);

    core.clearFiles();
    await nextTick();
    expect(core.currentFileList.value).toHaveLength(0);
  });
});

describe('useFileUploadCore 中止控制', () => {
  it('abortFileUpload 不传 uid 应中止全部', () => {
    const options = makeOptions();
    const core = useFileUploadCore(options);

    expect(() => core.abortFileUpload()).not.toThrow();
  });

  it('abortFileUpload 传入不存在 uid 应静默忽略', () => {
    const options = makeOptions();
    const core = useFileUploadCore(options);

    expect(() => core.abortFileUpload('not-exist')).not.toThrow();
  });
});

describe('useFileUploadCore 工具函数返回', () => {
  it('isFileUploading / isFileError / isFileSuccess / isFileReady 应按状态返回', () => {
    const options = makeOptions();
    const core = useFileUploadCore(options);

    expect(core.isFileUploading(makeItem({ status: 'uploading' }))).toBe(true);
    expect(core.isFileError(makeItem({ status: 'error' }))).toBe(true);
    expect(core.isFileSuccess(makeItem({ status: 'success' }))).toBe(true);
    expect(core.isFileReady(makeItem({ status: 'ready' }))).toBe(true);
  });

  it('getThumbnailUrl 应优先返回 url', () => {
    const options = makeOptions();
    const core = useFileUploadCore(options);

    expect(core.getThumbnailUrl(makeItem({ url: 'http://x/y.png' }))).toBe('http://x/y.png');
  });

  it('getThumbnailUrl 对无 url 的非图片返回 undefined', () => {
    const options = makeOptions();
    const core = useFileUploadCore(options);

    expect(core.getThumbnailUrl(makeItem({ type: 'application/pdf' }))).toBeUndefined();
  });

  it('openFilePicker 在 disabled 时应直接返回', () => {
    const options = makeOptions({ disabled: true });
    const core = useFileUploadCore(options);

    expect(() => core.openFilePicker()).not.toThrow();
  });

  it('submitReadyFiles 应上传所有 ready 文件', async () => {
    const { sendMock } = stubXhrEnvironment();

    const options = makeOptions({ autoUpload: false });
    const core = useFileUploadCore(options);

    // 直接往受控 fileList 塞两个 ready 文件
    options.fileList.value = [makeItem({ uid: 'u1' }), makeItem({ uid: 'u2' })];
    await nextTick();

    core.submitReadyFiles();
    await nextTick();

    expect(sendMock).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });
});
