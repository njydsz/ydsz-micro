/**
 * 异常与空态兜底页的入参类型。
 *
 * 设计意图：用 `status` 枚举把 403 / 404 / 500 / 离线 / 空数据 / 敬请期待
 * 六种场景收敛为同一个组件，路由守卫、请求拦截器、错误边界只需按错误类型
 * 传不同的 `status`，无需各自实现一套兜底 UI。
 *
 * 所有字段均可选，`status` 缺省时组件按 404 渲染；显式传 `title` / `description`
 * 可覆盖内置文案，用于给出更具体的处置建议（如「该任务已被删除」）。
 *
 * @path comm\effects\common-ui\src\ui\fallback\fallback.ts
 * @author ydsz-team
 * @since 1.0.0
 */
interface FallbackProps {
  /**
   * 描述
   */
  description?: string;
  /**
   *  @zh_CN 首页路由地址
   *  @default /
   */
  homePath?: string;
  /**
   * @zh_CN 默认显示的图片
   * @default pageNotFoundSvg
   */
  image?: string;
  /**
   *  @zh_CN 内置类型
   */
  status?: '403' | '404' | '500' | 'coming-soon' | 'offline' | 'empty';
  /**
   *  @zh_CN 页面提示语
   */
  title?: string;
}
export type { FallbackProps };
