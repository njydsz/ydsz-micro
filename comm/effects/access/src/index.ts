/**
 * 权限控制模块的统一导出入口。
 *
 * 提供按钮级指令（v-access / v-permission）、组合式函数（useAccess）
 * 与异步路由/菜单生成器（generateAccessible），覆盖前后端两种权限管控模式。
 *
 * @path comm\effects\access\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as AccessControl } from './access-control.vue';
export * from './accessible';
export * from './directive';
export * from './use-access';
