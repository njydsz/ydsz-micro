/**
 * preset-interceptors 单元测试
 *
 * 覆盖（§14.2 / §17.1 核心业务 ≥90%）：
 * - defaultResponseInterceptor.fulfilled：业务成功判定、dataField 剥离、responseReturn 模式
 * - BusinessError 在业务失败时的字段透传
 *
 * 通过 vi.mock 隔离 @ydsz/locales 的 createI18n 副作用（fulfilled 分支不依赖 $t，但模块顶层导入需 mock）。
 *
 * @path comm/effects/request/src/request-client/__tests__/preset-interceptors.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it, vi } from 'vitest';

// 隔离 locales 的 createI18n 副作用：$t 在 fulfilled 分支未使用，返回 key 即可
vi.mock('@ydsz/locales', () => ({
  $t: (key: string) => key,
}));

// 隔离 @ydsz/utils 的 lodash 传递依赖链，仅提供 fulfilled 分支所需的 isFunction
vi.mock('@ydsz/utils', () => ({
  isFunction: (value: unknown) => typeof value === 'function',
}));

import { defaultResponseInterceptor } from '../preset-interceptors';
import { BusinessError } from '../business-error';

/** 构造一个 axios 风格的响应对象 */
function makeResponse(data: Record<string, unknown>, status = 200, config: Record<string, unknown> = {}) {
  return {
    config: { responseReturn: undefined, ...config },
    data,
    headers: {},
    status,
    statusText: 'OK',
  };
}

describe('defaultResponseInterceptor.fulfilled', () => {
  it('responseReturn=raw 应原样返回完整响应', () => {
    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    });
    const response = makeResponse({ code: 0, data: { id: 1 } }, 200, {
      responseReturn: 'raw',
    });
    expect(interceptor.fulfilled?.(response)).toBe(response);
  });

  it('responseReturn=body 应返回 responseData 整体', () => {
    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    });
    const data = { code: 0, data: { id: 1 }, extra: 'x' };
    const response = makeResponse(data, 200, { responseReturn: 'body' });
    expect(interceptor.fulfilled?.(response)).toEqual(data);
  });

  it('业务成功（code===successCode）应剥离 dataField 返回数据', () => {
    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    });
    const response = makeResponse({ code: 0, data: { id: 1, name: '张三' } });
    expect(interceptor.fulfilled?.(response)).toEqual({ id: 1, name: '张三' });
  });

  it('自定义 successCode 字符串匹配也能判定成功', () => {
    const interceptor = defaultResponseInterceptor({
      codeField: 'status',
      dataField: 'result',
      successCode: 'OK',
    });
    const response = makeResponse({ status: 'OK', result: [1, 2, 3] });
    expect(interceptor.fulfilled?.(response)).toEqual([1, 2, 3]);
  });

  it('successCode 为函数时应按函数返回值判定', () => {
    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: (code: unknown) => Number(code) >= 0,
    });
    const response = makeResponse({ code: 200, data: 'ok' });
    expect(interceptor.fulfilled?.(response)).toBe('ok');
  });

  it('业务逻辑失败（code!==successCode）应抛 BusinessError 并透传上下文', () => {
    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    });
    const response = makeResponse(
      { code: 10001, message: '参数错误', data: null },
      200,
    );
    expect(() => interceptor.fulfilled?.(response)).toThrow(BusinessError);
    try {
      interceptor.fulfilled?.(response);
    } catch (e) {
      const err = e as BusinessError;
      expect(err.message).toBe('参数错误');
      expect(err.code).toBe(10001);
      expect(err.statusCode).toBe(200);
      expect(err.data).toEqual({ code: 10001, message: '参数错误', data: null });
    }
  });

  it('dataField 为函数时应调用其解析数据', () => {
    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: (response: Record<string, unknown>) => response.data,
      successCode: 0,
    });
    const response = makeResponse({ code: 0, data: { nested: true } });
    expect(interceptor.fulfilled?.(response)).toEqual({ nested: true });
  });

  it('HTTP 状态码超出 2xx/3xx 范围应抛 BusinessError', () => {
    const interceptor = defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    });
    const response = makeResponse({ code: 0, data: {} }, 500);
    expect(() => interceptor.fulfilled?.(response)).toThrow(BusinessError);
  });
});
