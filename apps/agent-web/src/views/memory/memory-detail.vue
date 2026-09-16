<!--
 * 记忆详情/编辑弹窗组件
 *
 * <p>用于展示单条记忆消息的详情信息或写入新记忆。
 *
 * @path apps/agent-web/src/views/memory/memory-detail.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 记忆详情弹窗
 * <p>支持查看记忆详情和写入新记忆两种模式，由父组件通过 open() 传入参数控制。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { FormInstance } from 'element-plus';
import { ElDialog, ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import { saveMemory } from '#/api/memory';
import type { MemoryVO } from '#/api/memory';

const logger = createLogger('agent-memory-detail');

/** 弹窗模式 */
type DetailMode = 'view' | 'edit';

/** 弹窗可见性 */
const isVisible = ref(false);

/** 当前模式 */
const mode = ref<DetailMode>('view');

/** 当前对话 ID */
const conversationId = ref('');

/** 当前记忆数据（查看模式） */
const memoryData = ref<MemoryVO | null>(null);

/** 表单引用 */
const formRef = ref<FormInstance>();

/** 提交中 */
const isSubmitting = ref(false);

/** 写入模式表单数据 */
const form = reactive({
  role: 'USER' as string,
  content: '',
  toolCallId: '',
});

/** 可选角色列表 */
const roleOptions = [
  { label: '用户 (USER)', value: 'USER' },
  { label: '助手 (ASSISTANT)', value: 'ASSISTANT' },
  { label: '系统 (SYSTEM)', value: 'SYSTEM' },
  { label: '工具 (TOOL)', value: 'TOOL' },
];

/** 表单校验规则 */
const formRules = {
  role: [{ required: true, message: '请选择消息角色', trigger: 'change' }],
  content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }],
};

/**
 * 打开弹窗
 *
 * @param params 打开参数（mode + 数据）
 */
function open(params: {
  mode: DetailMode;
  record?: MemoryVO;
  convId?: string;
}): void {
  mode.value = params.mode;
  conversationId.value = params.convId ?? params.record?.conversationId ?? '';
  memoryData.value = params.record ?? null;

  if (params.mode === 'edit') {
    form.role = 'USER';
    form.content = '';
    form.toolCallId = '';
  }

  isVisible.value = true;
}

/** 关闭弹窗 */
function handleClose(): void {
  isVisible.value = false;
  memoryData.value = null;
  conversationId.value = '';
}

/** 提交写入 */
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return;

  await formRef.value.validate(async (isValid: boolean) => {
    if (!isValid) return;
    if (!conversationId.value.trim()) {
      showToast.warning('对话 ID 不能为空');
      return;
    }

    isSubmitting.value = true;
    try {
      await saveMemory({
        conversationId: conversationId.value.trim(),
        data: {
          role: form.role,
          content: form.content,
          toolCallId: form.toolCallId || undefined,
        },
      });
      showToast.success('记忆写入成功');
      handleClose();
    } catch (error) {
      logger.warn('保存记忆失败: {}', error);
    } finally {
      isSubmitting.value = false;
    }
  });
}

/** 弹窗标题 */
const dialogTitle = ref('');
onMounted(() => {
  dialogTitle.value = mode.value === 'view' ? '记忆详情' : '写入记忆';
});

defineExpose({ open });
</script>

<template>
  <ElDialog
    v-model="isVisible"
    :title="mode === 'view' ? '记忆详情' : '写入记忆'"
    width="640px"
    @close="handleClose"
  >
    <!-- 查看模式 -->
    <div v-if="mode === 'view' && memoryData" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-sm text-gray-500">消息 ID:</span>
          <p class="mt-1 text-sm font-medium">{{ memoryData.id ?? '-' }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">角色:</span>
          <p class="mt-1 text-sm font-medium">{{ memoryData.role ?? '-' }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">对话 ID:</span>
          <p class="mt-1 text-sm font-medium">{{ memoryData.conversationId ?? '-' }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">创建时间:</span>
          <p class="mt-1 text-sm font-medium">{{ memoryData.createdAt ?? '-' }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">ToolCall ID:</span>
          <p class="mt-1 text-sm font-medium">{{ memoryData.toolCallId ?? '-' }}</p>
        </div>
      </div>
      <div>
        <span class="text-sm text-gray-500">消息内容:</span>
        <div class="mt-1 max-h-[300px] overflow-auto rounded border bg-gray-50 p-3 text-sm">
          {{ memoryData.content ?? '-' }}
        </div>
      </div>
    </div>

    <!-- 写入模式 -->
    <ElForm
      v-else
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
    >
      <ElFormItem label="对话 ID">
        <ElInput v-model="conversationId" placeholder="对话 ID" :disabled="true" />
      </ElFormItem>
      <ElFormItem label="消息角色" prop="role">
        <ElSelect v-model="form.role" placeholder="请选择消息角色" style="width: 100%">
          <ElOption
            v-for="item in roleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="消息内容" prop="content">
        <ElInput
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="请输入消息内容"
          maxlength="8000"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem label="ToolCall ID">
        <ElInput v-model="form.toolCallId" placeholder="Tool 角色时请填写 ToolCall ID" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton v-if="mode === 'edit'" type="primary" :loading="isSubmitting" @click="handleSubmit">保存</ElButton>
      <ElButton v-else @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>
