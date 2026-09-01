/**
 * 表单字段上下文的注入键定义。
 *
 * 用 Symbol 而不是字符串作为 key，避免与其它库（vee-validate 的 FieldContextKey）
 * 或业务代码的注入键撞名；注入值为 string，即 FormItem 生成的唯一 id 前缀。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\form\injectionKeys.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { InjectionKey } from 'vue';

/**
 * 表单项上下文的注入键。
 *
 * @remarks
 * 用于 FormItem 通过 provide/inject 向内部输入组件传递字段上下文
 * （如字段名、校验状态），键值为 Symbol 保证跨组件树唯一。
 */

export const FORM_ITEM_INJECTION_KEY = Symbol() as InjectionKey<string>;
