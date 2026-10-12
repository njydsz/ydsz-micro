/**
 * useDrawer composable —— 命令式抽屉 API。
 *
 * <p>用于在任意 JS / TS 上下文中以 Promise 方式打开抽屉面板，
 * 支持阻塞等待用户关闭。
 *
 * <p>内部通过动态 import 懒加载 use-drawer-internal 模块以支持 tree-shaking。
 *
 * @example
 * ```ts
 * import { useDrawer } from '@ydsz-core/ydsz-ui';
 * import { markRaw } from 'vue';
 *
 * const { drawer } = useDrawer();
 *
 * // 简单文本
 * await drawer.open({
 *   header: '确认删除',
 *   content: '此操作不可撤销',
 *   position: 'right',
 *   width: 400,
 * });
 *
 * // 复杂组件
 * const { close, promise } = await drawer.open({
 *   header: '编辑详情',
 *   position: 'right',
 *   width: 560,
 *   component: markRaw(EditForm),
 *   props: { id: 123 },
 * });
 *
 * const { reason } = await promise;
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\use-drawer.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { DrawerApi, DrawerInstance, DrawerOptions } from './types';

/**
 * useDrawer 返回的句柄。
 */
export interface UseDrawerReturn {
  /** 命令式 api：open 与 closeAll */
  drawer: DrawerApi;
}

/**
 * useDrawer composable —— 命令式抽屉 API 入口。
 *
 * @returns { drawer } 包含 open / closeAll 方法的 DrawerApi
 *
 * @example
 * ```ts
 * const { drawer } = useDrawer();
 * await drawer.open({ header: 'Hello', content: 'World' });
 * ```
 */
export function useDrawer(): UseDrawerReturn {
  /**
   * 命令式 drawer API。
   *
   * <p>open 方法通过 dynamice import 延迟加载实现模块，
   * 使得不使用命令式 API 的业务 bundle 不包含绘制抽屉的大段 DOM 操作代码。
   */
  async function open(options: DrawerOptions): Promise<DrawerInstance> {
    const mod = await import('./use-drawer-internal');
    return mod.openDrawer(options);
  }

  function closeAll(): void {
    // 动态加载避免非必要代码打入主 bundle
    void import('./use-drawer-internal').then((mod) => {
      mod.closeAllDrawers();
    });
  }

  return {
    drawer: {
      closeAll,
      open,
    },
  };
}
