<!--
 * 社交账号绑定管理页面
 *
 * <p>展示当前用户已绑定的社交账号列表，支持解绑操作；同时展示可绑定的平台引导。
 *
 * @path apps\userinfo-web\src\views\system\social-account\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 社交账号绑定管理
 * <p>消费后端契约 SocialAccountController（apps/userinfo-web/src/api/socialAccount.ts）：
 * getBindings() 已绑定列表，getAvailablePlatforms() 可用平台，unbind() 解绑。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { Page } from '@ydsz/common-ui';
import { YdBadge, YdButtonBase, YdCard, YdCardContent, YdCardHeader, YdCardTitle } from '@ydsz-core/ydsz-ui';
import { YdEmptyState, YdImage } from '@ydsz-core/ydsz-ui';
import { YdTable } from '@ydsz-core/ydsz-ui';
import { ElTableColumn } from 'element-plus';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';

import {
  getAvailablePlatforms,
  getBindings,
  unbind,
} from '#/api/socialAccount';
import type { SocialAccountVO } from '#/api/models';

defineOptions({ name: 'SocialAccountManagement' });

const logger = createLogger('userinfo-social-account');
const { t } = useI18n();

/** 已绑定社交账号列表 */
const bindings = ref<SocialAccountVO[]>([]);

/** 可用平台列表 */
const availablePlatforms = ref<Record<string, unknown>[]>([]);

/** 加载状态 */
const isLoading = ref(false);

/** 平台标签颜色映射 */
const platformColorMap: Record<string, string> = {
  GITHUB: '',
  GOOGLE: 'success',
  WECHAT: 'success',
  APPLE: 'info',
  DINGTALK: 'warning',
  ENTERPRISE_WECHAT: 'success',
  FEISHU: 'primary',
};

/** 获取平台标签类型 */
function getPlatformTagType(platform?: string): string {
  return platformColorMap[platform ?? ''] || 'info';
}

/** 平台唯一标识键 */
function getPlatformKey(platform: Record<string, unknown>, index: number): string {
  return String(platform.code ?? platform.name ?? `platform-${index}`);
}

/** 已绑定平台集合（用于过滤可用平台） */
const boundPlatformSet = computed(() => {
  return new Set(
    bindings.value.map((item) => (item.platform ?? '').toUpperCase()),
  );
});

/** 过滤后可展示的平台（排除已绑定） */
const unboundPlatforms = computed(() => {
  return availablePlatforms.value.filter((platform) => {
    const code = String(platform.code ?? '').toUpperCase();
    return code && !boundPlatformSet.value.has(code);
  });
});

/** 加载绑定列表 */
async function loadBindings(): Promise<void> {
  try {
    bindings.value = await getBindings();
  } catch (error) {
    logger.warn('加载已绑定社交账号失败: {}', error);
  }
}

/** 加载可用平台 */
async function loadAvailablePlatforms(): Promise<void> {
  try {
    availablePlatforms.value = await getAvailablePlatforms();
  } catch (error) {
    logger.warn('加载可用平台失败: {}', error);
  }
}

/** 加载全部数据 */
async function loadAll(): Promise<void> {
  isLoading.value = true;
  try {
    await Promise.all([loadBindings(), loadAvailablePlatforms()]);
  } finally {
    isLoading.value = false;
  }
}

/** 解绑社交账号 */
async function handleUnbind(row: SocialAccountVO): Promise<void> {
  if (!row.platform) return;
  const platformName = row.nickname ?? row.platform;
  try {
    await ydszConfirm(
      `确认解绑社交账号「${platformName}」？解绑后将无法通过该平台快速登录。`,
      '确认解绑',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await unbind({ platform: row.platform });
    showToast.success('解绑成功');
    await loadBindings();
  } catch (error) {
    logger.warn('解绑社交账号失败: {}', error);
  }
}

onMounted(() => {
  loadAll();
});
</script>

<template>
  <Page v-loading="isLoading" auto-content-height>
    <!-- 已绑定列表 -->
    <YdCard class="mb-4">
      <YdCardHeader>
        <YdCardTitle class="font-medium text-base">已绑定社交账号</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
      <YdTable :data="bindings" border>
        <ElTableColumn prop="platform" label="平台" width="140">
          <template #default="{ row }">
            <YdBadge :variant="getPlatformTagType(row.platform) === 'primary' ? 'default' : getPlatformTagType(row.platform) === 'warning' ? 'outline' : 'secondary'" :class="getPlatformTagType(row.platform) === 'warning' ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'text-xs'">
              {{ row.platform ?? '-' }}
            </YdBadge>
          </template>
        </ElTableColumn>
        <ElTableColumn label="头像" width="80">
          <template #default="{ row }">
            <YdImage
              v-if="row.avatarUrl"
              :src="row.avatarUrl"
              :preview-src-list="[row.avatarUrl]"
              style="width: 40px; height: 40px; border-radius: 50%"
              fit="cover"
            />
            <span v-else class="text-gray-400">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="nickname" label="昵称" minWidth="120" />
        <ElTableColumn prop="openId" label="Open ID" minWidth="160" />
        <ElTableColumn prop="createdAt" label="绑定时间" width="170" />
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <YdButtonBase
              size="sm"
              variant="link"
              class="text-destructive"
              @click="handleUnbind(row)"
            >
              解绑
            </YdButtonBase>
          </template>
        </ElTableColumn>
      </YdTable>
      <YdEmptyState v-if="bindings.length === 0" description="暂无绑定的社交账号" :image-size="60" />
      </YdCardContent>
    </YdCard>

    <!-- 可绑定平台引导 -->
    <YdCard>
      <YdCardHeader>
        <YdCardTitle class="font-medium text-base">可绑定平台</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
      <div
        v-if="unboundPlatforms.length > 0"
        class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="(platform, index) in unboundPlatforms"
          :key="getPlatformKey(platform, index)"
          class="flex items-center justify-between rounded-lg border p-4"
        >
          <div class="flex items-center gap-3">
            <span class="text-lg font-medium">{{ String(platform.name ?? platform.code ?? '-') }}</span>
          </div>
          <YdButtonBase size="sm" variant="outline" disabled>
            绑定
          </YdButtonBase>
        </div>
      </div>
      <YdEmptyState v-else description="暂无可绑定的平台或已全部绑定" :image-size="60" />
      </YdCardContent>
    </YdCard>
  </Page>
</template>
