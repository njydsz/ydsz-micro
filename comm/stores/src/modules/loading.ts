/**
 * loading Pinia 状态管理 —— 请求计数器（全局 LoadingProvider）
 *
 * 跟踪当前进行中的 HTTP 请求数，驱动全局 loading overlay 的显隐。
 * 拦截器通过 start/stop 操纵计数器，app.vue 读取 isLoading 渲染遮罩。
 *
 * 采用 Composition API（setup）语法，符合云顶编码规范 §8.1。
 *
 * @path comm\stores\src\modules\loading.ts
 * @author ydsz-team
 * @since 5.2.0
 */
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * @zh_CN 加载状态管理（请求计数器）
 *
 * 拦截器通过 startLoading/stopLoading 维护 pendingRequests 集合，
 * activeRequestCount 即集合大小，isLoading 派生于此。
 */
export const useLoadingStore = defineStore(
  'core-loading',
  () => {
    /** 当前进行中的请求数（pendingRequests 集合大小） */
    const activeRequestCount = ref(0);

    /**
     * 去重集合：以 `method:url` 作为 key，避免同一请求重复计数。
     * 使用 Set<string> 保证每个请求 key 仅被计数一次，
     * 即使拦截器因重试多次进入也能正确抵消。
     */
    const pendingRequests = ref<Set<string>>(new Set());

    /** 是否处于 loading 状态：有任一请求在进行中即 true */
    const isLoading = computed(() => activeRequestCount.value > 0);

    /**
     * 标记请求开始。若该请求已在途中（重复调用），忽略。
     *
     * @param requestKey - 请求唯一标识（`method:url`）
     */
    function startLoading(requestKey: string): void {
      if (pendingRequests.value.has(requestKey)) return;
      pendingRequests.value.add(requestKey);
      activeRequestCount.value = pendingRequests.value.size;
    }

    /**
     * 标记请求结束。若该请求不在途中（异常路径重复调用），忽略。
     *
     * @param requestKey - 请求唯一标识（`method:url`）
     */
    function stopLoading(requestKey: string): void {
      if (!pendingRequests.value.has(requestKey)) return;
      pendingRequests.value.delete(requestKey);
      activeRequestCount.value = pendingRequests.value.size;
    }

    return {
      activeRequestCount,
      isLoading,
      pendingRequests,
      startLoading,
      stopLoading,
    };
  },
);

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useLoadingStore, hot));
}
