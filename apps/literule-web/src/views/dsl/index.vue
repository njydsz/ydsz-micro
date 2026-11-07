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
import { useI18n } from 'vue-i18n';
import { YdBadge, YdButton } from '@ydsz-core/ydsz-ui';
import { ref } from 'vue';

import { showToast } from '@ydsz/notification';

import { parse, preview, validate } from '#/api/ruleDsl';
import { formatJsonResult } from '#/utils/format';

import DslEditor from './components/DslEditor.vue';

const { t } = useI18n();

defineOptions({ name: 'DslManagement' });

const dslText = ref('');
const resultText = ref('');
const actionLabel = ref('');
const running = ref(false);
/** 执行一次 DSL 动作并展示返回结果 */
async function runAction(fn: () => Promise<unknown>, label: string) {
  if (!dslText.value.trim()) {
    showToast.warning(t('business.dslWarning'));
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
  void runAction(() => validate({ dsl: dslText.value }), t('business.validate'));
}
/** DSL 解析 */
function handleParse() {
  void runAction(() => parse({ dsl: dslText.value }), t('business.parse'));
}
/** DSL 预览 */
function handlePreview() {
  void runAction(() => preview({ dsl: dslText.value }), t('business.previewButton'));
}
</script>
<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3 p-5">
      <span class="text-sm text-gray-500">{{ t('business.dslHint') }}</span>
      <div class="min-h-0 flex-1">
        <DslEditor v-model="dslText" :placeholder="t('business.dslPlaceholder')" />
      </div>
      <div class="flex gap-2">
        <YdButton :loading="running" @click="handleValidate">{{ t('business.validate') }}</YdButton>
        <YdButton :loading="running" @click="handleParse">{{ t('business.parse') }}</YdButton>
        <YdButton variant="destructive" :loading="running" @click="handlePreview">
          {{ t('business.previewButton') }}
        </YdButton>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">{{ t('business.resultLabel') }}</span>
        <YdBadge v-if="actionLabel" variant="secondary">{{ actionLabel }}</YdBadge>
      </div>
      <pre
        class="max-h-60 min-h-0 flex-1 overflow-auto rounded border border-gray-300 bg-gray-50 p-3 text-xs"
        >{{ resultText }}</pre>
    </div>
  </Page>
</template>
