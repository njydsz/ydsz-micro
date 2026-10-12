/**
 * Toast 组件 barrel export。
 *
 * 提供：
 *  - YdToast：单条通知卡片
 *  - YdToastContainer：全局容器（按 position 分组渲染）
 *  - useToast：程序化调用 composable（含 messages 响应式引用）
 *  - TypeScript 类型：ToastMessage / ToastOptions / ToastHandle / UseToastReturn
 *
 * 典型用法：
 * ```vue
 * <script setup lang="ts">
 * import { useToast, YdToastContainer, YdToast } from '@ydsz-core/ydsz-ui/toast';
 *
 * const toast = useToast();
 *
 * function handleAction() {
 *   toast.success('操作成功');
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleAction">提交</button>
 *   <YdToastContainer :messages="messages">
 *     <template #default="{ message }">
 *       <YdToast v-bind="message" @close="toast.remove(message.id)" />
 *     </template>
 *   </YdToastContainer>
 * </template>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\index.ts
 * @author ydsz-team
 * @since 26.10.11
 */

export { default as YdToast } from './YdToast.vue';
export { default as YdToastContainer } from './YdToastContainer.vue';
export { useToast, messages } from './use-toast';
export type {
  ToastHandle,
  ToastMessage,
  ToastOptions,
  ToastPosition,
  ToastSeverity,
  UseToastReturn,
} from './types';
