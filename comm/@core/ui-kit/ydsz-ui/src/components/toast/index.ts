/**
 * Toast 组件 barrel export。
 *
 * 提供：
 *  - YdToast：单条通知卡片
 *  - YdToastContainer：全局容器（按 position 分组渲染，自带默认条目渲染）
 *  - useToast：程序化调用 composable（返回值里带 messages 响应式引用）
 *  - configureToast：覆写全局默认时长 / 位置 / 最大可见条数
 *  - TypeScript 类型：ToastMessage / ToastOptions / ToastHandle / ToastConfig / UseToastReturn
 *
 * 典型用法：
 * ```vue
 * <script setup lang="ts">
 * import { useToast, YdToastContainer } from '@ydsz-core/ydsz-ui';
 *
 * const toast = useToast();
 * </script>
 *
 * <template>
 *   <button @click="toast.success('操作成功')">提交</button>
 *   <!-- 容器从全局单例取数，也可显式传 :messages="toast.messages.value" -->
 *   <YdToastContainer />
 * </template>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\index.ts
 * @author ydsz-team
 * @since 26.10.11
 */

export { default as YdToast } from './YdToast.vue';
export { default as YdToastContainer } from './YdToastContainer.vue';
export { configureToast, messages, useToast } from './use-toast';
export type {
  ToastConfig,
  ToastHandle,
  ToastMessage,
  ToastOptions,
  ToastPosition,
  ToastSeverity,
  UseToastReturn,
} from './types';
