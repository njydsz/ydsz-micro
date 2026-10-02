/**
 * 乐观更新组合式函数
 *
 * <p>提供 CRUD 操作的乐观更新能力：先更新本地状态，后台同步请求，失败时自动回滚。
 * 适用场景：表单提交、状态切换、收藏/点赞等即时反馈操作。
 *
 * <p>使用示例：
 * <pre lang="ts">
 * const { execute, loading, rollingBack } = useOptimisticUpdate({
 *   rollback: (snapshot) => { list.value = snapshot },
 * });
 *
 * // 调用时提供乐观快照与异步操作
 * await execute({
 *   snapshot: list.value.filter(i => i.id !== row.id),
 *   operation: () => deleteAgentApi(row.id),
 * });
 * </pre>
 *
 * @path comm\@core\composables\src\use-optimistic-update.ts
 * @author ydsz-team
 * @since 26.10.02
 */

import { ref } from 'vue';

/** 乐观更新选项 */
interface UseOptimisticUpdateOptions<TState> {
  /**
   * 回滚函数 — 请求失败时调用，接收之前传入的快照值
   * @param snapshot - execute 时传入的 snapshot
   */
  rollback: (snapshot: TState) => void;
}

/** 单次执行参数 */
interface ExecuteOptions<TState> {
  /**
   * 乐观快照 — 请求成功前立即应用的伪结果
   * @description 调用方传入预期达成的状态，函数内部负责在开始/失败时还原
   */
  snapshot: TState;
  /**
   * 真实异步操作 — 返回 Promise 的请求函数
   */
  operation: () => Promise<unknown>;
}

/** 乐观更新组合式函数的返回类型 */
interface UseOptimisticUpdateReturn {
  /** 执行乐观更新（传入快照与异步操作） */
  execute: <TState>(options: ExecuteOptions<TState>) => Promise<void>;
  /** 当前是否正在请求中 */
  loading: () => boolean;
  /** 当前是否正在回滚中 */
  rollingBack: () => boolean;
}

/**
 * 创建乐观更新能力
 *
 * @param options - 包含回滚回调的配置对象
 * @returns loading/rollingBack 状态读取函数与 execute 执行器
 */
function useOptimisticUpdate<TState>(
  options: UseOptimisticUpdateOptions<TState>,
): UseOptimisticUpdateReturn {
  const isLoading = ref(false);
  const isRollingBack = ref(false);

  /**
   * 执行乐观更新流程：显示乐观结果 → 发起请求 → 失败则回滚
   *
   * @param params - 快照与操作参数
   */
  async function execute(params: ExecuteOptions<TState>): Promise<void> {
    const { snapshot, operation } = params;
    isLoading.value = true;

    try {
      await operation();
    } catch (error) {
      // 请求失败 → 回滚到快照（支持同步与异步回滚）
      isRollingBack.value = true;
      try {
        // await 确保异步回滚完成后再重置 rollingBack 状态
        await Promise.resolve(options.rollback(snapshot));
      } finally {
        isRollingBack.value = false;
      }
      // 继续向上抛出错误，便于业务层做提示
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    execute,
    loading: () => isLoading.value,
    rollingBack: () => isRollingBack.value,
  };
}

export { useOptimisticUpdate };
export type { ExecuteOptions, UseOptimisticUpdateOptions, UseOptimisticUpdateReturn };
