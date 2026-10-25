/**
 * Vitest 全局 setup —— 注册 jest-dom 与 vitest-axe 断言匹配器。
 *
 * <p>jest-dom 覆盖 DOM 状态断言（toBeVisible / toHaveStyle 等），
 * 上游 radix-vue 的 headless 用例直接依赖它们；`/vitest` 入口自带类型增强。
 *
 * <p>vitest-axe@0.1.0 的 `extend-expect` 入口运行时文件为空（上游构建产物缺陷），
 * 只有类型声明有效，因此显式取 `matchers` 交给 `expect.extend`，
 * 并补一份 Vitest 3 的 `Assertion` 类型增强（自带的 `declare global { namespace Vi }`
 * 只覆盖 Vitest 1.x 的类型结构）。
 *
 * @path vitest.setup.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import '@testing-library/jest-dom/vitest';

import axeCore from 'axe-core';
import * as matchers from 'vitest-axe/matchers';

import { expect } from 'vitest';

expect.extend(matchers);

/**
 * `region`（best-practice）要求整页内容都落在 landmark 内，只对完整页面成立。
 * 组件级用例把单个浮层 / 控件挂到 body 上，必然触发该规则，属噪音而非缺陷，
 * 故在共享 setup 中一次性关闭；WCAG A / AA 规则不受影响。
 */
axeCore.configure({
  rules: [{ enabled: false, id: 'region' }],
});

/**
 * 单元测试禁止触网。
 *
 * <p>story 里的 `<Icon>` 会向 iconify API 拉取图标集，请求在环境 teardown 时被
 * happy-dom 的 AsyncTaskManager 中断，抛出未处理的 AbortError —— Vitest 会因此
 * 把整轮结果判为非零退出码。这里只对 iconify 的图标集接口返回空数据，
 * 其余 URL 一律透传原生 fetch，保持既有测试（含自行 stub fetch 的用例）行为不变。
 */
const nativeFetch = globalThis.fetch;
const ICONIFY_ICONS_URL = /(?:^|\/\/)(?:[^/]*\.)?iconify\.design|\/json\/icons\//;

globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
  if (ICONIFY_ICONS_URL.test(url)) {
    return Promise.resolve(
      new Response(JSON.stringify({ height: 24, icons: {}, width: 24 }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );
  }
  return nativeFetch(input, init);
}) as typeof fetch;

declare module 'vitest' {
  interface Assertion<T = any> {
    /** 断言 axe-core 结果不含任何 violation */
    toHaveNoViolations: () => void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations: () => void;
  }
}
