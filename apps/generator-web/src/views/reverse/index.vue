<!--
 * 反向生成（主面板）
 *
 * <p>选择单个 Java 源文件或目录进行反向分析，
 * 配合模板组生成对应代码，支持单文件和批量两种模式。
 *
 * @path apps/generator-web/src/views/reverse/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 反向生成主面板。
 *
 * <p>选择源文件/目录 + 模板分组 + 输出目录，
 * 调用后端 ReverseController 进行反向分析并展示结果。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { reactive, ref } from 'vue';
import { $t } from '@ydsz/locales';

import { YdButton, YdCard, YdCardContent, YdCardHeader, YdCardTitle, YdInput, YdRadioGroup, YdRadioGroupItem, YdSelectBase, YdSelectContentBase, YdSelectItemBase, YdSelectTriggerBase, YdSelectValueBase, YdEmptyState, YdForm, YdFormItem } from '@ydsz-core/ydsz-ui';

import { showToast } from '@ydsz/notification';

import { analyzeReverse, analyzeBatchReverse } from '#/api/reverse';
import type { GenTemplateGroup } from '#/api/models';
import { getActiveGroup, listGroups } from '#/api/template';

// ══════ 分析模式 ══════

/** 模式：single = 单文件，batch = 批量目录 */
const mode = ref<'single' | 'batch'>('single');

// ══════ 模板分组 ══════

const groupList = ref<GenTemplateGroup[]>([]);
const selectedGroupId = ref<number | undefined>(undefined);

// ══════ 分析参数 ══════

const reverseForm = reactive<{
  sourceFilePath: string;
  sourceDirPath: string;
  outputDir: string;
}>({
  sourceFilePath: '',
  sourceDirPath: '',
  outputDir: 'D:/Code/open/ydsz-cloud',
});

// ══════ 分析结果 ══════

const isAnalyzing = ref(false);
const resultContent = ref('');
const batchResults = ref<string[]>([]);

// ══════ 数据加载 ══════

async function loadGroups() {
  groupList.value = await listGroups();
  try {
    const activeGroup = await getActiveGroup();
    if (activeGroup?.id) {
      selectedGroupId.value = activeGroup.id;
    }
  } catch {
    if (groupList.value.length === 1) {
      selectedGroupId.value = groupList.value[0]?.id;
    }
  }
}

// 初始化加载
void loadGroups();

// ══════ 操作 ══════

/** 校验必要参数 */
function validateForm(): boolean {
  if (mode.value === 'single') {
    if (!reverseForm.sourceFilePath.trim()) {
      showToast.warning($t('page.reverse.sourceRequired'));
      return false;
    }
  } else {
    if (!reverseForm.sourceDirPath.trim()) {
      showToast.warning($t('page.reverse.sourceDirRequired'));
      return false;
    }
  }
  if (!selectedGroupId.value) {
    showToast.warning($t('page.codeGen.selectTemplateGroup'));
    return false;
  }
  if (!reverseForm.outputDir.trim()) {
    showToast.warning($t('page.codeGen.outputDirRequired'));
    return false;
  }
  return true;
}

/** 执行反向分析 */
async function handleAnalyze() {
  if (!validateForm()) return;
  isAnalyzing.value = true;
  resultContent.value = '';
  batchResults.value = [];
  try {
    if (mode.value === 'single') {
      const result = await analyzeReverse({
        sourceFilePath: reverseForm.sourceFilePath,
        templateGroupId: selectedGroupId.value!,
        outputDir: reverseForm.outputDir,
      });
      resultContent.value = result;
      showToast.success($t('page.reverse.analyzeDone'));
    } else {
      const results = await analyzeBatchReverse({
        sourceDirPath: reverseForm.sourceDirPath,
        templateGroupId: selectedGroupId.value!,
        outputDir: reverseForm.outputDir,
      });
      batchResults.value = results;
      showToast.success($t('page.reverse.batchDone', { count: results.length }));
    }
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : $t('page.reverse.analyzeFailed');
    showToast.error(msg);
  } finally {
    isAnalyzing.value = false;
  }
}
</script>

<template>
  <div class="reverse-gen p-5">
    <YdCard>
      <YdCardHeader>
        <YdCardTitle>{{ $t('page.reverse.cardConfig') }}</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
        <YdForm label-width="120px">
          <YdFormItem :label="$t('page.reverse.modeLabel')">
            <YdRadioGroup v-model="mode">
              <div class="flex items-center gap-5">
                <div class="flex items-center gap-2">
                  <YdRadioGroupItem id="mode-single" value="single" />
                  <label for="mode-single" class="cursor-pointer text-sm">{{ $t('page.reverse.modeSingle') }}</label>
                </div>
                <div class="flex items-center gap-2">
                  <YdRadioGroupItem id="mode-batch" value="batch" />
                  <label for="mode-batch" class="cursor-pointer text-sm">{{ $t('page.reverse.modeBatch') }}</label>
                </div>
              </div>
            </YdRadioGroup>
          </YdFormItem>

          <YdFormItem v-if="mode === 'single'" :label="$t('page.reverse.sourceFileLabel')">
            <YdInput
              v-model="reverseForm.sourceFilePath"
              :placeholder="$t('page.reverse.sourceFilePlaceholder')"
            />
          </YdFormItem>

          <YdFormItem v-else :label="$t('page.reverse.sourceDirLabel')">
            <YdInput
              v-model="reverseForm.sourceDirPath"
              :placeholder="$t('page.reverse.sourceDirPlaceholder')"
            />
          </YdFormItem>

          <YdFormItem :label="$t('business.templateGroup')">
            <YdSelectBase v-model="selectedGroupId">
              <YdSelectTriggerBase>
                <YdSelectValueBase :placeholder="$t('page.codeGen.selectTemplateGroupPlaceholder')" />
              </YdSelectTriggerBase>
              <YdSelectContentBase>
                <YdSelectItemBase
                  v-for="group in groupList"
                  :key="group.id"
                  :value="String(group.id)"
                >
                  {{ group.name }}{{ group.isActive ? $t('page.codeGen.currentActive') : '' }}
                </YdSelectItemBase>
              </YdSelectContentBase>
            </YdSelectBase>
          </YdFormItem>

          <YdFormItem :label="$t('page.codeGen.outputDir')">
            <YdInput
              v-model="reverseForm.outputDir"
              :placeholder="$t('page.reverse.outputDirPlaceholder')"
            />
          </YdFormItem>

          <YdFormItem>
            <YdButton
              :loading="isAnalyzing"
              @click="handleAnalyze"
            >
              {{ $t('page.reverse.startAnalyze') }}
            </YdButton>
          </YdFormItem>
        </YdForm>
      </YdCardContent>
    </YdCard>

    <!-- 分析结果 -->
    <YdCard class="mt-4">
      <YdCardHeader>
        <YdCardTitle>{{ $t('page.reverse.cardResult') }}</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
        <!-- 单文件结果 -->
        <YdInput
          v-if="mode === 'single' && resultContent"
          v-model="resultContent"
          :rows="20"
          readonly
          type="textarea"
          :placeholder="$t('page.reverse.resultPlaceholder')"
        />

        <!-- 批量结果列表 -->
        <div v-else-if="mode === 'batch' && batchResults.length > 0" class="space-y-4">
          <YdCard
            v-for="(item, idx) in batchResults"
            :key="idx"
            class="batch-result-card"
          >
            <YdCardHeader>
              <span class="text-sm font-medium">{{ $t('page.reverse.resultItem', { index: idx + 1 }) }}</span>
            </YdCardHeader>
            <YdCardContent>
              <YdInput
                :model-value="item"
                :rows="10"
                readonly
                type="textarea"
              />
            </YdCardContent>
          </YdCard>
        </div>

        <!-- 空状态 -->
        <YdEmptyState
          v-if="
            !isAnalyzing
            && ((mode === 'single' && !resultContent)
              || (mode === 'batch' && batchResults.length === 0))
          "
          :description="$t('page.reverse.noResult')"
        />
      </YdCardContent>
    </YdCard>
  </div>
</template>

<style scoped>
.reverse-gen {
  max-width: 1000px;
}

.batch-result-card {
  border-color: #e5e7eb;
  background: #fafafa;
}
</style>
