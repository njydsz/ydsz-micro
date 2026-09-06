<!--
 * 列元数据对话框
 *
 * <p>展示指定表的列元数据，支持刷新列缓存。
 *
 * @path apps/generator-web/src/views/table-meta/column-dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 列元数据对话框组件。
 *
 * <p>展示表的所有列及其数据类型、是否主键、是否可空等属性。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, ref, watch } from 'vue';

import { ElButton, ElDialog, ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { getColumns, refreshColumns } from '#/api/table-meta';
import type { GenColumnMeta } from '#/api/models';

interface Props {
  visible: boolean;
  tableMetaId?: number;
  tableName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tableName: '',
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

defineOptions({ name: 'ColumnDialog' });

const loading = ref(false);
const columns = ref<GenColumnMeta[]>([]);

/** 加载列元数据 */
async function loadColumns() {
  if (!props.tableMetaId) return;
  loading.value = true;
  try {
    columns.value = await getColumns({ tableMetaId: props.tableMetaId });
  } finally {
    loading.value = false;
  }
}

/** 刷新列元数据 */
async function handleRefreshColumns() {
  if (!props.tableMetaId) return;
  loading.value = true;
  try {
    columns.value = await refreshColumns({
      datasourceId: 0,
      tableName: props.tableName,
    });
    ElMessage.success('刷新列缓存成功');
  } finally {
    loading.value = false;
  }
}

/** 关闭对话框 */
function handleClose() {
  emit('update:visible', false);
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.tableMetaId) {
      void loadColumns();
    }
  },
);

onMounted(() => {
  if (props.visible && props.tableMetaId) {
    void loadColumns();
  }
});
</script>

<template>
  <ElDialog
    :model-value="visible"
    :title="`列元数据 - ${tableName}`"
    width="900px"
    @update:model-value="handleClose"
  >
    <div class="mb-3 flex justify-end">
      <ElButton type="primary" size="small" @click="handleRefreshColumns">刷新列缓存</ElButton>
    </div>
    <ElTable v-loading="loading" :data="columns" stripe max-height="400">
      <ElTableColumn prop="columnName" label="列名" width="150" />
      <ElTableColumn prop="dataType" label="数据类型" width="120" />
      <ElTableColumn prop="columnSize" label="长度" width="80" />
      <ElTableColumn label="主键" width="70">
        <template #default="{ row }">
          <ElTag v-if="row.pk" type="danger" size="small">PK</ElTag>
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="可空" width="70">
        <template #default="{ row }">
          <ElTag :type="row.nullable ? 'info' : 'warning'" size="small">
            {{ row.nullable ? '是' : '否' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="comment" label="注释" min-width="150" />
      <ElTableColumn prop="overrideJavaType" label="Java类型" width="120" />
      <ElTableColumn prop="overrideFieldName" label="字段名" width="120" />
    </ElTable>
  </ElDialog>
</template>
