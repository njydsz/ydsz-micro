/**
 * 头像组件的出口：以 YDSZAvatar 之名导出，与其它组件保持统一前缀。
 *
 * 统一加 YDSZ 前缀是为了避免与业务侧、第三方库里的同名 Avatar 在模板中冲突，
 * 批量引入时能一眼区分来源。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\avatar\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZAvatar } from './avatar.vue';

