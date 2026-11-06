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
  YdButton,
  YdCard,
  YdCol,
  YdDialog,
  YdEmptyState,
  YdInput,
  YdRow,
  YdTabsContent,
  YdTabs,
  YdBadge,
  YdTree,
  YdDescriptions,
  YdDescriptionsItem,
} from '@ydsz-core/ydsz-ui';
import { computed, h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { YdConfirm } from '@ydsz-core/popup-ui';

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

const { t } = useI18n();

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
const categoryTree = computed(() => [
  { label: t('ruleTemplateCategoryAll'), value: 'all' },
  { label: t('ruleTemplateCategoryRisk'), value: 'risk' },
  { label: t('ruleTemplateCategoryMarketing'), value: 'marketing' },
  { label: t('ruleTemplateCategoryFinance'), value: 'finance' },
  { label: t('ruleTemplateCategoryCompliance'), value: 'compliance' },
]);

const industryTree = computed(() => [
  { label: t('ruleTemplateIndustryAll'), value: 'all' },
  { label: t('ruleTemplateIndustryFinance'), value: 'finance' },
  { label: t('ruleTemplateIndustryEcommerce'), value: 'ecommerce' },
  { label: t('ruleTemplateIndustryHealthcare'), value: 'healthcare' },
  { label: t('ruleTemplateIndustryManufacturing'), value: 'manufacturing' },
]);

/** ========== 模板列表 ========== */
const templateGridOptions: VxeTableGridOptions<RuleTemplateVO> = {
  columns: [
    { type: 'seq', width: 50, title: '#' },
    { field: 'templateCode', title: t('ruleTemplateColumnCode'), width: 150 },
    { field: 'templateName', title: t('ruleTemplateColumnName'), minWidth: 160 },
    {
      field: 'category',
      title: t('ruleTemplateColumnCategory'),
      width: 100,
      slots: {
        default: ({ row }) => h(YdBadge, { variant: 'primary' }, () => row.category ?? '-'),
      },
    },
    {
      field: 'industry',
      title: t('ruleTemplateColumnIndustry'),
      width: 100,
      slots: {
        default: ({ row }) => h(YdBadge, { variant: 'success' }, () => row.industry ?? '-'),
      },
    },
    { field: 'description', title: t('ruleTemplateColumnDescription'), minWidth: 160 },
    {
      field: 'createdBy',
      title: t('ruleTemplateColumnCreatedBy'),
      width: 100,
      slots: {
        default: ({ row }) => h('span', {}, row.createdBy ?? '-'),
      },
    },
    {
      field: 'createdAt',
      title: t('ruleTemplateColumnCreatedAt'),
      width: 160,
    },
    {
      field: 'action',
      title: t('ruleTemplateColumnAction'),
      width: 160,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              YdButton,
              { size: 'small', variant: 'link', onClick: () => handleImport(row) },
              () => t('ruleTemplateActionImport'),
            ),
            h(
              YdButton,
              { size: 'small', variant: 'link', onClick: () => handlePreview(row) },
              () => t('ruleTemplateActionPreview'),
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
    await YdConfirm(t('ruleTemplateImportConfirm', [row.templateName]), {
      title: t('ruleTemplateImportConfirmTitle'),
      type: 'warning',
    });
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
    <div v-loading="loading" class="p-5">
      <YdRow :gutter="12">
        <!-- 左侧类目树 -->
        <YdCol :span="5">
          <YdCard shadow="never" class="mb-3">
            <!-- 顶部搜索 -->
            <YdInput
              v-model="keyword"
              :placeholder="t('ruleTemplateSearchPlaceholder')"
              clearable
              class="mb-3"
              @keyup.enter="handleSearch"
            />
            <YdButton type="primary" size="small" class="mb-3" @click="handleSearch">
              {{ t('ruleTemplateSearch') }}
            </YdButton>
          </YdCard>

          <!-- 浏览模式 Tab -->
          <YdCard shadow="never" :header="t('ruleTemplateBrowseMode')" body-class="!p-0">
            <YdTabs v-model="activeBrowseMode" @tab-change="handleBrowseModeChange">
              <YdTabsContent :label="t('ruleTemplateBrowseByCategory')" name="category">
                <YdTree
                  :data="
                    categoryTree.map((c) => ({ label: c.label, value: c.value, isLeaf: true }))
                  "
                  node-key="value"
                  :default-expanded-keys="['all']"
                  @node-click="handleCategoryClick"
                  class="p-2"
                />
              </YdTabsContent>
              <YdTabsContent :label="t('ruleTemplateBrowseByIndustry')" name="industry">
                <YdTree
                  :data="
                    industryTree.map((c) => ({ label: c.label, value: c.value, isLeaf: true }))
                  "
                  node-key="value"
                  :default-expanded-keys="['all']"
                  @node-click="handleIndustryClick"
                  class="p-2"
                />
              </YdTabsContent>
            </YdTabs>
          </YdCard>
        </YdCol>

        <!-- 右侧模板列表 -->
        <YdCol :span="19">
          <YdCard shadow="never">
            <div class="mb-2">
              <YdButton @click="loadTemplates">{{ t('refresh') }}</YdButton>
            </div>
            <TemplateGrid />
          </YdCard>
        </YdCol>
      </YdRow>

      <!-- 预览弹窗 -->
      <YdDialog
        v-model="previewDialogVisible"
        :title="t('ruleTemplatePreviewTitle', [currentTemplate?.templateName ?? ''])"
        width="640px"
      >
        <YdDescriptions v-if="currentTemplate" :column="2" border size="small">
          <YdDescriptionsItem :label="t('ruleTemplatePreviewCode')">{{
            currentTemplate.templateCode
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewName')">{{
            currentTemplate.templateName
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewCategory')">
            <YdBadge type="primary">{{ currentTemplate.category ?? '-' }}</YdBadge>
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewIndustry')">
            <YdBadge type="success">{{ currentTemplate.industry ?? '-' }}</YdBadge>
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewDescription')" :span="2">
            {{ currentTemplate.description ?? '-' }}
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewConditionExpression')" :span="2">
            <code class="text-xs text-gray-600">{{
              currentTemplate.conditionExpression ?? '-'
            }}</code>
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewSeverityExpression')" :span="2">
            <code class="text-xs text-gray-600">{{
              currentTemplate.severityExpression ?? '-'
            }}</code>
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewDefaultSeverity')">{{
            currentTemplate.defaultSeverity ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewPriority')">{{
            currentTemplate.priority ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewScope')" :span="2">{{
            currentTemplate.scope ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewTags')">{{
            currentTemplate.tags ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplatePreviewCreatedBy')">{{
            currentTemplate.createdBy ?? '-'
          }}</YdDescriptionsItem>
        </YdDescriptions>
        <YdEmptyState v-else :description="t('ruleTemplateNoTemplateData')" />
      </YdDialog>

      <!-- 导入结果弹窗 -->
      <YdDialog
        v-model="importResultDialogVisible"
        :title="t('ruleTemplateImportResultTitle')"
        width="520px"
      >
        <YdDescriptions v-if="importResult" :column="1" border size="small">
          <YdDescriptionsItem :label="t('ruleTemplateImportRuleCode')">{{
            importResult.ruleCode
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplateImportRuleName')">{{
            importResult.ruleName
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplateImportRuleId')">{{
            importResult.id
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplateImportCategory')">{{
            importResult.category ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="t('ruleTemplateImportDescription')" :span="2">{{
            importResult.description ?? '-'
          }}</YdDescriptionsItem>
        </YdDescriptions>
        <div v-else class="text-center text-gray-400">
          {{ t('ruleTemplateNoImportData') }}
        </div>
      </YdDialog>
    </div>
  </Page>
</template>
