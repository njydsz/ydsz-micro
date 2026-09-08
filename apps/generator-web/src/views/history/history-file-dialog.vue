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

import { ElDialog, ElEmpty, ElTable, ElTableColumn, ElTag } from 'element-plus';

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

function getActionTagType(action: string): 'success' | 'warning' | 'info' | '' {
  switch (action) {
    case 'CREATED':
      return 'success';
    case 'UPDATED':
      return 'warning';
    case 'UNCHANGED':
      return 'info';
    default:
      return '';
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
  <ElDialog
    :model-value="visible"
    title="任务文件明细"
    width="800px"
    @update:model-value="handleClose"
  >
    <div class="mb-2 text-sm text-gray-500">
      任务 #{{ historyId }} 共 {{ files.length }} 个文件
    </div>
    <ElTable v-loading="loading" :data="files" stripe max-height="400">
      <ElTableColumn type="index" label="#" width="50" />
      <ElTableColumn prop="filePath" label="文件路径" min-width="300" show-overflow-tooltip />
      <ElTableColumn label="操作" width="100">
        <template #default="{ row }">
          <ElTag :type="getActionTagType(row.action ?? '')" size="small">
            {{ getActionText(row.action ?? '') }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="originalBackupPath" label="备份路径" min-width="200" show-overflow-tooltip />
    </ElTable>
  </ElDialog>
</template>
