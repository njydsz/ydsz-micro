<!--
 * 配置版本历史抽屉 — 展示指定配置的版本快照列表，支持查看快照、版本对比和回滚
 *
 * @path apps\system-web\src\views\config\config-history-dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 配置版本历史抽屉
 * <p>消费后端契约 ConfigVersionController（src/api/configVersion.ts，auto-generated）：
 * listByResourceKey() 查询版本历史，rollback() 回滚到指定版本。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElMessage,
  ElMessageBox,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
} from 'element-plus';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@YDSZ-core/shared/utils';
import { listByResourceKey, rollback } from '#/api/configVersion';
import type { EntityVersionVO } from '#/api/models';

import JsonDiffDialog from './json-diff-dialog.vue';

const logger = createLogger('config-history-dialog');

const { t } = useI18n();

const emit = defineEmits<{ success: [] }>();

/** 版本列表数据 */
const versions = ref<EntityVersionVO[]>([]);
/** 加载状态 */
const loading = ref(false);
/** 当前配置键 */
const configKey = ref('');
/** 抽屉可见性 */
const drawerVisible = ref(false);
/** 选中行（用于版本对比） */
const selected = ref<EntityVersionVO[]>([]);

/** JSON 查看对话框可见性 */
const snapshotDialogVisible = ref(false);
/** 当前查看的快照 JSON */
const currentSnapshotJson = ref('');
/** 当前查看的版本号 */
const currentSnapshotVersion = ref('');

/** JSON diff 对话框可见性 */
const diffDialogVisible = ref(false);
/** diff 左侧版本 */
const diffVersionA = ref('');
/** diff 右侧版本 */
const diffVersionB = ref('');
/** diff 左侧快照 */
const diffSnapshotA = ref('');
/** diff 右侧快照 */
const diffSnapshotB = ref('');

/** 格式化快照 JSON */
const formatSnapshot = computed(() => {
  return (json: string | undefined) => {
    if (!json) return '-';
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };
});

/** 处理选中变化 */
function handleSelectionChange(selection: EntityVersionVO[]) {
  selected.value = selection;
}

/** 打开抽屉并加载版本历史 */
async function open(key: string) {
  configKey.value = key;
  drawerVisible.value = true;
  await loadVersions();
}

/** 加载版本列表 */
async function loadVersions() {
  loading.value = true;
  try {
    const data = await listByResourceKey({ resourceKey: configKey.value });
    // 默认倒序（最新在前）
    versions.value = (data ?? []).sort((a, b) => {
      const va = a.version ?? '';
      const vb = b.version ?? '';
      return vb.localeCompare(va);
    });
  } catch (error) {
    logger.warn('加载配置版本历史失败', error);
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 查看快照详情 */
function showSnapshot(row: EntityVersionVO) {
  currentSnapshotVersion.value = row.version ?? '';
  currentSnapshotJson.value = formatSnapshot.value(row.snapshotJson);
  snapshotDialogVisible.value = true;
}

/** 确认回滚 */
async function confirmRollback(row: EntityVersionVO) {
  if (!row.version) return;
  try {
    await ElMessageBox.confirm(
      t('configVersion.rollbackConfirm', {
        version: row.version,
        changeLog: row.changeLog || '-',
      }),
      t('configVersion.rollbackTitle'),
      { type: 'warning' },
    );
  } catch {
    // 用户取消
    return;
  }

  try {
    await rollback({ resourceKey: configKey.value }, { targetVersion: row.version });
    ElMessage.success(t('operationSuccess'));
    emit('success');
    // 回滚成功后刷新列表
    await loadVersions();
  } catch (error) {
    logger.warn('回滚配置版本失败', error);
    // 错误提示由请求拦截器统一处理
  }
}

/** 展示版本对比 */
function showDiff() {
  if (selected.value.length !== 2) return;
  // 按版本号排序：较旧的版本在左，较新的版本在右
  const sorted = [...selected.value].sort((a, b) => {
    const va = a.version ?? '';
    const vb = b.version ?? '';
    return va.localeCompare(vb);
  });
  diffVersionA.value = sorted[0].version ?? '';
  diffVersionB.value = sorted[1].version ?? '';
  diffSnapshotA.value = formatSnapshot.value(sorted[0].snapshotJson);
  diffSnapshotB.value = formatSnapshot.value(sorted[1].snapshotJson);
  diffDialogVisible.value = true;
}

/** 关闭抽屉 */
function close() {
  drawerVisible.value = false;
  versions.value = [];
  selected.value = [];
}

// 暴露方法给父组件
defineExpose({
  open,
  close,
});
</script>

<template>
  <ElDrawer
    v-model="drawerVisible"
    size="65%"
    :title="t('configVersion.historyTitle', [configKey])"
    :destroy-on-close="true"
    @close="close"
  >
    <!-- 版本列表表格 -->
    <ElTable
      v-loading="loading"
      :data="versions"
      stripe
      border
      height="calc(100vh - 180px)"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="40" />
      <ElTableColumn prop="version" :label="t('configVersion.version')" width="180">
        <template #default="{ row }">
          <ElTag v-if="row.version" size="small" type="primary">{{ row.version }}</ElTag>
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="changeLog" :label="t('configVersion.changeLog')" min-width="200">
        <template #default="{ row }">
          <ElTooltip :content="row.changeLog" :disabled="!row.changeLog">
            <span class="truncate">{{ row.changeLog || '-' }}</span>
          </ElTooltip>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="effectiveDate" :label="t('configVersion.effectiveDate')" width="180">
        <template #default="{ row }">
          {{ row.effectiveDate || '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn :label="t('action')" width="200" fixed="right">
        <template #default="{ row }">
          <ElButton text type="primary" @click="showSnapshot(row)">
            {{ t('configVersion.viewSnapshot') }}
          </ElButton>
          <ElButton text type="warning" @click="confirmRollback(row)">
            {{ t('configVersion.rollback') }}
          </ElButton>
        </template>
      </ElTableColumn>

      <!-- 空数据 -->
      <template #empty>
        <ElEmpty :description="t('common.noData')" />
      </template>
    </ElTable>

    <!-- 底部工具栏 -->
    <template #footer>
      <ElButton @click="close">{{ t('common.close') }}</ElButton>
      <ElButton
        type="primary"
        :disabled="selected.length !== 2"
        @click="showDiff"
      >
        {{ t('configVersion.compareVersions') }}
      </ElButton>
    </template>

    <!-- 快照 JSON 查看对话框 -->
    <ElDialog
      v-model="snapshotDialogVisible"
      width="70%"
      :title="t('configVersion.snapshotDetail', [currentSnapshotVersion])"
      :destroy-on-close="true"
    >
      <pre class="json-viewer">{{ currentSnapshotJson }}</pre>
      <template #footer>
        <ElButton @click="snapshotDialogVisible = false">{{ t('common.close') }}</ElButton>
      </template>
    </ElDialog>

    <!-- JSON diff 对比对话框 -->
    <JsonDiffDialog
      v-if="diffDialogVisible"
      v-model:visible="diffDialogVisible"
      :version-a="diffVersionA"
      :version-b="diffVersionB"
      :snapshot-a="diffSnapshotA"
      :snapshot-b="diffSnapshotB"
    />
  </ElDrawer>
</template>

<style scoped>
.json-viewer {
  max-height: 60vh;
  overflow: auto;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.truncate {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
