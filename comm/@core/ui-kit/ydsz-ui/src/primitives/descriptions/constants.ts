/**
 * YdDescriptions 常量定义——注入键、默认值与类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\descriptions\constants.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { InjectionKey, Ref } from 'vue';

/** 描述列表支持的尺寸变体 */
export type DescriptionsSize = 'default' | 'small' | 'large';

/** 每行列数注入键 */
export const DESCRIPTIONS_COLUMN: InjectionKey<Ref<number>> =
  Symbol('ydsz-descriptions-column');

/** 尺寸变体注入键 */
export const DESCRIPTIONS_SIZE: InjectionKey<Ref<DescriptionsSize>> =
  Symbol('ydsz-descriptions-size');

/** 边框模式注入键 */
export const DESCRIPTIONS_BORDER: InjectionKey<Ref<boolean>> =
  Symbol('ydsz-descriptions-border');
