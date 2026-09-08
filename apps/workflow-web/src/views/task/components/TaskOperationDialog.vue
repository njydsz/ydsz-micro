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
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';

const logger = createLogger('workflow-task');
const { t } = useI18n();

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
    jump: t('task.jump.title'),
    communicate: t('task.communicate.title'),
    draft: t('task.draft.title'),
  };
  return titles[activeOperation.value] || '任务操作';
});

/** 执行跳转 */
async function handleJump(): Promise<void> {
  if (!props.task?.id) return;
  if (jumpForm.mode === 'designated' && !jumpForm.targetNodeCode) {
    ElMessage.warning(t('task.jump.selectNodeRequired'));
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
    ElMessage.success(t('task.jump.success'));
    emit('success');
    modalApi.close();
  } catch (error) {
    logger.warn('任务跳转失败，详见拦截器提示', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  } finally {
    submitting.value = false;
  }
}

/** 执行沟通 */
async function handleCommunicate(): Promise<void> {
  if (!props.task?.id || !communicateForm.content.trim()) {
    ElMessage.warning(t('task.communicate.contentRequired'));
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
    ElMessage.success(t('task.communicate.success'));
    emit('success');
    modalApi.close();
  } catch (error) {
    logger.warn('任务沟通失败，详见拦截器提示', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
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
    ElMessage.success(t('task.draft.success'));
    emit('success');
    modalApi.close();
  } catch (error) {
    logger.warn('草稿保存失败，详见拦截器提示', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
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
      <ElTabPane :label="t('task.jump.title')" name="jump">
        <ElForm :model="jumpForm" label-width="100px" class="mt-4">
          <ElFormItem :label="t('task.jump.mode.label')">
            <ElRadioGroup v-model="jumpForm.mode">
              <ElRadioButton value="designated">{{ t('task.jump.mode.designated') }}</ElRadioButton>
              <ElRadioButton value="free">{{ t('task.jump.mode.free') }}</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem v-if="jumpForm.mode === 'designated'" :label="t('task.jump.targetNode.label')">
            <ElSelect
              v-model="jumpForm.targetNodeCode"
              :placeholder="t('task.jump.targetNode.placeholder')"
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
          <ElFormItem :label="t('task.jump.reason.label')">
            <ElInput
              v-model="jumpForm.comment"
              type="textarea"
              :rows="3"
              :placeholder="t('task.jump.reason.placeholder')"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>

      <!-- 任务沟通 -->
      <ElTabPane :label="t('task.communicate.title')" name="communicate">
        <ElForm :model="communicateForm" label-width="100px" class="mt-4">
          <ElFormItem :label="t('task.communicate.content.label')">
            <ElInput
              v-model="communicateForm.content"
              type="textarea"
              :rows="4"
              :placeholder="t('task.communicate.content.placeholder')"
            />
          </ElFormItem>
          <ElFormItem :label="t('task.communicate.target.label')">
            <ElSelect
              v-model="communicateForm.targetUserIds"
              multiple
              :placeholder="t('task.communicate.target.placeholder')"
              filterable
              class="w-full"
            >
              <ElOption :label="t('task.communicate.target.initiator')" value="initiator" />
              <ElOption :label="t('task.communicate.target.prevAssignee')" value="prevAssignee" />
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </ElTabPane>

      <!-- 保存草稿 -->
      <ElTabPane :label="t('task.draft.title')" name="draft">
        <ElForm :model="draftForm" label-width="100px" class="mt-4">
          <ElFormItem :label="t('task.draft.comment.label')">
            <ElInput
              v-model="draftForm.comment"
              type="textarea"
              :rows="4"
              :placeholder="t('task.draft.comment.placeholder')"
            />
          </ElFormItem>
          <ElFormItem :label="t('task.draft.tips.label')">
            <p class="text-xs text-gray-400">
              {{ t('task.draft.tips.content') }}
            </p>
          </ElFormItem>
        </ElForm>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <ElButton @click="modalApi.close()">{{ t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">{{ t('common.confirm') }}</ElButton>
    </template>
  </Modal>
</template>

<style scoped>
.operation-tabs {
  min-height: 200px;
}
</style>
