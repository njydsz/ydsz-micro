/**
 * vxe-table 适配器（应用级 re-export）
 *
 * 统一实现已提取至 @remi/shared-business，此处保留应用级入口以兼容既有导入路径。
 * 如需应用级扩展自定义 renderer，可在此文件内补充。
 *
 * @path apps/nextwiki-web/src/adapter/vxe-table.ts
 * @author remi-team
 * @since 1.1.0
 */
export { useREMIVxeGrid } from '@remi/shared-business';

export type * from '@remi/plugins/vxe-table';
