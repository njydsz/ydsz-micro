import { defineVxeColumns } from '@ydsz/plugins/vxe-table';

import type { ComponentType } from './component/component-type';

/**
 * Vxe Table 适配器：全局列类型与组件绑定。
 *
 * @path apps/generator-web/src/adapter/vxe-table.ts
 * @since 1.0.0
 */
export const { useYDSZVxeGrid } = defineVxeColumns<ComponentType>();
