/**
 * Schema 解析辅助函数：提取 zod 校验规则、推导默认值、识别事件对象。
 *
 * getDefaultValueInZodStack 需要逐层剥开 ZodOptional / ZodDefault / ZodEffects 等
 * 包装类型才能取到最内层默认值 —— 这属于 zod 内部结构细节，集中在此隔离，
 * 避免解析逻辑散落到渲染器各处、随上游版本变动而难以收敛。
 * isEventObjectLike 用于把 v-model 收到的事件对象与真实值区分开。
 *
 * @path comm\@core\ui-kit\form-ui\src\form-render\helper.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  AnyZodObject,
  ZodDefault,
  ZodEffects,
  ZodNumber,
  ZodString,
  ZodTypeAny,
} from 'zod';

import { isObject, isString } from '@YDSZ-core/shared/utils';

/**
 * Get the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 */
export function getBaseRules<
  ChildType extends AnyZodObject | ZodTypeAny = ZodTypeAny,
>(schema: ChildType | ZodEffects<ChildType>): ChildType | null {
  if (!schema || isString(schema)) return null;
  if ('innerType' in schema._def)
    return getBaseRules(schema._def.innerType as ChildType);

  if ('schema' in schema._def)
    return getBaseRules(schema._def.schema as ChildType);

  return schema as ChildType;
}

/**
 * Search for a "ZodDefault" in the Zod stack and return its value.
 */
export function getDefaultValueInZodStack(schema: ZodTypeAny): unknown {
  if (!schema || isString(schema)) {
    return;
  }
  const typedSchema = schema as unknown as ZodDefault<ZodNumber | ZodString>;

  if (typedSchema._def.typeName === 'ZodDefault')
    return typedSchema._def.defaultValue();

  if ('innerType' in typedSchema._def) {
    return getDefaultValueInZodStack(
      typedSchema._def.innerType as unknown as ZodTypeAny,
    );
  }
  if ('schema' in typedSchema._def) {
    return getDefaultValueInZodStack(
      // Zod 内部 _def 结构未在公开类型中暴露 schema 属性，收窄为对象后取字段
      (typedSchema._def as unknown as { schema: ZodTypeAny }).schema as ZodTypeAny,
    );
  }

  return undefined;
}

/**
 * 判断一个值是否「长得像」DOM 事件对象。
 *
 * @remarks
 * 用于表单取值时区分两种回调形态：部分控件的更新回调回传的是纯值，
 * 另一些（尤其原生 input）回传的是 Event，需要改取 `event.target.value`。
 * 若不加区分，整个事件对象会被当作字段值写入表单数据。
 *
 * 采用**鸭子类型**判断而非 `instanceof Event`，是为了兼容两类情况：
 * 跨 iframe / 测试环境中 `Event` 构造器不同源导致 `instanceof` 失效，
 * 以及各 UI 库自造的仿事件对象。
 *
 * 代价是存在误判可能：任何同时具备 `target` 和 `stopPropagation` 两个属性的普通对象
 * 都会被判定为事件。业务数据一般不会有 `stopPropagation`，实际风险可接受。
 *
 * @param obj - 任意待检测值；`null`、原始类型一律返回 `false`
 * @returns 同时具备 `target` 与 `stopPropagation` 属性时返回 `true`
 */
export function isEventObjectLike(obj: unknown) {
  if (!obj || !isObject(obj)) {
    return false;
  }
  return Reflect.has(obj, 'target') && Reflect.has(obj, 'stopPropagation');
}

