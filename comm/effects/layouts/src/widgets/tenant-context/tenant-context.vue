<!--
 * TenantContext 布局组件 — 顶栏租户切换器
 *
 * <p>展示当前活跃租户名称（含租户编码徽章），点击下拉可切换至其他可访问的租户。
 * 切换后触发页面刷新以加载对应租户数据。
 *
 * @path comm\effects\layouts\src\widgets\tenant-context\tenant-context.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { ChevronDown } from '@ydsz/icons';
import { Building2 } from '@ydsz/icons';
import { $t } from '@ydsz/locales';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  YDSZIcon,
  Badge,
} from '@YDSZ-core/shadcn-ui';

import { useTenant, type TenantInfo } from '@ydsz/shared-business';

const {
  accessibleTenants,
  activeTenantId,
  activeTenantName,
  isMultiTenant,
  loading,
  loadAccessibleTenants,
  switchTenant,
} = useTenant();

/** 是否已初始化（避免闪烁） */
const initialized = ref(false);

/** 当前展示的租户名称（优先显示活跃租户名，否则显示 ID 或默认提示） */
const displayName = computed(() => {
  if (!isMultiTenant.value) {
    return '';
  }
  return activeTenantName.value || activeTenantId.value || '-';
});

/** 当前租户编码（用于徽章显示） */
const displayCode = computed(() => {
  const current = accessibleTenants.value.find(
    (t) => t.id === activeTenantId.value,
  );
  return current?.tenantCode || '';
});

/** 是否显示切换入口（单租户或无列表时隐藏） */
const visible = computed(() => {
  return initialized.value && isMultiTenant.value && accessibleTenants.value.length > 1;
});

/**
 * 处理租户切换。
 *
 * <p>切换成功后刷新页面，使各模块重新加载对应租户数据。
 *
 * @param tenant - 目标租户
 */
function handleSwitchTenant(tenant: TenantInfo): void {
  if (tenant.id === activeTenantId.value) {
    return;
  }
  switchTenant(tenant.id, tenant.tenantName);
  // 切换后刷新页面以加载新租户的完整上下文（token 失效需重新登录的场景由后端拦截器处理）
  window.location.reload();
}

onMounted(async () => {
  await loadAccessibleTenants();
  initialized.value = true;
});
</script>

<template>
  <DropdownMenu v-if="visible">
    <DropdownMenuTrigger
      class="hover:bg-accent ml-1 mr-1 flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 transition-colors"
    >
      <YDSZIcon icon="Building2" class="text-primary size-4" />
      <span class="text-foreground max-w-[120px] truncate text-sm font-medium">
        {{ displayName }}
      </span>
      <Badge
        v-if="displayCode"
        class="bg-primary/10 text-primary hover:bg-primary/10 ml-0.5 shrink-0 text-[10px]"
        variant="outline"
      >
        {{ displayCode }}
      </Badge>
      <ChevronDown class="text-muted-foreground ml-0.5 size-3" />
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-[240px] p-0 pb-1" align="end">
      <DropdownMenuLabel class="text-muted-foreground px-3 py-2 text-xs">
        {{ $t('ui.widgets.tenantContext.title') ?? '切换租户' }}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuItem
        v-for="tenant in accessibleTenants"
        :key="tenant.id"
        :class="[
          'mx-1 flex cursor-pointer items-center rounded-sm py-2 leading-8',
          tenant.id === activeTenantId ? 'bg-primary/5' : '',
        ]"
        @click="handleSwitchTenant(tenant)"
      >
        <Building2
          :class="[
            'mr-2 size-4 shrink-0',
            tenant.id === activeTenantId ? 'text-primary' : 'text-muted-foreground',
          ]"
        />
        <div class="flex w-full items-center justify-between">
          <span
            :class="[
              'flex-1 truncate',
              tenant.id === activeTenantId ? 'text-primary font-medium' : '',
            ]"
          >
            {{ tenant.tenantName }}
          </span>
          <Badge
            class="ml-1 shrink-0 text-[10px]"
            :variant="tenant.id === activeTenantId ? 'default' : 'secondary'"
          >
            {{ tenant.tenantCode }}
          </Badge>
        </div>
      </DropdownMenuItem>

      <DropdownMenuItem v-if="loading" disabled class="text-muted-foreground justify-center text-center text-xs">
        {{ $t('ui.widgets.tenantContext.loading') ?? '加载中...' }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- 单租户模式仅显示当前租户名称 -->
  <div
    v-else-if="initialized && isMultiTenant"
    class="hover:bg-accent ml-1 mr-1 flex cursor-default items-center gap-1 rounded-md px-2 py-1.5"
  >
    <Building2 class="text-primary size-4" />
    <span class="text-foreground max-w-[120px] truncate text-sm font-medium">
      {{ displayName }}
    </span>
    <Badge
      v-if="displayCode"
      class="bg-primary/10 text-primary hover:bg-primary/10 ml-0.5 shrink-0 text-[10px]"
      variant="outline"
    >
      {{ displayCode }}
    </Badge>
  </div>
</template>
