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

import { ElButton, ElCard, ElEmpty, ElForm, ElFormItem, ElInput, ElOption, ElRadioButton, ElRadioGroup, ElSelect } from 'element-plus';

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
      showToast.warning('请输入源文件路径');
      return false;
    }
  } else {
    if (!reverseForm.sourceDirPath.trim()) {
      showToast.warning('请输入源目录路径');
      return false;
    }
  }
  if (!selectedGroupId.value) {
    showToast.warning('请选择模板分组');
    return false;
  }
  if (!reverseForm.outputDir.trim()) {
    showToast.warning('请配置输出目录');
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
      showToast.success('分析完成');
    } else {
      const results = await analyzeBatchReverse({
        sourceDirPath: reverseForm.sourceDirPath,
        templateGroupId: selectedGroupId.value!,
        outputDir: reverseForm.outputDir,
      });
      batchResults.value = results;
      showToast.success(`批量分析完成，共 ${results.length} 条结果`);
    }
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : '分析失败，请检查参数与网络';
    showToast.error(msg);
  } finally {
    isAnalyzing.value = false;
  }
}
</script>

<template>
  <div class="reverse-gen p-4">
    <ElCard shadow="hover">
      <template #header>
        <span class="font-medium">反向生成配置</span>
      </template>
      <ElForm label-width="120px">
        <ElFormItem label="分析模式">
          <ElRadioGroup v-model="mode">
            <ElRadioButton label="single">单文件分析</ElRadioButton>
            <ElRadioButton label="batch">批量目录分析</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem v-if="mode === 'single'" label="源文件路径">
          <ElInput
            v-model="reverseForm.sourceFilePath"
            placeholder="Java 源文件绝对路径，如 D:/src/User.java"
          />
        </ElFormItem>

        <ElFormItem v-else label="源目录路径">
          <ElInput
            v-model="reverseForm.sourceDirPath"
            placeholder="待分析目录绝对路径，如 D:/src/entity"
          />
        </ElFormItem>

        <ElFormItem label="模板分组">
          <ElSelect
            v-model="selectedGroupId"
            placeholder="选择模板分组"
            style="width: 100%"
          >
            <ElOption
              v-for="group in groupList"
              :key="group.id"
              :label="`${group.name}${group.isActive ? ' (当前激活)' : ''}`"
              :value="group.id"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="输出目录">
          <ElInput
            v-model="reverseForm.outputDir"
            placeholder="分析结果输出目录绝对路径"
          />
        </ElFormItem>

        <ElFormItem>
          <ElButton
            type="primary"
            :loading="isAnalyzing"
            @click="handleAnalyze"
          >
            开始分析
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 分析结果 -->
    <ElCard class="mt-4" shadow="hover">
      <template #header>
        <span class="font-medium">分析结果</span>
      </template>

      <!-- 单文件结果 -->
      <ElInput
        v-if="mode === 'single' && resultContent"
        v-model="resultContent"
        :rows="20"
        readonly
        type="textarea"
        placeholder="分析结果将在此展示"
      />

      <!-- 批量结果列表 -->
      <div v-else-if="mode === 'batch' && batchResults.length > 0" class="space-y-4">
        <ElCard
          v-for="(item, idx) in batchResults"
          :key="idx"
          shadow="never"
          class="batch-result-card"
        >
          <template #header>
            <span class="text-sm font-medium">结果 #{{ idx + 1 }}</span>
          </template>
          <ElInput
            :model-value="item"
            :rows="10"
            readonly
            type="textarea"
          />
        </ElCard>
      </div>

      <!-- 空状态 -->
      <ElEmpty
        v-if="
          !isAnalyzing
          && ((mode === 'single' && !resultContent)
            || (mode === 'batch' && batchResults.length === 0))
        "
        description="暂无分析结果"
      />
    </ElCard>
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
