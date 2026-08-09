/**
 * useSubAppPhase 阶段状态机单元测试
 *
 * 覆盖：阶段切换/进度映射、骨架屏与错误态判定、错误信息记录、
 * i18n 文案联动（$t mock）、mounted 后焦点管理。
 *
 * @path main/src/views/_core/subapp/composables/__tests__/use-subapp-phase.test.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

// $t mock：直接返回 key + 参数占位（不依赖 i18n 实例）
vi.mock('#/locales', () => ({
  $t: (key: string, params?: Record<string, string>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

import { useSubAppPhase } from '../use-subapp-phase';

describe('useSubAppPhase', () => {
  const containerRef = ref<HTMLElement | null>(null);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初始状态为 idle，进度 0，无文案', () => {
    const { state, phaseText } = useSubAppPhase(containerRef);
    expect(state.phase.value).toBe('idle');
    expect(state.progress.value).toBe(0);
    expect(phaseText.value).toBe('');
  });

  it('setPhase("loading") 后进度为 10 且骨架屏展示', () => {
    const { state, setPhase, showSkeleton, showErrorMask } =
      useSubAppPhase(containerRef);

    setPhase('loading', 'userinfo-web');

    expect(state.phase.value).toBe('loading');
    expect(state.progress.value).toBe(10);
    expect(state.activeAppName.value).toBe('userinfo-web');
    expect(showSkeleton()).toBe(true);
    expect(showErrorMask()).toBe(false);
  });

  it('setPhase("mounted") 后进度为 100，骨架屏隐藏', () => {
    const { state, setPhase, showSkeleton } = useSubAppPhase(containerRef);

    setPhase('mounted', 'agent-web');

    expect(state.phase.value).toBe('mounted');
    expect(state.progress.value).toBe(100);
    expect(showSkeleton()).toBe(false);
  });

  it('error 阶段记录错误信息并展示错误态', () => {
    const { state, setError, showErrorMask, showSkeleton } =
      useSubAppPhase(containerRef);

    setError(new Error('load failed'), 'agent-web');

    expect(state.phase.value).toBe('error');
    expect(state.lastError.value).toBe('load failed');
    expect(state.progress.value).toBe(0);
    expect(showErrorMask()).toBe(true);
    expect(showSkeleton()).toBe(false);
  });

  it('非 error 阶段会清空 lastError', () => {
    const { state, setError, setPhase } = useSubAppPhase(containerRef);

    setError(new Error('temp failure'), 'agent-web');
    expect(state.lastError.value).toBe('temp failure');

    setPhase('loading', 'agent-web');
    expect(state.lastError.value).toBeNull();
  });

  it('阶段文案随 phaseTextKey 联动（i18n mock 返回 key）', () => {
    const { setPhase, phaseText } = useSubAppPhase(containerRef);

    setPhase('loading');
    expect(phaseText.value).toBe('page.microKernel.phase.loading');
  });

  it('屏幕阅读器公告随阶段更新', () => {
    const { setPhase, screenReaderAnnouncement } =
      useSubAppPhase(containerRef);

    setPhase('mounted', 'userinfo-web');
    expect(screenReaderAnnouncement.value).toContain(
      'page.microKernel.announcements.mounted',
    );
  });

  it('mounted 阶段若容器内有可聚焦元素则移动焦点', async () => {
    // 构造带 h1 的容器 DOM（需挂载到 document 才能聚焦）
    const container = document.createElement('div');
    const heading = document.createElement('h1');
    heading.setAttribute('tabindex', '0');
    container.appendChild(heading);
    document.body.appendChild(container);
    containerRef.value = container;

    const { setPhase } = useSubAppPhase(containerRef);
    setPhase('mounted', 'agent-web');
    await nextTick();

    expect(document.activeElement).toBe(heading);

    document.body.removeChild(container);
    containerRef.value = null;
  });
});
