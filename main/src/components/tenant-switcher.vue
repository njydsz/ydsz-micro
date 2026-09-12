<!--
 * TenantSwitcher — 顶栏租户切换器
 *
 * <p>基于 Element Plus ElSelect 组件实现多租户切换功能。
 * 仅当存在多个可访问租户（或当前用户为超级管理员）时显示切换入口。
 * 切换后更新 TenantStore、localStorage 并刷新页面以加载新租户数据。
 *
 * @path main\src\components\tenant-switcher.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { ElMessage, ElSelect, ElOption, ElTooltip } from 'element-plus';
import { OfficeBuilding } from '@element-plus/icons-vue';
import type { TenantInfo } from '@ydsz/shared-business';

import { useTenant } from '@ydsz/shared-business';
import { useUserStore, useTenantStore } from '@ydsz/stores';

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
    ElMessage.warning('未找到目标租户信息');
    return;
  }
  try {
    await switchTenant(target.id, target.tenantName);
  } catch {
    ElMessage.error(`切换至「${target.tenantName}」失败，请稍后重试`);
    return;
  }
  ElMessage.success(
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
    ElMessage.error(`租户列表加载失败：${error.value}`);
  }

  initialized.value = true;
});
</script>

<template>
  <div class="tenant-switcher flex items-center">
    <!-- 加载中状态 -->
    <ElTooltip
      v-if="loading"
      content="正在加载租户列表..."
      placement="bottom"
      :show-after="300"
    >
      <span class="tenant-switcher__loading flex items-center gap-1 px-2 py-1 text-xs">
        <ElSelect
          loading
          disabled
          placeholder="加载租户..."
          class="tenant-switcher__select--loading"
        />
      </span>
    </ElTooltip>

    <!-- 切换器主体 -->
    <ElSelect
      v-else-if="visible"
      v-model="selectedTenantId"
      :placeholder="displayName"
      :disabled="loading"
      :loading="loading"
      class="tenant-switcher__select"
      popper-class="tenant-switcher__popper"
      :prefix-icon="undefined"
      @change="handleTenantChange"
    >
      <!-- 顶部搜索提示 -->
      <template #prefix>
        <ElTooltip
          content="切换租户"
          placement="top"
          :show-after="500"
        >
          <span class="tenant-switcher__icon flex items-center">
            <el-icon class="text-base">
              <OfficeBuilding />
            </el-icon>
          </span>
        </ElTooltip>
      </template>

      <!-- 租户选项列表 -->
      <ElOption
        v-for="tenant in accessibleTenants"
        :key="tenant.id"
        :value="tenant.id"
        :label="formatOptionLabel(tenant)"
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
      </ElOption>

      <!-- 无数据时的空状态 -->
      <template #empty>
        <span class="text-gray-400 text-sm">暂无可访问租户</span>
      </template>
    </ElSelect>

    <!-- 错误提示（加载失败但需要展示占位） -->
    <ElTooltip
      v-else-if="error"
      :content="`租户加载失败：${error}，点击重试`"
      placement="bottom"
    >
      <span
        class="tenant-switcher__error cursor-pointer px-2 py-1 text-xs text-red-500"
        @click="loadAccessibleTenants()"
      >
        {{ displayName }}
      </span>
    </ElTooltip>
  </div>
</template>

<style lang="scss" scoped>
.tenant-switcher {
  display: inline-flex;
  align-items: center;
  height: 100%;
  margin-right: 4px;

  &__select {
    width: 200px;

    :deep(.el-input__wrapper) {
      background-color: transparent;
      box-shadow: 0 0 0 1px var(--border-color, #e5e7eb) inset;
      border-radius: 6px;
      transition: box-shadow 0.2s ease;

      &:hover {
        box-shadow: 0 0 0 1px var(--primary-color, #409eff) inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px var(--primary-color, #409eff) inset !important;
      }
    }

    :deep(.el-input__inner) {
      font-size: 13px;
      color: var(--text-primary, #1f2937);
    }
  }

  &__select--loading {
    width: 140px;
  }

  &__icon {
    display: flex;
    align-items: center;
    color: var(--primary-color, #409eff);
  }

  &__code {
    font-size: 10px;
    line-height: 1.4;
    border-radius: 3px;
  }

  &__loading {
    color: var(--text-tertiary, #9ca3af);
    font-size: 12px;
  }

  &__error {
    transition: color 0.2s ease;

    &:hover {
      color: var(--danger-color, #ef4444);
    }
  }
}
</style>

<style lang="scss">
/* 全局 popper 样式（不使用 scoped 因为 dropdown 渲染在 body） */
.tenant-switcher__popper {
  .el-select-dropdown__item {
    padding: 8px 12px;
    line-height: 1.5;

    &.is-disabled {
      opacity: 0.6;
    }

    &.selected {
      color: var(--primary-color, #409eff);
      font-weight: 500;
    }
  }
}
</style>
