<!--
 * 审计日志详情抽屉 —— 展示基本信息、变更 diff 对比与关联日志时间轴
 *
 * @path main\src\views\audit\audit-detail-drawer.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { AuditLogDetail } from '#/api/audit';

import { computed } from 'vue';

import { formatDateTime } from '@ydsz-core/shared/utils';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

/** 模块级日志器 */
const logger = createLogger('AuditDetailDrawer');

interface Props {
  /** 抽屉可见性 */
  visible: boolean;
  /** 加载中 */
  loading: boolean;
  /** 日志详情数据 */
  detail: AuditLogDetail | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  visible: false,
});

const emit = defineEmits<{
  close: [];
}>();

/** 关闭抽屉 */
function handleClose(): void {
  emit('close');
}

/** 操作类型标签文字 */
const actionTypeLabels: Record<string, string> = {
  CREATE: t('page.audit.actionType.CREATE'),
  UPDATE: t('page.audit.actionType.UPDATE'),
  DELETE: t('page.audit.actionType.DELETE'),
  LOGIN: t('page.audit.actionType.LOGIN'),
  EXPORT: t('page.audit.actionType.EXPORT'),
};

/** User-Agent 解析结果（简化版） */
const parsedUA = computed(() => {
  const ua = props.detail?.userAgent ?? '';
  if (!ua) return { browser: t('page.audit.detail.unknown'), os: t('page.audit.detail.unknown'), raw: ua };

  let browser = t('page.audit.detail.unknown');
  let os = t('page.audit.detail.unknown');

  // 简单 UA 解析
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad'))
    os = 'iOS';

  return { browser, os, raw: ua };
});

/** 格式化 diff 值用于展示 */
function formatDiffValue(value: string | null): string {
  if (value === null || value === '') return t('page.audit.detail.emptyValue');
  return value;
}

/** 计算 diff 变更统计 */
const diffStats = computed(() => {
  const diffs = props.detail?.diffs ?? [];
  return {
    changed: diffs.length,
  };
});
</script>

<template>
  <!-- 遮罩 + 抽屉 -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[1000] flex justify-end"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-black/30"
          @click="handleClose"
        ></div>

        <!-- 抽屉主体 -->
        <div
          class="relative flex h-full w-full max-w-[640px] flex-col bg-white shadow-xl transition-transform"
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 class="text-lg font-semibold text-gray-800">{{ t('page.audit.detail.title') }}</h2>
            <button
              class="text-gray-400 hover:text-gray-600"
              @click="handleClose"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <!-- 加载中 -->
            <div v-if="loading" class="flex h-full items-center justify-center">
              <div class="text-center text-gray-400">
                <div class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                <p class="text-sm">{{ t('page.audit.detail.loading') }}</p>
              </div>
            </div>

            <!-- 详情内容 -->
            <template v-else-if="detail">
              <!-- 基本信息 -->
              <section class="mb-6">
                <h3 class="mb-3 text-sm font-semibold text-gray-700">{{ t('page.audit.detail.basicInfo') }}</h3>
                <div class="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4 text-sm">
                  <div>
                    <span class="text-gray-500">{{ t('page.audit.detail.operator') }}：</span>
                    <span class="font-medium">{{ detail.operatorName }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">{{ t('page.audit.detail.actionTime') }}：</span>
                    <span>{{ formatDateTime(detail.actionTime) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">{{ t('page.audit.detail.module') }}：</span>
                    <span>{{ detail.module }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">{{ t('page.audit.detail.actionType') }}：</span>
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="{
                        'bg-green-100 text-green-700': detail.actionType === 'CREATE',
                        'bg-blue-100 text-blue-700': detail.actionType === 'UPDATE',
                        'bg-red-100 text-red-700': detail.actionType === 'DELETE',
                        'bg-orange-100 text-orange-700': detail.actionType === 'LOGIN',
                        'bg-purple-100 text-purple-700': detail.actionType === 'EXPORT',
                      }"
                    >
                      {{ actionTypeLabels[detail.actionType] ?? detail.actionType }}
                    </span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-gray-500">{{ t('page.audit.detail.description') }}：</span>
                    <span>{{ detail.description }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">{{ t('page.audit.detail.result') }}：</span>
                    <span
                      :class="{
                        'text-green-600': detail.result === 'SUCCESS',
                        'text-red-600': detail.result === 'FAILED',
                      }"
                    >
                      {{ detail.result === 'SUCCESS' ? t('page.audit.result.SUCCESS') : detail.result === 'FAILED' ? t('page.audit.result.FAILED') : '-' }}
                    </span>
                  </div>
                </div>
              </section>

              <!-- 客户端信息 -->
              <section class="mb-6">
                <h3 class="mb-3 text-sm font-semibold text-gray-700">{{ t('page.audit.detail.clientInfo') }}</h3>
                <div class="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4 text-sm">
                  <div>
                    <span class="text-gray-500">{{ t('page.audit.detail.clientIp') }}：</span>
                    <span>{{ detail.clientIp }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">{{ t('page.audit.detail.browser') }}：</span>
                    <span>{{ parsedUA.browser }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">{{ t('page.audit.detail.os') }}：</span>
                    <span>{{ parsedUA.os }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Session ID：</span>
                    <span class="font-mono text-xs">{{ detail.sessionId ?? '-' }}</span>
                  </div>
                </div>
                <!-- User-Agent 原始 -->
                <div v-if="parsedUA.raw" class="mt-2 break-all text-xs text-gray-400">
                  {{ parsedUA.raw }}
                </div>
              </section>

              <!-- 变更对比 -->
              <section class="mb-6">
                <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  {{ t('page.audit.detail.diffTitle') }}
                  <span class="text-xs font-normal text-gray-400">
                    {{ t('page.audit.detail.changedFields', { count: diffStats.changed }) }}
                  </span>
                </h3>

                <div v-if="detail.diffs.length > 0" class="space-y-2">
                  <div
                    v-for="diff in detail.diffs"
                    :key="diff.field"
                    class="overflow-hidden rounded-lg border border-gray-200"
                  >
                    <div class="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
                      {{ t('page.audit.detail.field') }}: {{ diff.field }}
                    </div>
                    <div class="grid grid-cols-2 divide-x divide-gray-200 text-sm">
                      <!-- 原值 -->
                      <div class="p-3">
                        <div class="mb-1 text-xs font-medium text-red-500">{{ t('page.audit.detail.oldValue') }}</div>
                        <pre class="whitespace-pre-wrap break-all rounded bg-red-50 p-2 text-xs">{{ formatDiffValue(diff.oldValue) }}</pre>
                      </div>
                      <!-- 新值 -->
                      <div class="p-3">
                        <div class="mb-1 text-xs font-medium text-green-500">{{ t('page.audit.detail.newValue') }}</div>
                        <pre class="whitespace-pre-wrap break-all rounded bg-green-50 p-2 text-xs">{{ formatDiffValue(diff.newValue) }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-400">
                  {{ t('page.audit.detail.noDiff') }}
                </div>
              </section>

              <!-- 错误信息（失败时） -->
              <section v-if="detail.errorMessage" class="mb-6">
                <h3 class="mb-3 text-sm font-semibold text-red-600">{{ t('page.audit.detail.errorMessage') }}</h3>
                <div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {{ detail.errorMessage }}
                </div>
              </section>
            </template>

            <!-- 空状态 -->
            <div v-else class="flex h-full items-center justify-center text-gray-400">
              {{ t('page.audit.detail.notFound') }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
