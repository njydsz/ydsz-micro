<!--
 * 规则定义管理列表页面
 *
 * 视图模式：卡片视图（默认）/ 表格视图 可切换。
 *  - 卡片视图：YdDomainFilterPanel (分类筛选) + YdCardGrid + YdEntityCard，承载规则可视化展示；
 *  - 表格视图：VxeTable，保持原有兼容视图。
 *
 * @path apps\literule-web\src\views\rule\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则定义（列表页）
 * <p>规则定义列表页，数据来自后端契约 API（apps/literule-web/src/api/ruleAdmin.ts）。
 * <p>支持新增/编辑、启停、删除、版本历史与回滚。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { CategoryNodeVO, RuleDefinitionVO, RuleVersionVO } from '#/api/models';
import type { DomainItem } from '@ydsz-core/shadcn-ui';
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { YdCardGrid, YdDomainFilterPanel, YdEmptyState, YdEntityCard, YdStatusBadge } from '@ydsz-core/shadcn-ui';
import { Page, useYdModal } from '@ydsz/common-ui';
// TODO: EP → shadcn-ui 迁移暂缓（含 Drawer/Dropdown/Table 等复杂组件，需人工评估）
import { ElButton, ElDrawer, ElDropdown, ElDropdownItem, ElDropdownMenu, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { computed, h, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { createLogger } from '@ydsz-core/shared/utils';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { list, listVersions, rollback, toggle } from '#/api/ruleAdmin';
import { categoryTree } from '#/api/ruleCategory';
import { deleteRule } from '#/api/ruleBatch';

const logger = createLogger('literule-rule');
const { t } = useI18n();
import RuleForm from './rule-form.vue';
import RuleChainDesigner from './components/RuleChainDesigner.vue';

defineOptions({ name: 'RuleManagement' });

type ViewMode = 'card' | 'table';
const viewMode = ref<ViewMode>('card');

/** 卡片视图数据源 */
const ruleList = ref<RuleDefinitionVO[]>([]);
const cardLoading = ref<boolean>(false);
const selectedCategory = ref<string>('all');

/** 分类树（用于左侧面板） */
const categoryTreeData = ref<CategoryNodeVO>({});

/** 从规则列表提取分类（提取去重后的 categoryPath 顶层作为 YdDomainFilterPanel 项） */
const categoryItems = computed<DomainItem[]>(() => {
  const categoryMap = new Map<string, number>();
  for (const rule of ruleList.value) {
    const category = rule.category || rule.categoryPath?.split('/')?.[0] || '未分类';
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
  }
  const items: DomainItem[] = [];
  categoryMap.forEach((count, name) => {
    items.push({ code: name, count, name });
  });
  return items;
});

/** 按选中的分类过滤规则 */
const filteredRules = computed<RuleDefinitionVO[]>(() => {
  if (selectedCategory.value === 'all') {
    return ruleList.value;
  }
  return ruleList.value.filter((rule) => {
    const category = rule.category || rule.categoryPath?.split('/')?.[0] || '未分类';
    return category === selectedCategory.value;
  });
});

const gridOptions: VxeTableGridOptions<RuleDefinitionVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'ruleCode', title: '规则编码', width: 150 },
    { field: 'ruleName', title: '规则名称', width: 180 },
    { field: 'category', title: '分类', width: 110 },
    { field: 'priority', title: '优先级', width: 80 },
    { field: 'version', title: '版本', width: 80 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: statusTagType(row.status) }, () => row.status ?? '-'),
      },
    },
    {
      field: 'isEnabled',
      title: '启用',
      width: 80,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.isEnabled ? 'success' : 'info' }, () =>
            row.isEnabled ? '启用' : '停用',
          ),
      },
    },
    { field: 'createdAt', title: '创建时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 280,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) }, () => '编辑'),
            h(ElButton, { size: 'small', link: true, type: 'success', onClick: () => handleDesign(row) }, () => '编排'),
            h(ElButton, {
              size: 'small', link: true, type: row.isEnabled ? 'warning' : 'success',
              onClick: () => handleToggle(row),
            }, () => (row.isEnabled ? '停用' : '启用')),
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => openVersions(row) }, () => '版本'),
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除'),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const res = await list({
          pageQuery: { pageNum: page.currentPage, pageSize: page.pageSize },
        });
        return { items: res.data ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'ruleName', title: '规则名称', itemRender: { name: 'Input', props: { placeholder: '请输入规则名称' } } },
      { field: 'ruleCode', title: '规则编码', itemRender: { name: 'Input', props: { placeholder: '请输入规则编码' } } },
    ],
  },
};

/** 状态 → ElTag 类型映射（DRAFT 待发布 / PUBLISHED 已发布 / 其余按生命周期着色） */
function statusTagType(status?: string): 'success' | 'warning' | 'info' | 'danger' {
  switch ((status ?? '').toUpperCase()) {
    case 'PUBLISHED':
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
    case 'DISABLED':
    case 'OFFLINE':
      return 'danger';
    default:
      return 'info';
  }
}

/** 规则状态 → YdStatusBadge 语义值 */
function resolveRuleStatus(row: RuleDefinitionVO): 'draft' | 'pending' | 'published' | 'offline' | 'running' {
  const status = (row.status ?? '').toUpperCase();
  switch (status) {
    case 'PUBLISHED':
    case 'ACTIVE':
      return 'published';
    case 'PENDING_REVIEW':
    case 'PENDING':
      return 'pending';
    case 'REJECTED':
    case 'DISABLED':
    case 'OFFLINE':
      return 'offline';
    case 'DRAFT':
    default:
      return row.isEnabled ? 'running' : 'draft';
  }
}

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [RuleFormModal, ruleFormApi] = useYdModal({ connectedComponent: RuleForm });

/** 卡片视图数据加载 */
async function loadCardData(): Promise<void> {
  cardLoading.value = true;
  try {
    const res = await list({ pageQuery: { pageNum: 1, pageSize: 500 } });
    ruleList.value = res.data ?? [];
  } catch (error) {
    logger.warn('加载规则列表失败: {}', error);
    ruleList.value = [];
  } finally {
    cardLoading.value = false;
  }
}

/** 加载分类树 */
async function loadCategoryTree(): Promise<void> {
  try {
    categoryTreeData.value = (await categoryTree()) ?? {};
  } catch (error) {
    logger.warn('加载分类树失败: {}', error);
    categoryTreeData.value = {};
  }
}

/** 视图切换 */
function handleViewModeChange(mode: ViewMode): void {
  if (mode === 'card' && ruleList.value.length === 0 && !cardLoading.value) {
    void loadCardData();
    void loadCategoryTree();
  }
  viewMode.value = mode;
}

/** 刷新列表（兼容两视图） */
async function handleRefresh(): Promise<void> {
  if (viewMode.value === 'table') {
    gridApi.query();
  } else {
    await loadCardData();
  }
}

/** 分类筛选变更 */
function handleCategorySelect(code: string): void {
  selectedCategory.value = code;
}

function handleAdd(): void {
  ruleFormApi.open();
}
function handleEdit(row: RuleDefinitionVO): void {
  ruleFormApi.setData({ record: row });
  ruleFormApi.open();
}

/** 卡片操作命令类型 */
type CardCommand = 'edit' | 'design' | 'toggle' | 'version' | 'delete';
function handleCardAction(command: CardCommand, row: RuleDefinitionVO): void {
  const handlerMap: Record<CardCommand, (r: RuleDefinitionVO) => Promise<void> | void> = {
    delete: handleDelete,
    design: handleDesign,
    edit: handleEdit,
    toggle: handleToggle,
    version: openVersions,
  };
  const handler = handlerMap[command];
  if (handler) {
    const result = handler(row);
    if (result instanceof Promise) {
      result.catch((error: unknown) => logger.warn('卡片操作执行失败: {}', error));
    }
  }
}

async function handleToggle(row: RuleDefinitionVO): Promise<void> {
  if (!row.ruleCode) return;
  try {
    await ydszConfirm(
      t('confirmToggleRule', [row.isEnabled ? t('disabled') : t('enabled'), row.ruleName]),
      t('confirm'),
      { type: 'warning' },
    );
    await toggle({ ruleCode: row.ruleCode }, { isEnabled: !row.isEnabled });
    showToast.success(t('operationSuccess'));
    await handleRefresh();
  } catch (error) {
    logger.warn('启停规则失败: {}', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}

async function handleDelete(row: RuleDefinitionVO): Promise<void> {
  if (!row.ruleCode) return;
  try {
    await ydszConfirm(t('confirmDeleteRule', [row.ruleName]), t('deleteConf'), { type: 'warning' });
    await deleteRule({ ruleCode: row.ruleCode });
    showToast.success(t('deleteSuccess'));
    await handleRefresh();
  } catch (error) {
    logger.warn('删除规则失败: {}', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}

/** 版本历史状态 */
const versionsVisible = ref(false);
const versionsLoading = ref(false);
const versionRows = ref<RuleVersionVO[]>([]);
const currentRule = ref<RuleDefinitionVO | null>(null);

/** 规则链设计器引用 */
const ruleChainDesignerRef = ref<InstanceType<typeof RuleChainDesigner> | null>(null);

/** 打开规则链设计器 */
function handleDesign(row: RuleDefinitionVO): void {
  currentRule.value = row;
  ruleChainDesignerRef.value?.openEditor();
}

/** 打开版本历史抽屉 */
async function openVersions(row: RuleDefinitionVO): Promise<void> {
  currentRule.value = row;
  versionsVisible.value = true;
  await loadVersions();
}

/** 加载当前规则的版本列表 */
async function loadVersions(): Promise<void> {
  const ruleCode = currentRule.value?.ruleCode;
  if (!ruleCode) return;
  versionsLoading.value = true;
  try {
    const res = await listVersions({ ruleCode }, {});
    versionRows.value = res.data ?? [];
  } finally {
    versionsLoading.value = false;
  }
}

/** 回滚到指定版本 */
async function handleRollback(versionItem: RuleVersionVO): Promise<void> {
  const rule = currentRule.value;
  if (!rule?.ruleCode || versionItem.version === undefined) return;
  try {
    await ydszConfirm(
      t('confirmRollback', [rule.ruleName, versionItem.version]),
      t('rollbackConf'),
      { type: 'warning' },
    );
    await rollback({ ruleCode: rule.ruleCode }, { version: versionItem.version });
    showToast.success(t('rollbackSuccess'));
    gridApi.query();
    await loadVersions();
  } catch (error) {
    logger.warn('回滚规则失败: {}', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}

/** 默认加载卡片数据和分类 */
void loadCardData();
void loadCategoryTree();
</script>

<template>
  <Page auto-content-height>
    <!-- 视图切换 + 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-1 rounded-lg border border-border-subtle bg-accent/50 p-1">
        <button
          class="rounded-md px-2.5 py-1 text-xs transition-colors"
          :class="viewMode === 'card' ? 'bg-surface-2 text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'"
          type="button"
          @click="handleViewModeChange('card')"
        >
          <svg
            class="mb-0.5 me-1 inline"
            fill="none"
            height="14"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="14"
          >
            <rect
              height="9"
              rx="1.5"
              width="9"
              x="2.5"
              y="2.5"
            />
            <rect
              height="9"
              rx="1.5"
              width="9"
              x="12.5"
              y="2.5"
            />
            <rect
              height="9"
              rx="1.5"
              width="9"
              x="2.5"
              y="12.5"
            />
            <rect
              height="9"
              rx="1.5"
              width="9"
              x="12.5"
              y="12.5"
            />
          </svg>
          卡片
        </button>
        <button
          class="rounded-md px-2.5 py-1 text-xs transition-colors"
          :class="viewMode === 'table' ? 'bg-surface-2 text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'"
          type="button"
          @click="handleViewModeChange('table')"
        >
          <svg
            class="mb-0.5 me-1 inline"
            fill="none"
            height="14"
            stroke="currentColor"
            stroke-width="1.8"
            viewBox="0 0 24 24"
            width="14"
          >
            <line
              x1="3"
              x2="21"
              y1="6.5"
              y2="6.5"
            />
            <line
              x1="3"
              x2="21"
              y1="12"
              y2="12"
            />
            <line
              x1="3"
              x2="21"
              y1="17.5"
              y2="17.5"
            />
          </svg>
          表格
        </button>
      </div>
      <ElButton type="primary" @click="handleAdd">新增</ElButton>
    </div>

    <!-- 表格视图 -->
    <Grid
      v-if="viewMode === 'table'"
      table-title="规则管理"
    />

    <!-- 卡片视图 -->
    <div
      v-else
      class="flex min-h-[500px] gap-4"
    >
      <!-- 左侧分类筛选面板 -->
      <div class="w-52 shrink-0">
        <YdDomainFilterPanel
          v-model="selectedCategory"
          :items="categoryItems"
          title="规则分类"
          show-search
          @select="handleCategorySelect"
        />
      </div>

      <!-- 右侧卡片网格 -->
      <div class="min-w-0 flex-1">
        <YdCardGrid
          :is-empty="filteredRules.length === 0 && !cardLoading"
          :is-loading="cardLoading"
        >
          <template #empty>
            <YdEmptyState
              :description="selectedCategory === 'all' ? '新增规则后可编排到规则链中执行' : '该分类下暂无规则，可切换分类或新建规则'"
              preset="created"
              action-text="新建规则"
              title="暂无规则"
              @action="handleAdd"
            />
          </template>
          <YdEntityCard
            v-for="item in filteredRules"
            :key="item.id ?? item.ruleCode"
            :avatar-text="item.ruleName"
            :avatar-variant="item.isEnabled ? (resolveRuleStatus(item) === 'published' ? 'primary' : 'blue') : 'neutral'"
            :code="item.ruleCode ?? undefined"
            :description="item.description"
            class="transition-transform hover:-translate-y-0.5"
            @click="handleEdit(item)"
          >
            <template #status-badge>
              <YdStatusBadge
                :status="resolveRuleStatus(item)"
                class="shrink-0"
              />
            </template>

            <template #meta>
              <div class="mt-3 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 text-text-tertiary">
                  <span>优先级 {{ item.priority ?? '-' }}</span>
                  <span class="h-3 w-px bg-border-subtle" />
                  <span>v{{ item.version ?? '-' }}</span>
                </div>
                <span
                  v-if="item.category"
                  class="max-w-[120px] truncate rounded-md bg-accent/60 px-1.5 py-0.5 text-text-tertiary"
                >
                  {{ item.category }}
                </span>
              </div>
              <div class="mt-1.5 text-xs text-text-tertiary">
                {{ item.updatedAt ?? item.createdAt ?? '' }}
              </div>
            </template>

            <template #actions>
              <ElDropdown trigger="click" @command="(cmd: string) => handleCardAction(cmd as CardCommand, item)">
                <ElButton
                  size="small"
                  link
                  type="primary"
                  @click.stop
                >
                  <svg
                    class="mb-0.5 me-1 inline"
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <circle
                      cx="12"
                      cy="5"
                      r="1"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1"
                    />
                    <circle
                      cx="12"
                      cy="19"
                      r="1"
                    />
                  </svg>
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="edit">
                      编辑信息
                    </ElDropdownItem>
                    <ElDropdownItem command="design">
                      规则编排
                    </ElDropdownItem>
                    <ElDropdownItem command="toggle">
                      {{ item.isEnabled ? '停用规则' : '启用规则' }}
                    </ElDropdownItem>
                    <ElDropdownItem command="version" divided>
                      版本历史
                    </ElDropdownItem>
                    <ElDropdownItem
                      command="delete"
                      divided
                    >
                      <span class="text-destructive">删除规则</span>
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </template>
          </YdEntityCard>
        </YdCardGrid>
      </div>
    </div>

    <RuleFormModal @success="handleRefresh()" />
    <RuleChainDesigner
      ref="ruleChainDesignerRef"
      :rule-code="currentRule?.ruleCode"
      @success="handleRefresh()"
    />
    <ElDrawer v-model="versionsVisible" title="版本历史" :size="540">
      <div class="mb-2 flex justify-end">
        <ElButton size="small" @click="loadVersions">刷新</ElButton>
      </div>
      <ElTable
        :data="versionRows"
        border
        size="small"
        v-loading="versionsLoading"
      >
        <ElTableColumn
          prop="version"
          label="版本"
          width="80"
        />
        <ElTableColumn
          prop="changeDesc"
          label="变更说明"
          min-width="120"
        />
        <ElTableColumn
          prop="operator"
          label="操作人"
          width="100"
        />
        <ElTableColumn
          prop="createdAt"
          label="变更时间"
          width="170"
        />
        <ElTableColumn
          label="操作"
          width="90"
          fixed="right"
        >
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              size="small"
              @click="handleRollback(row)"
            >回滚</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElDrawer>
  </Page>
</template>
