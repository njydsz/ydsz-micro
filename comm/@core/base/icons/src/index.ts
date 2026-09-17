/**
 * 图标包统一出口：聚合本地图标工厂、lucide 图标清单与 Iconify 运行时能力。
 *
 * 除透出本包的 createIconifyIcon 与 lucide 子集外，还把 @iconify/vue 的
 * addCollection / addIcon / listIcons / Icon 一并再导出，使业务侧仅依赖本包
 * 就能完成「注册自定义图标集 → 渲染」的完整链路。
 * Icon 组件以 IconifyIcon 之名再导出、其类型另起别名 IconifyIconStructure，
 * 用于避开与本包图标组件的命名冲突。
 *
 * @path comm\@core\base\icons\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './create-icon';

export * from './lucide';

export type { IconifyIcon as IconifyIconStructure } from '@iconify/vue';
export {
  addCollection,
  addIcon,
  Icon as IconifyIcon,
  listIcons,
} from '@iconify/vue';

