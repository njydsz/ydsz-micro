/**
 * 主体区域最大化切换的交互封装。
 *
 * 通过隐藏 header 与 sidebar 使内容区域获得全部视口空间，
 * 适用于数据看板、详情查看等需要充分利用屏幕的场景。
 *
 * @path comm\effects\hooks\src\use-content-maximize.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { updatePreferences, usePreferences } from '@ydsz/preferences';

/**
 * 提供当前最大化状态与切换方法。
 *
 * @returns contentIsMaximize — 当前是否最大化；toggleMaximize — 切换最大化状态
 */
export function useContentMaximize() {
  const { contentIsMaximize } = usePreferences();

  function toggleMaximize() {
    const isMaximize = contentIsMaximize.value;

    updatePreferences({
      header: {
        hidden: !isMaximize,
      },
      sidebar: {
        hidden: !isMaximize,
      },
    });
  }
  return {
    contentIsMaximize,
    toggleMaximize,
  };
}
