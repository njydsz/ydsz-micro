/**
 * 表格列注册的注入键。
 *
 * <p>YdTableColumn 通过此键向父级 YdTable 注册自身定义，
 * YdTable 收集所有列后自动渲染 thead/tbody。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\injectionKeys.ts
 * @author ydsz-team
 * @since 4.2.0
 */
import type { InjectionKey } from 'vue';

/** 列注册表：addColumn / removeColumn 由 YdTable provide，YdTableColumn inject */
export interface ColumnRegistry {
  addColumn: (id: string, column: unknown) => void;
  removeColumn: (id: string) => void;
}

export const YD_TABLE_COLUMN_REGISTRY: InjectionKey<ColumnRegistry> = Symbol('YD_TABLE_COLUMN_REGISTRY');
