<!--
 * Prompt 模板测试组件
 *
 * <p>用于测试 Prompt 模板的变量填充与 LLM 执行效果。
 *
 * @path apps/agent-web/src/views/prompt/prompt-test.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Prompt 模板测试
 * <p>填入变量值后渲染最终 Prompt，并可调用 evaluate 接口对比测试。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ElButton, ElDialog, ElInput, ElMessage } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';
import { evaluate } from '#/api/prompt';

defineOptions({ name: 'PromptTest' });

/** 测试中的模板 */
interface TestTemplate {
  id: string;
  templateCode: string;
  templateName: string;
  content: string;
  variables: string[];
}

const visible = ref(false);

const template = ref<TestTemplate | null>(null);

/** 变量值表单 */
const variableValues = reactive<Record<string, string>>({});

/** 渲染后的 Prompt */
const renderedPrompt = computed<string>(() => {
  if (!template.value) return '';
  let result = template.value.content;
  Object.entries(variableValues).forEach(([key, value]) => {
    result = result.replaceAll(`{{${key}}}`, value || `{{${key}}}`);
  });
  return result;
});

/** 评估结果 */
const evaluateResult = ref<unknown>(null);
const evaluating = ref(false);

/** 打开弹窗 */
function open(row: Record<string, unknown>): void {
  template.value = row as unknown as TestTemplate;
  Object.keys(variableValues).forEach((k) => delete variableValues[k]);
  (row.variables as string[] | undefined)?.forEach((v: string) => {
    variableValues[v] = '';
  });
  evaluateResult.value = null;
  visible.value = true;
}

function close(): void {
  visible.value = false;
  template.value = null;
}

/** 执行评估 */
async function handleEvaluate(): Promise<void> {
  if (!template.value?.templateCode) return;
  evaluating.value = true;
  try {
    evaluateResult.value = await evaluate({
      promptCode: template.value.templateCode,
      variables: { ...variableValues },
    });
    ElMessage.success('评估完成');
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    evaluating.value = false;
  }
}

watch(visible, (val) => {
  if (!val) template.value = null;
});

defineExpose({ open, close });
</script>

<template>
  <ElDialog v-model="visible" title="Prompt 模板测试" width="700px" :close-on-click-modal="false" @close="close">
    <div v-if="template" class="space-y-4">
      <!-- 变量填写 -->
      <div>
        <p class="mb-2 text-sm font-medium">变量填写</p>
        <div v-for="(value, key) in variableValues" :key="key" class="mb-2 flex items-center gap-2">
          <span class="w-32 shrink-0 text-right text-xs text-gray-500">{{ '{{' }}{{ key }}{{ '}}' }}</span>
          <ElInput v-model="variableValues[key]" size="small" placeholder="输入变量值" />
        </div>
        <p v-if="Object.keys(variableValues).length === 0" class="text-xs text-gray-400">该模板没有变量</p>
      </div>

      <!-- 渲染结果 -->
      <div>
        <p class="mb-2 text-sm font-medium">渲染结果预览</p>
        <pre class="max-h-64 overflow-auto whitespace-pre-wrap rounded border bg-gray-50 p-3 text-xs">{{ renderedPrompt }}</pre>
      </div>

      <!-- 评估结果 -->
      <div v-if="evaluateResult !== null">
        <p class="mb-2 text-sm font-medium">评估结果</p>
        <pre class="max-h-48 overflow-auto whitespace-pre-wrap rounded border bg-blue-50 p-3 text-xs">{{ JSON.stringify(evaluateResult, null, 2) }}</pre>
      </div>
    </div>

    <template #footer>
      <ElButton @click="close">关闭</ElButton>
      <ElButton type="primary" :loading="evaluating" @click="handleEvaluate">执行评估</ElButton>
    </template>
  </ElDialog>
</template>
