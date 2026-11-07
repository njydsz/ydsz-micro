<!--
 * 规则依赖拓扑页面
 *
 * <p>展示规则间的依赖关系图，支持查看规则的被依赖/依赖列表、添加/移除依赖以及级联禁用影响预览。
 *
 * @path apps\literule-web\src\views\rule-dependency\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则依赖拓扑
 * <p>消费后端契约 RuleDependencyController（apps/literule-web/src/api/ruleDependency.ts）：
 * listDependencies / listDependents / addDependency / removeDependency / cascadingDisable 全量端点。
 *
 * @author ydsz-team
 * @since 1.0.0
 */

import { Page } from '@ydsz/common-ui';

import {
  YdAlertBanner,
  YdBadge,
  YdButton,
  YdCard,
  YdDialog,
  YdEmptyState,
  YdForm,
  YdFormItem,
  YdInput,
  YdSelect,
  YdSelectItem,
  YdSwitch,
  YdTable,
  YdTableColumn,
  YdTabs,
  YdTabsContent,
} from '@ydsz-core/ydsz-ui';
import { YdAlert, YdConfirm } from '@ydsz-core/popup-ui';
import { onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';

import {
  addDependency,
  cascadingDisable,
  listDependencies,
  listDependents,
  removeDependency,
} from '#/api/ruleDependency';
import type { RuleDependencyAddDTO, RuleDependencyVO, StringVO } from '#/api/models';

const logger = createLogger('literule-rule-dependency');
const { t } = useI18n();

defineOptions({ name: 'RuleDependencyManagement' });

/** ========== 状态 ========== */
const loading = ref(false);
const searchRuleCode = ref('');
const activeTab = ref('dependents');
const dependentsList = ref<RuleDependencyVO[]>([]);
const dependenciesList = ref<RuleDependencyVO[]>([]);
const cascadingPreview = ref<string[]>([]);
const addDialogVisible = ref(false);
const cascadeDialogVisible = ref(false);
const cascadeTargetCode = ref('');

const addForm = reactive<RuleDependencyAddDTO & { ruleCode: string }>({
  ruleCode: '',
  dependsOnRuleCode: '',
  dependencyType: 'HARD',
  cascadeOnDisable: false,
  description: '',
});

const dependencyTypeOptions = [
  { label: t('ruleDependency.typeHard'), value: 'HARD' },
  { label: t('ruleDependency.typeSoft'), value: 'SOFT' },
  { label: t('ruleDependency.typeTrigger'), value: 'TRIGGER' },
];

/** ========== 工具函数 ========== */
function dependencyTypeTagType(type?: string): 'danger' | 'warning' | 'info' | 'success' {
  if (!type) return 'info';
  if (type === 'HARD') return 'danger';
  if (type === 'SOFT') return 'warning';
  if (type === 'TRIGGER') return 'success';
  return 'info';
}

function dependencyTypeLabel(type?: string): string {
  const map: Record<string, string> = {
    HARD: t('ruleDependency.typeHardSimple'),
    SOFT: t('ruleDependency.typeSoftSimple'),
    TRIGGER: t('ruleDependency.typeTriggerSimple'),
  };
  return map[type ?? ''] ?? type ?? '-';
}

/** ========== 数据加载 ========== */
async function loadDependencyData(): Promise<void> {
  const code = searchRuleCode.value.trim();
  if (!code) return;

  loading.value = true;
  try {
    const [deps, dependents] = await Promise.all([
      listDependencies({ ruleCode: code }),
      listDependents({ ruleCode: code }),
    ]);
    dependenciesList.value = deps || [];
    dependentsList.value = dependents || [];

    // 加载级联禁用预览（如果有被依赖方）
    if (dependents && dependents.length > 0) {
      await loadCascadingPreview(code);
    } else {
      cascadingPreview.value = [];
    }
  } catch (error) {
    logger.warn('加载依赖数据失败: {}', error);
  } finally {
    loading.value = false;
  }
}

async function loadCascadingPreview(ruleCode: string): Promise<void> {
  try {
    const result = await cascadingDisable({ ruleCode });
    cascadingPreview.value = result?.map((item: StringVO) => item.value ?? '') ?? [];
  } catch (error) {
    logger.warn('加载级联禁用预览失败: {}', error);
    cascadingPreview.value = [];
  }
}

/** ========== 操作回调 ========== */
async function handleSearch(): Promise<void> {
  if (!searchRuleCode.value.trim()) {
    await YdAlert({
      content: t('ruleDependency.ruleCodeRequired'),
      title: t('ruleDependency.alertTitle'),
      icon: 'warning',
      confirmText: t('ruleDependency.confirmText'),
    });
    return;
  }
  addForm.ruleCode = searchRuleCode.value.trim();
  await loadDependencyData();
}

async function showAddDialog(): Promise<void> {
  if (!searchRuleCode.value.trim()) {
    await YdAlert({
      content: t('ruleDependency.searchFirst'),
      title: t('ruleDependency.alertTitle'),
      icon: 'warning',
      confirmText: t('ruleDependency.confirmText'),
    });
    return;
  }
  addForm.ruleCode = searchRuleCode.value.trim();
  addForm.dependsOnRuleCode = '';
  addForm.dependencyType = 'HARD';
  addForm.cascadeOnDisable = false;
  addForm.description = '';
  addDialogVisible.value = true;
}

async function handleAddDependency(): Promise<void> {
  if (!addForm.dependsOnRuleCode?.trim()) {
    await YdAlert({
      content: t('ruleDependency.selectDependsOn'),
      title: t('ruleDependency.alertTitle'),
      icon: 'warning',
      confirmText: t('ruleDependency.confirmText'),
    });
    return;
  }
  try {
    await addDependency(
      { ruleCode: addForm.ruleCode },
      {
        dependsOnRuleCode: addForm.dependsOnRuleCode.trim(),
        dependencyType: addForm.dependencyType,
        cascadeOnDisable: addForm.cascadeOnDisable,
        description: addForm.description,
      },
    );
    addDialogVisible.value = false;
    logger.info('依赖添加成功: {} -> {}', addForm.ruleCode, addForm.dependsOnRuleCode);
    await loadDependencyData();
  } catch (error) {
    logger.warn('添加依赖失败: {}', error);
  }
}

async function handleRemoveDependency(row: RuleDependencyVO): Promise<void> {
  if (!row.ruleCode || !row.dependsOnRuleCode) return;

  try {
    await YdConfirm(
      t('ruleDependency.removeConfirm', [row.ruleCode, row.dependsOnRuleCode]),
      t('ruleDependency.removeTitle'),
      { type: 'warning' },
    );
  } catch {
    logger.debug('用户取消移除依赖');
    return;
  }

  try {
    await removeDependency({
      ruleCode: row.ruleCode,
      dependsOnRuleCode: row.dependsOnRuleCode,
    });
    logger.info('依赖移除成功: {} -> {}', row.ruleCode, row.dependsOnRuleCode);
    await loadDependencyData();
  } catch (error) {
    logger.warn('移除依赖失败: {}', error);
  }
}

async function handleCascadingPreview(row: RuleDependencyVO): Promise<void> {
  if (!row.ruleCode) return;
  cascadeTargetCode.value = row.ruleCode;
  cascadeDialogVisible.value = true;
  await loadCascadingPreview(row.ruleCode);
}

function handleTabChange(): void {
  // 切换 tab 时无需额外操作，YdTable 数据已缓存在 ref 中
}

/** 监听搜索框变化清空数据 */
watch(searchRuleCode, (val) => {
  if (!val.trim()) {
    dependentsList.value = [];
    dependenciesList.value = [];
    cascadingPreview.value = [];
  }
});

onMounted(() => {
  // 默认进入页面不自动加载，需用户输入规则编码
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-5">
      <!-- 搜索区 -->
      <YdCard shadow="never" class="mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <YdInput
              v-model="searchRuleCode"
              :placeholder="t('ruleDependency.searchPlaceholder')"
              clearable
              style="width: 280px"
              @keyup.enter="handleSearch"
            />
            <YdButton type="primary" @click="handleSearch"> {{ t('ruleDependency.search') }} </YdButton>
          </div>
          <YdButton type="success" @click="showAddDialog"> {{ t('ruleDependency.add') }} </YdButton>
        </div>
      </YdCard>

      <!-- 级联禁用提示 -->
      <YdAlertBanner
        v-if="cascadingPreview.length > 0"
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      >
        <template #title>
          {{ t('ruleDependency.cascadeEffect') }}
          <strong class="mx-1 text-red-500">{{ cascadingPreview.length }}</strong>
          {{ t('ruleDependency.cascadeEffectSuffix') }}
        </template>
      </YdAlertBanner>

      <!-- 依赖数据展示 -->
      <YdCard shadow="never">
        <YdTabs v-model="activeTab" @tab-change="handleTabChange">
          <YdTabsContent :label="t('ruleDependency.dependentsTab')" name="dependents">
            <YdTable v-if="dependentsList.length > 0" :data="dependentsList" stripe border>
              <YdTableColumn type="index" label="#" width="50" />
              <YdTableColumn :label="t('ruleDependency.ruleCode')" min-width="140">
                <template #default="{ row }">
                  <span>{{ row.ruleCode ?? '-' }}</span>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('ruleDependency.dependencyType')" width="120" align="center">
                <template #default="{ row }">
                  <YdBadge :type="dependencyTypeTagType(row.dependencyType)">
                    {{ dependencyTypeLabel(row.dependencyType) }}
                  </YdBadge>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('ruleDependency.cascadeDisable')" width="100" align="center">
                <template #default="{ row }">
                  <span
                    :class="row.cascadeOnDisable ? 'font-medium text-red-500' : 'text-gray-400'"
                  >
                    {{ row.cascadeOnDisable ? t('ruleDependency.yes') : t('ruleDependency.no') }}
                  </span>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('ruleDependency.description')" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-gray-600">{{ row.description ?? '-' }}</span>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('ruleDependency.operation')" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <YdButton link type="danger" size="small" @click="handleRemoveDependency(row)">
                    {{ t('ruleDependency.remove') }}
                  </YdButton>
                  <YdButton link type="warning" size="small" @click="handleCascadingPreview(row)">
                    {{ t('ruleDependency.cascadePreview') }}
                  </YdButton>
                </template>
              </YdTableColumn>
            </YdTable>
            <YdEmptyState v-else :description="t('ruleDependency.dependentsEmpty')" image-size="100" />
          </YdTabsContent>

          <YdTabsContent :label="t('ruleDependency.dependenciesTab')" name="dependencies">
            <YdTable v-if="dependenciesList.length > 0" :data="dependenciesList" stripe border>
              <YdTableColumn type="index" label="#" width="50" />
              <YdTableColumn :label="t('ruleDependency.dependsOnRuleCode')" min-width="160">
                <template #default="{ row }">
                  <span>{{ row.dependsOnRuleCode ?? '-' }}</span>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('ruleDependency.dependencyType')" width="120" align="center">
                <template #default="{ row }">
                  <YdBadge :type="dependencyTypeTagType(row.dependencyType)">
                    {{ dependencyTypeLabel(row.dependencyType) }}
                  </YdBadge>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('ruleDependency.cascadeDisable')" width="100" align="center">
                <template #default="{ row }">
                  <span
                    :class="row.cascadeOnDisable ? 'font-medium text-red-500' : 'text-gray-400'"
                  >
                    {{ row.cascadeOnDisable ? t('ruleDependency.yes') : t('ruleDependency.no') }}
                  </span>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('ruleDependency.description')" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-gray-600">{{ row.description ?? '-' }}</span>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('ruleDependency.operation')" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <YdButton link type="danger" size="small" @click="handleRemoveDependency(row)">
                    {{ t('ruleDependency.remove') }}
                  </YdButton>
                  <YdButton link type="warning" size="small" @click="handleCascadingPreview(row)">
                    {{ t('ruleDependency.cascadePreview') }}
                  </YdButton>
                </template>
              </YdTableColumn>
            </YdTable>
            <YdEmptyState v-else :description="t('ruleDependency.dependenciesEmpty')" image-size="100" />
          </YdTabsContent>
        </YdTabs>
      </YdCard>

      <!-- 添加依赖弹窗 -->
      <YdDialog
        v-model="addDialogVisible"
        :title="t('ruleDependency.addTitle', [addForm.ruleCode])"
        width="480px"
        destroy-on-close
      >
        <YdForm :model="addForm" label-width="100px">
          <YdFormItem :label="t('ruleDependency.dependsOn')" required>
            <YdInput
              v-model="addForm.dependsOnRuleCode"
              :placeholder="t('ruleDependency.dependsOnPlaceholder')"
            />
          </YdFormItem>
          <YdFormItem :label="t('ruleDependency.dependencyType')">
            <YdSelect v-model="addForm.dependencyType" style="width: 100%">
              <YdSelectItem
                v-for="opt in dependencyTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </YdSelect>
          </YdFormItem>
          <YdFormItem :label="t('ruleDependency.cascadeDisable')">
            <YdSwitch
              v-model="addForm.cascadeOnDisable"
              :active-text="t('ruleDependency.yes')"
              :inactive-text="t('ruleDependency.no')"
            />
          </YdFormItem>
          <YdFormItem :label="t('ruleDependency.description')">
            <YdInput
              v-model="addForm.description"
              type="textarea"
              :rows="2"
              :placeholder="t('ruleDependency.descriptionPlaceholder')"
            />
          </YdFormItem>
        </YdForm>
        <template #footer>
          <YdButton @click="addDialogVisible = false">{{ t('ruleDependency.cancel') }}</YdButton>
          <YdButton type="primary" @click="handleAddDependency">
            {{ t('ruleDependency.confirmAdd') }}
          </YdButton>
        </template>
      </YdDialog>

      <!-- 级联禁用影响弹窗 -->
      <YdDialog
        v-model="cascadeDialogVisible"
        :title="t('ruleDependency.cascadePreviewTitle', [cascadeTargetCode])"
        width="480px"
        destroy-on-close
      >
        <div v-if="cascadingPreview.length > 0">
          <p class="mb-3 text-sm text-gray-500">
            {{ t('ruleDependency.cascadeHint') }} <strong>{{ cascadeTargetCode }}</strong>
            {{ t('ruleDependency.cascadeHintSuffix') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <YdBadge v-for="code in cascadingPreview" :key="code" type="warning" effect="dark">
              {{ code }}
            </YdBadge>
          </div>
        </div>
        <YdEmptyState v-else :description="t('ruleDependency.cascadeEmpty')" :image-size="60" />
      </YdDialog>
    </div>
  </Page>
</template>
