<!--
 * TenantSwitcher — 顶栏租户切换器
 *
 * <p>基于自研 shadcn-ui YdSelectBase 原语实现多租户切换功能（EP 退场 v3 §P0-2，
 * 原 Element Plus ElSelect/ElTooltip/ElMessage 全部替换）。
 * 仅当存在多个可访问租户（或当前用户为超级管理员）时显示切换入口。
 * 切换后更新 TenantStore、localStorage 并刷新页面以加载新租户数据。
 *
 * @path main\src\components\tenant-switcher.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { TenantInfo } from '@ydsz/shared-business';

import { useTenant } from '@ydsz/shared-business';
import { useUserStore, useTenantStore } from '@ydsz/stores';
import { showToast } from '@ydsz/notification';
import {
  YdSelectBase,
  YdSelectContentBase,
  YdSelectItemBase,
  YdSelectTriggerBase,
  YdSelectValueBase,
  YdTooltipBase,
  YdTooltipContentBase,
  YdTooltipProviderBase,
  YdTooltipTriggerBase,
} from '@ydsz-core/shadcn-ui';

/** 引入多租户 composable（提供租户列表加载、切换等能力） */
const {
  accessibleTenants,
  activeTenantId,
  activeTenantName,
  loading,
  error,
  loadAccessibleTenants,
  switchTenant,
} = useTenant();

/** 用户 store（用于判断是否为超级管理员） */
const userStore = useUserStore();
/** 租户 store */
const tenantStore = useTenantStore();

/** 选择器是否已完成初始化（避免闪烁） */
const initialized = ref(false);

/** 当前选中的租户 ID（v-model 绑定值） */
const selectedTenantId = ref<string>('');

/** roles 列表中是否包含超级管理员标识 */
const isSuperAdmin = computed(() => {
  const roles = userStore.userInfo?.roles ?? userStore.userRoles ?? [];
  return roles.includes('admin') || roles.includes('super_admin');
});

/**
 * 当前展示的租户名称。
 *
 * <p>优先显示 store 中的 activeTenantName；若为空则尝试从 accessibleTenants 中匹配。
 */
const displayName = computed(() => {
  if (activeTenantName.value) {
    return activeTenantName.value;
  }
  const matched = accessibleTenants.value.find(
    (t) => t.id === activeTenantId.value,
  );
  return matched?.tenantName || activeTenantId.value || '-';
});

/**
 * 是否显示切换器。
 *
 * <p>满足以下任一条件时显示：
 * <ol>
 *   <li>初始化完成 且 可访问租户数 > 1（多租户切换场景）</li>
 *   <li>初始化完成 且 当前用户为超级管理员（管理视角预览）</li>
 * </ol>
 */
const visible = computed(() => {
  if (!initialized.value) return false;
  return accessibleTenants.value.length > 1 || isSuperAdmin.value;
});

/**
 * 处理租户切换。
 *
 * <p>调用 switchTenant（含远程切换：后端签发目标租户 token 对并吊销旧 token），
 * 成功后刷新页面以加载新租户上下文；失败则提示且保持当前租户。
 *
 * @param tenantId - 选中的目标租户 ID
 */
async function handleTenantChange(tenantId: string): Promise<void> {
  if (tenantId === activeTenantId.value) {
    return;
  }
  const target = accessibleTenants.value.find((t) => t.id === tenantId);
  if (!target) {
    showToast.warning('未找到目标租户信息');
    return;
  }
  try {
    await switchTenant(target.id, target.tenantName);
  } catch {
    showToast.error(`切换至「${target.tenantName}」失败，请稍后重试`);
    return;
  }
  showToast.success(
    `已切换至「${target.tenantName}」(${target.tenantCode})，正在刷新...`,
  );
  // 延迟刷新，让用户看到提示
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

/**
 * 格式化 select option label（展示「名称 (编码)」格式）。
 */
function formatOptionLabel(tenant: TenantInfo): string {
  if (tenant.tenantCode) {
    return `${tenant.tenantName} (${tenant.tenantCode})`;
  }
  return tenant.tenantName;
}

// ============ 生命周期 ============

onMounted(async () => {
  // 加载可访问租户列表
  await loadAccessibleTenants();

  // 同步当前选中的租户 ID
  selectedTenantId.value = activeTenantId.value || tenantStore.activeTenantId || '';

  // 如果有错误，弹出提示
  if (error.value) {
    showToast.error(`租户列表加载失败：${error.value}`);
  }

  initialized.value = true;
});
</script>

<template>
  <YdTooltipProviderBase :delay-duration="300">
    <div class="tenant-switcher flex items-center">
      <!-- 加载中状态 -->
      <YdTooltipBase v-if="loading">
        <YdTooltipTriggerBase as-child>
          <span
            class="tenant-switcher__loading flex items-center gap-1 px-2 py-1 text-xs"
          >
            <svg
              class="size-4 animate-spin text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
              />
            </svg>
            <span>加载租户...</span>
          </span>
        </YdTooltipTriggerBase>
        <YdTooltipContentBase side="bottom">正在加载租户列表...</YdTooltipContentBase>
      </YdTooltipBase>

      <!-- 切换器主体 -->
      <YdSelectBase
        v-else-if="visible"
        v-model="selectedTenantId"
        :disabled="loading"
        @update:model-value="handleTenantChange"
      >
        <YdTooltipBase>
          <YdTooltipTriggerBase as-child>
            <YdSelectTriggerBase
              class="tenant-switcher__select w-[200px]"
              aria-label="切换租户"
            >
              <span class="tenant-switcher__icon mr-1 flex items-center">
                <svg
                  class="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect width="16" height="16" x="4" y="4" rx="2" />
                  <rect width="6" height="6" x="9" y="9" rx="1" />
                  <path d="M15 2v2" />
                  <path d="M15 20v2" />
                  <path d="M2 15h2" />
                  <path d="M20 15h2" />
                  <path d="M4 15v-2" />
                  <path d="M20 15v-2" />
                  <path d="M9 4v2" />
                  <path d="M15 4v2" />
                  <path d="M9 20v-2" />
                  <path d="M15 20v-2" />
                </svg>
              </span>
              <YdSelectValueBase :placeholder="displayName" />
            </YdSelectTriggerBase>
          </YdTooltipTriggerBase>
          <YdTooltipContentBase side="bottom">切换租户</YdTooltipContentBase>
        </YdTooltipBase>

        <!-- 租户选项列表 -->
        <YdSelectContentBase class="tenant-switcher__popper">
          <YdSelectItemBase
            v-for="tenant in accessibleTenants"
            :key="tenant.id"
            :value="tenant.id"
            :disabled="tenant.id === activeTenantId"
          >
            <span class="flex w-full items-center justify-between gap-3">
              <span
                class="truncate"
                :class="{ 'font-medium': tenant.id === activeTenantId }"
              >
                {{ tenant.tenantName }}
              </span>
              <span
                v-if="tenant.tenantCode"
                class="tenant-switcher__code shrink-0 rounded px-1.5 py-0.5 text-[10px]"
                :class="
                  tenant.id === activeTenantId
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                "
              >
                {{ tenant.tenantCode }}
              </span>
            </span>
          </YdSelectItemBase>
          <template v-if="accessibleTenants.length === 0">
            <div class="px-3 py-2 text-sm text-gray-400">暂无可访问租户</div>
          </template>
        </YdSelectContentBase>
      </YdSelectBase>

      <!-- 错误提示（加载失败但需要展示占位） -->
      <YdTooltipBase v-else-if="error">
        <YdTooltipTriggerBase as-child>
          <span
            class="tenant-switcher__error cursor-pointer px-2 py-1 text-xs text-red-500"
            @click="loadAccessibleTenants()"
          >
            {{ displayName }}
          </span>
        </YdTooltipTriggerBase>
        <YdTooltipContentBase side="bottom">
          {{ `租户加载失败：${error}，点击重试` }}
        </YdTooltipContentBase>
      </YdTooltipBase>
    </div>
  </YdTooltipProviderBase>
</template>

<style lang="scss" scoped>
.tenant-switcher {
  display: inline-flex;
  align-items: center;
  height: 100%;
  margin-right: 4px;

  &__select {
    height: 32px;
    background-color: transparent;
    border-radius: 6px;
  }

  &__icon {
    display: flex;
    align-items: center;
    color: hsl(var(--primary));
  }

  &__code {
    font-size: 10px;
    line-height: 1.4;
    border-radius: 3px;
  }

  &__loading {
    color: hsl(var(--muted-foreground));
    font-size: 12px;
  }

  &__error {
    transition: color 0.2s ease;

    &:hover {
      color: hsl(var(--destructive));
    }
  }
}
</style>
