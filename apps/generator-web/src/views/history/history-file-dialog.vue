<!--
 * 历史文件明细对话框
 *
 * <p>展示某个生成任务中每个文件的操作记录。
 *
 * @path apps/generator-web/src/views/history/history-file-dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 历史文件明细对话框组件。
 *
 * <p>列出任务中所有生成文件的操作类型（CREATED/UPDATED/UNCHANGED）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, ref, watch } from 'vue';

import { YdBadge, YdTable, YdTableColumn, YdDialog, YdDialogContent, YdDialogHeader, YdDialogTitle } from '@ydsz-core/ydsz-ui';
// FIXME-P3-EP-EXIT;

import { listHistoryFiles } from '#/api/history';
import type { GenHistoryFile } from '#/api/models';

interface Props {
  visible: boolean;
  historyId?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

defineOptions({ name: 'HistoryFileDialog' });

const loading = ref(false);
const files = ref<GenHistoryFile[]>([]);

function getActionBadgeVariant(action: string): 'default' | 'destructive' | 'secondary' {
  switch (action) {
    case 'CREATED':
      return 'default';
    case 'UPDATED':
      return 'destructive';
    case 'UNCHANGED':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getActionText(action: string): string {
  switch (action) {
    case 'CREATED':
      return '新建';
    case 'UPDATED':
      return '更新';
    case 'UNCHANGED':
      return '未变';
    default:
      return action;
  }
}

async function loadFiles() {
  if (!props.historyId) return;
  loading.value = true;
  try {
    files.value = await listHistoryFiles({ id: props.historyId });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:visible', false);
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.historyId) {
      void loadFiles();
    }
  },
);

onMounted(() => {
  if (props.visible && props.historyId) {
    void loadFiles();
  }
});
</script>

<template>
  <YdDialog :open="visible" @update:open="handleClose">
    <YdDialogContent style="max-width: 800px">
      <YdDialogHeader>
        <YdDialogTitle>任务文件明细</YdDialogTitle>
      </YdDialogHeader>
      <div class="mb-2 text-sm text-gray-500">
        任务 #{{ historyId }} 共 {{ files.length }} 个文件
      </div>
      <YdTable loading="loading" :data="files" stripe max-height="400">
        <YdTableColumn type="index" label="#" width="50" />
        <YdTableColumn prop="filePath" label="文件路径" min-width="300" show-overflow-tooltip />
        <YdTableColumn label="操作" width="100">
          <template #default="{ row }">
            <YdBadge :variant="getActionBadgeVariant(row.action ?? '')">
              {{ getActionText(row.action ?? '') }}
            </YdBadge>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="originalBackupPath" label="备份路径" min-width="200" show-overflow-tooltip />
      </YdTable>
    </YdDialogContent>
  </YdDialog>
</template>
