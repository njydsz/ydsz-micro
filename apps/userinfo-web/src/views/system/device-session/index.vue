<!--
 * 设备管理页面（我的设备）
 *
 * <p>展示当前用户的所有活跃设备会话，支持吊销非当前设备。
 *
 * @path apps\userinfo-web\src\views\system\device-session\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 设备管理（我的设备）
 * <p>消费后端契约 DeviceSessionController（apps/userinfo-web/src/api/deviceSession.ts）：
 * listMyDevices() 我的设备列表，revokeDevice() 吊销设备。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { Page } from '@ydsz/common-ui';
import { ElButton, ElCard, ElEmpty, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';

import { listMyDevices, revokeDevice } from '#/api/deviceSession';
import type { DeviceSessionVO } from '#/api/models';

defineOptions({ name: 'DeviceSessionManagement' });

const logger = createLogger('userinfo-device-session');
const { t } = useI18n();

/** 设备列表 */
const devices = ref<DeviceSessionVO[]>([]);

/** 加载状态 */
const isLoading = ref(false);

/** 设备总数 */
const totalDevices = computed(() => devices.value.length);

/** 当前会话标识 */
const currentSessionId = computed(() => {
  const current = devices.value.find((d) => d.currentSession);
  return current?.sessionId;
});

/** 设备类型标签类型映射 */
function getDeviceTypeTagType(deviceType?: string): 'primary' | 'success' | 'warning' | 'info' {
  const upper = (deviceType ?? '').toUpperCase();
  if (upper === 'WEB') return 'primary';
  if (upper === 'APP') return 'success';
  if (upper === 'API') return 'warning';
  return 'info';
}

/** 加载设备列表 */
async function loadDevices(): Promise<void> {
  isLoading.value = true;
  try {
    devices.value = await listMyDevices();
  } catch (error) {
    logger.warn('加载设备列表失败: {}', error);
  } finally {
    isLoading.value = false;
  }
}

/** 吊销设备 */
async function handleRevoke(row: DeviceSessionVO): Promise<void> {
  if (!row.sessionId) return;
  try {
    await ydszConfirm(
      `确认吊销设备「${row.deviceTypeDesc ?? row.deviceType ?? row.sessionId}」？该设备将被强制登出。`,
      '确认吊销',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await revokeDevice({ sessionId: row.sessionId });
    showToast.success('吊销成功');
    await loadDevices();
  } catch (error) {
    logger.warn('吊销设备失败: {}', error);
  }
}

onMounted(() => {
  loadDevices();
});
</script>

<template>
  <Page v-loading="isLoading" auto-content-height>
    <!-- 统计概览 -->
    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <ElCard shadow="hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">设备总数</p>
            <p class="mt-1 text-2xl font-bold text-blue-600">{{ totalDevices }}</p>
          </div>
          <div class="rounded-full bg-blue-50 p-3">
            <span class="text-2xl text-blue-500">📱</span>
          </div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">当前会话</p>
            <p class="mt-1 truncate text-sm text-green-600">{{ currentSessionId ?? '-' }}</p>
          </div>
          <div class="rounded-full bg-green-50 p-3">
            <span class="text-2xl text-green-500">🟢</span>
          </div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">设备类型</p>
            <p class="mt-1 text-2xl font-bold text-purple-600">{{ devices.filter((d) => d.deviceType).length }}</p>
          </div>
          <div class="rounded-full bg-purple-50 p-3">
            <span class="text-2xl text-purple-500">💻</span>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 设备列表 -->
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">我的设备</span>
          <ElButton size="small" type="primary" plain @click="loadDevices">
            刷新
          </ElButton>
        </div>
      </template>
      <ElTable :data="devices" border>
        <ElTableColumn prop="sessionId" label="会话ID" width="140" />
        <ElTableColumn label="设备类型" width="120">
          <template #default="{ row }">
            <ElTag :type="getDeviceTypeTagType(row.deviceType)" size="small">
              {{ row.deviceTypeDesc ?? row.deviceType ?? '-' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="loginIp" label="登录IP" width="140" />
        <ElTableColumn prop="location" label="归属地" width="120" />
        <ElTableColumn prop="deviceFingerprint" label="设备指纹" minWidth="180" show-overflow-tooltip />
        <ElTableColumn prop="loginTime" label="登录时间" width="170" />
        <ElTableColumn prop="lastActiveTime" label="最后活跃" width="170" />
        <ElTableColumn label="会话状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.currentSession" type="success" size="small">当前会话</ElTag>
            <ElTag v-else type="info" size="small">活跃</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton
              v-if="!row.currentSession"
              size="small"
              link
              type="danger"
              @click="handleRevoke(row)"
            >
              吊销
            </ElButton>
            <span v-else class="text-xs text-gray-400">-</span>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="devices.length === 0" description="暂无设备记录" :image-size="60" />
    </ElCard>
  </Page>
</template>
