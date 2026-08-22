/**
 * BusinessError 单元测试
 *
 * 覆盖（§14.2 / §17.1 核心业务 ≥90%）：业务错误类的构造、字段透传与默认值。
 * 不依赖任何外部模块，纯逻辑测试。
 *
 * @path comm/effects/request/src/request-client/__tests__/business-error.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { BusinessError } from '../business-error';

describe('BusinessError', () => {
  it('应正确继承 Error 并设置 name', () => {
    const err = new BusinessError('业务请求失败');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('BusinessError');
    expect(err.message).toBe('业务请求失败');
  });

  it('未传 options 时应使用默认值', () => {
    const err = new BusinessError('错误');
    expect(err.code).toBe(-1);
    expect(err.data).toBeNull();
    expect(err.statusCode).toBe(-1);
  });

  it('应正确透传 code / data / statusCode', () => {
    const payload = { id: 1, detail: 'xxx' };
    const err = new BusinessError('校验失败', {
      code: 10001,
      data: payload,
      statusCode: 400,
    });
    expect(err.code).toBe(10001);
    expect(err.data).toEqual(payload);
    expect(err.statusCode).toBe(400);
  });

  it('data 为 undefined 时应回退为 null（避免 undefined 透传）', () => {
    const err = new BusinessError('无数据', { code: 1, data: undefined });
    expect(err.data).toBeNull();
  });

  it('可被 catch 正常捕获并保留 message', () => {
    const thrown = () => {
      throw new BusinessError('抛出测试', { code: 2 });
    };
    expect(thrown).toThrow('抛出测试');
    try {
      thrown();
    } catch (e) {
      expect((e as BusinessError).code).toBe(2);
    }
  });
});
