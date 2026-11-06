<!--
 * DAG 工作流 详情 弹窗
 *
 * @path apps/agent-web/src/views/dag-workflow/dag-workflow-detail.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * DAG 工作流详情弹窗（只读展示）。
 */
import { YdButton, YdDescriptions, YdDescriptionsItem } from '@ydsz-core/ydsz-ui';
import { useYdModal } from '@ydsz/common-ui';
import { ref } from 'vue';
import type { DagWorkflowVO } from '#/api/models';

defineOptions({ name: 'DagWorkflowDetail' });

const detailRecord = ref<DagWorkflowVO | undefined>(undefined);

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    detailRecord.value = modalApi.getData<{ record: DagWorkflowVO }>()?.record;
  },
});

function handleClose(): void {
  modalApi.close();
}
</script>

<template>
  <Modal title="工作流详情" width="720px" @close="handleClose">
    <YdDescriptions :column="2" border>
      <YdDescriptionsItem label="工作流编码">{{
        detailRecord?.workflowCode ?? '-'
      }}</YdDescriptionsItem>
      <YdDescriptionsItem label="工作流名称">{{
        detailRecord?.workflowName ?? '-'
      }}</YdDescriptionsItem>
      <YdDescriptionsItem label="分类">{{ detailRecord?.category ?? '-' }}</YdDescriptionsItem>
      <YdDescriptionsItem label="描述" :span="2">{{
        detailRecord?.description ?? '-'
      }}</YdDescriptionsItem>
      <YdDescriptionsItem label="YAML DSL" :span="2">
        <pre
          class="bg-accent/40 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded p-3 font-mono text-xs"
          >{{ detailRecord?.dslContent ?? '-' }}</pre>
      </YdDescriptionsItem>
    </YdDescriptions>
    <template #footer>
      <div class="flex justify-end">
        <YdButton @click="handleClose">关闭</YdButton>
      </div>
    </template>
  </Modal>
</template>
