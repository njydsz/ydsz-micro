/**
 * Menu API 重导出
 * <p>从 {@code @remi/shared-auth} 统一 re-export 菜单 API。
 * <p>提供 {@code getAllMenusApi}（获取全部菜单）、{@code getMenuTreeApi}（菜单树）。
 * <p>供业务代码统一 {@code import { getAllMenusApi } from '#/api/core/menu'} 引用。
 *
 * @author remi-team
 * @since 1.0.0
 */
export {
  getAllMenusApi,
  getMenuTreeApi,
} from '@remi/shared-auth';
