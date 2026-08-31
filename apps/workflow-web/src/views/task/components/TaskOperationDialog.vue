<!--
 * 任务操作弹窗（跳转/沟通/草稿）
 *
 * <p>提供任务跳转、沟通、草稿保存等功能。
 *
 * @path apps\workflow-web\src\views\task\components\TaskOperationDialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 任务操作弹窗
 * <p>支持任务跳转（指定节点跳转/自由跳转）、沟通（发送消息给相关人员）、草稿保存。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTabPane,
  ElTabs,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { communicate, freeJump, jump, saveDraft } from '#/api/flowTask';
import type { FlowRunTaskVO, FlowTaskOperateDTO } from '#/api/models';

interface Props {
  /** 当前任务 */
  task: FlowRunTaskVO | null;
  /** 可跳转节点列表 */
  jumpableNodes?: Array<{ nodeCode: string; nodeName: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  jumpableNodes: () => [],
});

const emit = defineEmits<{
  success: [];
}>();

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    activeOperation.value = 'jump';
    jumpForm.mode = 'designated';
    jumpForm.targetNodeCode = '';
    jumpForm.comment = '';
    communicateForm.content = '';
    communicateForm.targetUserIds = [];
    draftForm.comment = '';
    draftForm.variables = '';
  },
});

/** 当前操作类型 */
const activeOperation = ref<'jump' | 'communicate' | 'draft'>('jump');

/** 跳转表单 */
const jumpForm = reactive({
  mode: 'designated', // designated=指定节点, free=自由跳转
  targetNodeCode: '',
  comment: '',
});

/** 沟通表单 */
const communicateForm = reactive({
  content: '',
  targetUserIds: [] as string[],
});

/** 草稿表单 */
const draftForm = reactive({
  comment: '',
  variables: '',
});

/** 提交状态 */
const submitting = ref(false);

/** 操作标题 */
const operationTitle = computed(() => {
  const titles: Record<string, string> = {
    jump: '任务跳转',
    communicate: '任务沟通',
    draft: '保存草稿',
  };
  return titles[activeOperation.value] || '任务操作';
});

/** 执行跳转 */
async function handleJump(): Promise<void> {
  if (!props.task?.id) return;
  if (jumpForm.mode === 'designated' && !jumpForm.targetNodeCode) {
    ElMessage.warning('请选择目标节点');
    return;
  }
  submitting.value = true;
  try {
    const dto: FlowTaskOperateDTO = {
      taskId: props.task.id,
      comment: jumpForm.comment,
      targetNodeCode: jumpForm.targetNodeCode,
    };
    if (jumpForm.mode === 'free') {
      await freeJump(dto);
    } else {
      await jump(dto);
    }
    ElMessage.success('跳转成功');
    emit('success');
    modalApi.close();
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    submitting.value = false;
  }
}

/** 执行沟通 */
async function handleCommunicate(): Promise<void> {
  if (!props.task?.id || !communicateForm.content.trim()) {
    ElMessage.warning('请输入沟通内容');
    return;
  }
  submitting.value = true;
  try {
    const dto: FlowTaskOperateDTO = {
      taskId: props.task.id,
      comment: communicateForm.content,
      targetUserIds: communicateForm.targetUserIds,
    };
    await communicate(dto);
    ElMessage.success('沟通消息已发送');
    emit('success');
    modalApi.close();
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    submitting.value = false;
  }
}

/** 保存草稿 */
async function handleSaveDraft(): Promise<void> {
  if (!props.task?.id) return;
  submitting.value = true;
  try {
    const dto: FlowTaskOperateDTO = {
      taskId: props.task.id,
      comment: draftForm.comment,
    };
    await saveDraft(dto);
    ElMessage.success('草稿保存成功');
    emit('success');
    modalApi.close();
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    submitting.value = false;
  }
}

/** 执行当前操作 */
function handleSubmit(): void {
  const handlers: Record<string, () => Promise<void>> = {
    jump: handleJump,
    communicate: handleCommunicate,
    draft: handleSaveDraft,
  };
  const handler = handlers[activeOperation.value];
  if (handler) {
    handler();
  }
}
</script>

<template>
  <Modal :title="operationTitle" width="560px">
    <ElTabs v-model="activeOperation" class="operation-tabs">
      <!-- 任务跳转 -->
      <ElTabPane label="任务跳转" name="jump">
        <ElForm :model="jumpForm" label-width="100px" class="mt-4">
          <ElFormItem label="跳转模式">
            <ElRadioGroup v-model="jumpForm.mode">
              <ElRadioButton value="designated">指定节点跳转</ElRadioButton>
              <ElRadioButton value="free">自由跳转</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem v-if="jumpForm.mode === 'designated'" label="目标节点">
            <ElSelect
              v-model="jumpForm.targetNodeCode"
              placeholder="选择目标节点"
              filterable
              class="w-full"
            >
              <ElOption
                v-for="node in jumpableNodes"
                :key="node.nodeCode"
                :label="node.nodeName"
                :value="node.nodeCode"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="跳转原因">
            <ElInput
              v-model="jumpForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入跳转原因（选填）"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>

      <!-- 任务沟通 -->
      <ElTabPane label="任务沟通" name="communicate">
        <ElForm :model="communicateForm" label-width="100px" class="mt-4">
          <ElFormItem label="沟通内容">
            <ElInput
              v-model="communicateForm.content"
              type="textarea"
              :rows="4"
              placeholder="请输入沟通内容"
            />
          </ElFormItem>
          <ElFormItem label="沟通对象">
            <ElSelect
              v-model="communicateForm.targetUserIds"
              multiple
              placeholder="选择沟通对象（选填，留空则通知所有相关人员）"
              filterable
              class="w-full"
            >
              <ElOption label="发起人" value="initiator" />
              <ElOption label="上一节点处理人" value="prevAssignee" />
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </ElTabPane>

      <!-- 保存草稿 -->
      <ElTabPane label="保存草稿" name="draft">
        <ElForm :model="draftForm" label-width="100px" class="mt-4">
          <ElFormItem label="草稿备注">
            <ElInput
              v-model="draftForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入草稿备注（选填）"
            />
          </ElFormItem>
          <ElFormItem label="提示">
            <p class="text-xs text-gray-400">
              保存草稿后，当前任务的审批意见将被暂存，不会提交审批结果。
            </p>
          </ElFormItem>
        </ElForm>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <ElButton @click="modalApi.close()">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确定</ElButton>
    </template>
  </Modal>
</template>

<style scoped>
.operation-tabs {
  min-height: 200px;
}
</style>
