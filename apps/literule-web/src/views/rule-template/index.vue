<!--
 * 规则模板管理页面
 *
 * @path apps\literule-web\src\views\rule-template\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则模板市场（分类/行业浏览与导入）
 * <p>消费后端契约 RuleTemplateController（apps/literule-web/src/api/ruleTemplate.ts）：
 * listTemplates() / listTemplatesByCategory() / listTemplatesByIndustry() /
 * importTemplate() 全量端点。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import {
  ElButton,
  ElCard,
  ElCol,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElInput,
  ElMessageBox,
  ElRow,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTree,
} from 'element-plus';
import { h, onMounted, ref } from 'vue';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { createLogger } from '@ydsz-core/shared/utils';

import type { RuleDefinitionVO, RuleTemplateVO } from '#/api/models';
import {
  importTemplate,
  listTemplates,
  listTemplatesByCategory,
  listTemplatesByIndustry,
} from '#/api/ruleTemplate';

const logger = createLogger('literule-rule-template');

defineOptions({ name: 'RuleTemplateManagement' });

/** ========== 状态 ========== */
const loading = ref(false);
const templateList = ref<RuleTemplateVO[]>([]);
const activeBrowseMode = ref<'category' | 'industry'>('category');
const activeCategory = ref('all');
const activeIndustry = ref('all');
const keyword = ref('');
const previewDialogVisible = ref(false);
const importResultDialogVisible = ref(false);
const currentTemplate = ref<RuleTemplateVO | null>(null);
const importResult = ref<RuleDefinitionVO | null>(null);

/** 类目树（静态硬编码，实际可从后端加载） */
const categoryTree = ref([
  { label: '全部分类', value: 'all' },
  { label: '风控规则', value: 'risk' },
  { label: '营销规则', value: 'marketing' },
  { label: '财务规则', value: 'finance' },
  { label: '合规规则', value: 'compliance' },
]);

const industryTree = ref([
  { label: '全部行业', value: 'all' },
  { label: '金融', value: 'finance' },
  { label: '电商', value: 'ecommerce' },
  { label: '医疗', value: 'healthcare' },
  { label: '制造', value: 'manufacturing' },
]);

/** ========== 模板列表 ========== */
const templateGridOptions: VxeTableGridOptions<RuleTemplateVO> = {
  columns: [
    { type: 'seq', width: 50, title: '#' },
    { field: 'templateCode', title: '模板编码', width: 150 },
    { field: 'templateName', title: '模板名称', minWidth: 160 },
    {
      field: 'category',
      title: '分类',
      width: 100,
      slots: {
        default: ({ row }) => h(ElTag, { type: 'primary' }, () => row.category ?? '-'),
      },
    },
    {
      field: 'industry',
      title: '行业',
      width: 100,
      slots: {
        default: ({ row }) => h(ElTag, { type: 'success' }, () => row.industry ?? '-'),
      },
    },
    { field: 'description', title: '描述', minWidth: 160 },
    {
      field: 'createdBy',
      title: '创建人',
      width: 100,
      slots: {
        default: ({ row }) => h('span', {}, row.createdBy ?? '-'),
      },
    },
    {
      field: 'createdAt',
      title: '创建时间',
      width: 160,
    },
    {
      field: 'action',
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'success', onClick: () => handleImport(row) },
              () => '导入',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handlePreview(row) },
              () => '预览',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => ({ items: templateList.value, total: templateList.value.length }),
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [TemplateGrid] = useYDSZVxeGrid({ gridOptions: templateGridOptions });

/** ========== 数据加载 ========== */
async function loadTemplates(): Promise<void> {
  loading.value = true;
  try {
    if (activeBrowseMode.value === 'category') {
      if (activeCategory.value === 'all') {
        templateList.value = await listTemplates();
      } else {
        templateList.value = await listTemplatesByCategory({ category: activeCategory.value });
      }
    } else {
      if (activeIndustry.value === 'all') {
        templateList.value = await listTemplates();
      } else {
        templateList.value = await listTemplatesByIndustry({ industry: activeIndustry.value });
      }
    }
    // 前端关键字过滤
    if (keyword.value.trim()) {
      const kw = keyword.value.trim().toLowerCase();
      templateList.value = templateList.value.filter(
        (tpl) =>
          tpl.templateCode?.toLowerCase().includes(kw) ||
          tpl.templateName?.toLowerCase().includes(kw) ||
          tpl.description?.toLowerCase().includes(kw),
      );
    }
  } catch (error) {
    logger.warn('加载模板列表失败: {}', error);
  } finally {
    loading.value = false;
  }
}

/** ========== 类目选择 ========== */
function handleCategoryClick(data: { value: string }): void {
  activeCategory.value = data.value;
  void loadTemplates();
}

function handleIndustryClick(data: { value: string }): void {
  activeIndustry.value = data.value;
  void loadTemplates();
}

function handleBrowseModeChange(): void {
  void loadTemplates();
}

function handleSearch(): Promise<void> {
  return loadTemplates();
}

/** ========== 操作回调 ========== */
function handlePreview(row: RuleTemplateVO): void {
  currentTemplate.value = row;
  previewDialogVisible.value = true;
}

async function handleImport(row: RuleTemplateVO): Promise<void> {
  if (!row.templateCode) return;
  try {
    await ElMessageBox.confirm(
      `确认导入模板 "${row.templateName}"？将基于模板创建新规则。`,
      '导入确认',
      { type: 'warning' },
    );
  } catch {
    logger.debug('用户取消导入模板');
    return;
  }
  try {
    importResult.value = await importTemplate({ templateCode: row.templateCode });
    importResultDialogVisible.value = true;
    await loadTemplates();
  } catch (error) {
    logger.warn('导入模板失败: {}', error);
  }
}

onMounted(() => {
  void loadTemplates();
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-4">
      <ElRow :gutter="12">
        <!-- 左侧类目树 -->
        <ElCol :span="5">
          <ElCard shadow="never" class="mb-3">
            <!-- 顶部搜索 -->
            <ElInput
              v-model="keyword"
              placeholder="搜索模板编码/名称"
              clearable
              class="mb-3"
              @keyup.enter="handleSearch"
            />
            <ElButton type="primary" size="small" class="mb-3" @click="handleSearch">搜索</ElButton>
          </ElCard>

          <!-- 浏览模式 Tab -->
          <ElCard shadow="never" header="浏览方式" body-class="!p-0">
            <ElTabs v-model="activeBrowseMode" @tab-change="handleBrowseModeChange">
              <ElTabPane label="按分类" name="category">
                <ElTree
                  :data="categoryTree.map((c) => ({ label: c.label, value: c.value, isLeaf: true }))"
                  node-key="value"
                  :default-expanded-keys="['all']"
                  @node-click="handleCategoryClick"
                  class="p-2"
                />
              </ElTabPane>
              <ElTabPane label="按行业" name="industry">
                <ElTree
                  :data="industryTree.map((c) => ({ label: c.label, value: c.value, isLeaf: true }))"
                  node-key="value"
                  :default-expanded-keys="['all']"
                  @node-click="handleIndustryClick"
                  class="p-2"
                />
              </ElTabPane>
            </ElTabs>
          </ElCard>
        </ElCol>

        <!-- 右侧模板列表 -->
        <ElCol :span="19">
          <ElCard shadow="never">
            <div class="mb-2">
              <ElButton @click="loadTemplates">刷新</ElButton>
            </div>
            <TemplateGrid />
          </ElCard>
        </ElCol>
      </ElRow>

      <!-- 预览弹窗 -->
      <ElDialog
        v-model="previewDialogVisible"
        :title="`模板预览 - ${currentTemplate?.templateName ?? ''}`"
        width="640px"
      >
        <ElDescriptions v-if="currentTemplate" :column="2" border size="small">
          <ElDescriptionsItem label="模板编码">{{ currentTemplate.templateCode }}</ElDescriptionsItem>
          <ElDescriptionsItem label="模板名称">{{ currentTemplate.templateName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="分类">
            <ElTag type="primary">{{ currentTemplate.category ?? '-' }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="行业">
            <ElTag type="success">{{ currentTemplate.industry ?? '-' }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="描述" :span="2">
            {{ currentTemplate.description ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="预置条件表达式" :span="2">
            <code class="text-xs text-gray-600">{{ currentTemplate.conditionExpression ?? '-' }}</code>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="预置严重度表达式" :span="2">
            <code class="text-xs text-gray-600">{{ currentTemplate.severityExpression ?? '-' }}</code>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="默认严重度">{{ currentTemplate.defaultSeverity ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="优先级">{{ currentTemplate.priority ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="适用范围" :span="2">{{ currentTemplate.scope ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="标签">{{ currentTemplate.tags ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="创建人">{{ currentTemplate.createdBy ?? '-' }}</ElDescriptionsItem>
        </ElDescriptions>
        <ElEmpty v-else description="暂无模板数据" />
      </ElDialog>

      <!-- 导入结果弹窗 -->
      <ElDialog
        v-model="importResultDialogVisible"
        title="导入结果"
        width="520px"
      >
        <ElDescriptions v-if="importResult" :column="1" border size="small">
          <ElDescriptionsItem label="规则编码">{{ importResult.ruleCode }}</ElDescriptionsItem>
          <ElDescriptionsItem label="规则名称">{{ importResult.ruleName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="规则ID">{{ importResult.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="分类">{{ importResult.category ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="描述" :span="2">{{ importResult.description ?? '-' }}</ElDescriptionsItem>
        </ElDescriptions>
        <div v-else class="text-center text-gray-400">暂无导入数据</div>
      </ElDialog>
    </div>
  </Page>
</template>
