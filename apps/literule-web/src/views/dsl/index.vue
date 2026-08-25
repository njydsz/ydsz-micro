<!--
 * 规则 DSL 工具页面
 *
 * @path apps\literule-web\src\views\dsl\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则 DSL（工具页）
 * <p>DSL 输入/校验/解析/预览工具页，数据来自后端契约 API（apps/literule-web/src/api/ruleDsl.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import { ElButton, ElInput, ElMessage, ElTag } from 'element-plus';
import { ref } from 'vue';
import { parse, preview, validate } from '#/api/ruleDsl';
import { formatJsonResult } from '#/utils/format';
defineOptions({ name: 'DslManagement' });
const dslText = ref('');
const resultText = ref('');
const actionLabel = ref('');
const running = ref(false);
/** 执行一次 DSL 动作并展示返回结果 */
async function runAction(fn: () => Promise<unknown>, label: string) {
  if (!dslText.value.trim()) {
    ElMessage.warning('请先输入 DSL 内容');
    return;
  }
  running.value = true;
  actionLabel.value = label;
  try {
    const data = await fn();
    resultText.value = formatJsonResult(data);
  } finally {
    running.value = false;
  }
}
/** DSL 校验 */
function handleValidate() {
  void runAction(() => validate({ dsl: dslText.value }), '校验');
}
/** DSL 解析 */
function handleParse() {
  void runAction(() => parse({ dsl: dslText.value }), '解析');
}
/** DSL 预览 */
function handlePreview() {
  void runAction(() => preview({ dsl: dslText.value }), '预览');
}
</script>
<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3 p-4">
      <span class="text-sm text-gray-500">输入 DSL 内容，可执行校验 / 解析 / 预览操作：</span>
      <ElInput
        v-model="dslText"
        type="textarea"
        :rows="12"
        placeholder="请输入 DSL 内容…"
        resize="vertical"
      />
      <div class="flex gap-2">
        <ElButton type="primary" :loading="running" @click="handleValidate">校验</ElButton>
        <ElButton type="success" :loading="running" @click="handleParse">解析</ElButton>
        <ElButton type="warning" :loading="running" @click="handlePreview">预览</ElButton>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">结果：</span>
        <ElTag v-if="actionLabel" size="small" type="info">{{ actionLabel }}</ElTag>
      </div>
      <pre class="min-h-0 flex-1 overflow-auto rounded border border-gray-300 bg-gray-50 p-3 text-xs">{{ resultText }}</pre>
    </div>
  </Page>
</template>