<!--
 * 在线开发平台 — 代码生成配置器
 *
 * <p>配置目标模块、包名和一键触发代码生成（后端 yydsz-generator 服务）。
 * 支持单表生成和全量生成两种模式。
 *
 * @path apps/system-web/src/views/dev-platform/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 在线开发平台 — 代码生成配置器
 * <p>通过 REST API 调用 ydsz-generator 服务触发代码生成。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElCheckbox,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTabPane,
  ElTabs,
} from 'element-plus';

/** 生成配置表单 */
const configForm = reactive({
  moduleName: 'system',
  packageName: 'com.njydsz.system',
  tablePrefix: 'ydsz_',
  tableNames: '',
  outputDir: 'D:/Code/open/ydsz-cloud',
  author: 'ydsz-team',
  generateEntity: true,
  generateRepository: true,
  generateService: true,
  generateController: true,
  generateModel: true,
});

const generating = ref(false);
const resultFiles = ref<string[]>([]);
const activeTab = ref('config');

/** 单表名（单表模式） */
const singleTableName = ref('');

/**
 * 触发单表代码生成
 */
async function handleGenerateSingle() {
  if (!singleTableName.value.trim()) {
    ElMessage.warning('请输入表名');
    return;
  }
  generating.value = true;
  resultFiles.value = [];
  try {
    const response = await fetch('/api/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: singleTableName.value.trim() }),
    });
    const data = await response.json();
    if (data && data.data) {
      resultFiles.value = data.data as string[];
      ElMessage.success(`代码生成完成，共 ${resultFiles.value.length} 个文件`);
      activeTab.value = 'result';
    } else {
      ElMessage.error(data?.message || '代码生成失败');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '代码生成请求失败';
    ElMessage.error(msg);
  } finally {
    generating.value = false;
  }
}

/**
 * 触发全量代码生成
 */
async function handleGenerateAll() {
  if (!configForm.tableNames.trim()) {
    ElMessage.warning('请输入至少一个表名');
    return;
  }
  generating.value = true;
  resultFiles.value = [];
  try {
    const response = await fetch('/api/v1/generate/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (data && data.data) {
      resultFiles.value = data.data as string[];
      ElMessage.success(`全量代码生成完成，共 ${resultFiles.value.length} 个文件`);
      activeTab.value = 'result';
    } else {
      ElMessage.error(data?.message || '全量代码生成失败');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '全量代码生成请求失败';
    ElMessage.error(msg);
  } finally {
    generating.value = false;
  }
}
</script>

<template>
  <div class="dev-platform p-4">
    <ElTabs v-model="activeTab">
      <!-- 配置 Tab -->
      <ElTabPane label="生成配置" name="config">
        <ElCard class="mt-4" shadow="hover">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="font-medium">单表代码生成</span>
            </div>
          </template>
          <ElForm label-width="120px">
            <ElFormItem label="目标表名">
              <ElInput
                v-model="singleTableName"
                placeholder="请输入表名，如 ydsz_sys_tenant"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton
                type="primary"
                :loading="generating"
                @click="handleGenerateSingle"
              >
                生成单表代码
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>

        <ElCard class="mt-4" shadow="hover">
          <template #header>
            <span class="font-medium">全量代码生成配置</span>
          </template>
          <ElForm label-width="120px">
            <ElFormItem label="模块名">
              <ElInput v-model="configForm.moduleName" placeholder="如 system、userinfo" />
            </ElFormItem>
            <ElFormItem label="包名前缀">
              <ElInput v-model="configForm.packageName" placeholder="如 com.njydsz.system" />
            </ElFormItem>
            <ElFormItem label="表名前缀">
              <ElInput v-model="configForm.tablePrefix" placeholder="如 ydz_" />
            </ElFormItem>
            <ElFormItem label="目标表名">
              <ElInput
                v-model="configForm.tableNames"
                type="textarea"
                :rows="4"
                placeholder="需要生成的表名列表，每行一个&#10;ydsz_sys_config&#10;ydsz_sys_dict_type&#10;ydsz_sys_dict_item"
              />
            </ElFormItem>
            <ElFormItem label="输出目录">
              <ElInput v-model="configForm.outputDir" placeholder="生成代码的目标目录绝对路径" />
            </ElFormItem>
            <ElFormItem label="作者">
              <ElInput v-model="configForm.author" placeholder="Javadoc 作者" />
            </ElFormItem>
            <ElFormItem label="生成层级">
              <div class="flex flex-wrap gap-4">
                <ElCheckbox v-model="configForm.generateEntity">Entity</ElCheckbox>
                <ElCheckbox v-model="configForm.generateRepository">Repository</ElCheckbox>
                <ElCheckbox v-model="configForm.generateService">Service</ElCheckbox>
                <ElCheckbox v-model="configForm.generateController">Controller</ElCheckbox>
                <ElCheckbox v-model="configForm.generateModel">VO / DTO / Query</ElCheckbox>
              </div>
            </ElFormItem>
            <ElFormItem>
              <ElButton
                type="primary"
                :loading="generating"
                @click="handleGenerateAll"
              >
                全量生成
              </ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </ElTabPane>

      <!-- 结果 Tab -->
      <ElTabPane label="生成结果" name="result">
        <ElCard class="mt-4" shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">生成结果 ({{ resultFiles.length }} 个文件)</span>
            </div>
          </template>
          <div v-if="resultFiles.length > 0" class="space-y-2">
            <div
              v-for="(file, idx) in resultFiles"
              :key="idx"
              class="flex items-center gap-2 text-sm py-1 border-b border-dashed last:border-b-0"
            >
              <span class="text-green-500">✓</span>
              <code class="text-xs text-gray-600 break-all">{{ file }}</code>
            </div>
          </div>
          <ElEmpty v-else description="暂无生成结果，请先在配置页触发代码生成" />
        </ElCard>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
.dev-platform {
  max-width: 900px;
}
</style>
