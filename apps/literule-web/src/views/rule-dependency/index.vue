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
  ElAlert,
  ElButton,
  ElCard,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';
import { onMounted, reactive, ref, watch } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';

import {
  addDependency,
  cascadingDisable,
  listDependencies,
  listDependents,
  removeDependency,
} from '#/api/ruleDependency';
import type { RuleDependencyAddDTO, RuleDependencyVO, StringVO } from '#/api/models';

const logger = createLogger('literule-rule-dependency');

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
  { label: '强依赖 (HARD)', value: 'HARD' },
  { label: '弱依赖 (SOFT)', value: 'SOFT' },
  { label: '触发依赖 (TRIGGER)', value: 'TRIGGER' },
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
    HARD: '强依赖',
    SOFT: '弱依赖',
    TRIGGER: '触发依赖',
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
    ElMessageBox.alert('请输入规则编码', '提示', { type: 'warning' });
    return;
  }
  addForm.ruleCode = searchRuleCode.value.trim();
  await loadDependencyData();
}

function showAddDialog(): void {
  if (!searchRuleCode.value.trim()) {
    ElMessageBox.alert('请先搜索目标规则后再添加依赖', '提示', { type: 'warning' });
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
    ElMessageBox.alert('请选择被依赖规则', '提示', { type: 'warning' });
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
    await ElMessageBox.confirm(
      `确认移除规则 ${row.ruleCode} 对 ${row.dependsOnRuleCode} 的依赖关系？`,
      '移除依赖确认',
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
  // 切换 tab 时无需额外操作，ElTable 数据已缓存在 ref 中
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
    <div v-loading="loading" class="p-4">
      <!-- 搜索区 -->
      <ElCard shadow="never" class="mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <ElInput
              v-model="searchRuleCode"
              placeholder="输入目标规则编码查询依赖关系"
              clearable
              style="width: 280px"
              @keyup.enter="handleSearch"
            />
            <ElButton type="primary" @click="handleSearch">
              查询
            </ElButton>
          </div>
          <ElButton type="success" @click="showAddDialog">
            添加依赖
          </ElButton>
        </div>
      </ElCard>

      <!-- 级联禁用提示 -->
      <ElAlert
        v-if="cascadingPreview.length > 0"
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      >
        <template #title>
          级联禁用影响：若禁用当前规则，将同时影响
          <strong class="text-red-500 mx-1">{{ cascadingPreview.length }}</strong>
          条关联规则的运行
        </template>
      </ElAlert>

      <!-- 依赖数据展示 -->
      <ElCard shadow="never">
        <ElTabs v-model="activeTab" @tab-change="handleTabChange">
          <ElTabPane label="依赖此规则的" name="dependents">
            <ElTable
              v-if="dependentsList.length > 0"
              :data="dependentsList"
              stripe
              border
            >
              <ElTableColumn type="index" label="#" width="50" />
              <ElTableColumn label="规则编码" min-width="140">
                <template #default="{ row }">
                  <span>{{ row.ruleCode ?? '-' }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="依赖类型" width="120" align="center">
                <template #default="{ row }">
                  <ElTag :type="dependencyTypeTagType(row.dependencyType)">
                    {{ dependencyTypeLabel(row.dependencyType) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="级联禁用" width="100" align="center">
                <template #default="{ row }">
                  <span :class="row.cascadeOnDisable ? 'text-red-500 font-medium' : 'text-gray-400'">
                    {{ row.cascadeOnDisable ? '是' : '否' }}
                  </span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="描述" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-gray-600">{{ row.description ?? '-' }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <ElButton
                    link
                    type="danger"
                    size="small"
                    @click="handleRemoveDependency(row)"
                  >
                    移除
                  </ElButton>
                  <ElButton
                    link
                    type="warning"
                    size="small"
                    @click="handleCascadingPreview(row)"
                  >
                    级联预览
                  </ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
            <ElEmpty v-else description="暂无依赖此规则的记录" image-size="100" />
          </ElTabPane>

          <ElTabPane label="此规则依赖的" name="dependencies">
            <ElTable
              v-if="dependenciesList.length > 0"
              :data="dependenciesList"
              stripe
              border
            >
              <ElTableColumn type="index" label="#" width="50" />
              <ElTableColumn label="被依赖规则编码" min-width="160">
                <template #default="{ row }">
                  <span>{{ row.dependsOnRuleCode ?? '-' }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="依赖类型" width="120" align="center">
                <template #default="{ row }">
                  <ElTag :type="dependencyTypeTagType(row.dependencyType)">
                    {{ dependencyTypeLabel(row.dependencyType) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="级联禁用" width="100" align="center">
                <template #default="{ row }">
                  <span :class="row.cascadeOnDisable ? 'text-red-500 font-medium' : 'text-gray-400'">
                    {{ row.cascadeOnDisable ? '是' : '否' }}
                  </span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="描述" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="text-gray-600">{{ row.description ?? '-' }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <ElButton
                    link
                    type="danger"
                    size="small"
                    @click="handleRemoveDependency(row)"
                  >
                    移除
                  </ElButton>
                  <ElButton
                    link
                    type="warning"
                    size="small"
                    @click="handleCascadingPreview(row)"
                  >
                    级联预览
                  </ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
            <ElEmpty v-else description="暂无此规则依赖的记录" image-size="100" />
          </ElTabPane>
        </ElTabs>
      </ElCard>

      <!-- 添加依赖弹窗 -->
      <ElDialog
        v-model="addDialogVisible"
        :title="`为规则 ${addForm.ruleCode} 添加依赖`"
        width="480px"
        destroy-on-close
      >
        <ElForm :model="addForm" label-width="100px">
          <ElFormItem label="被依赖规则" required>
            <ElInput
              v-model="addForm.dependsOnRuleCode"
              placeholder="请输入被依赖规则编码"
            />
          </ElFormItem>
          <ElFormItem label="依赖类型">
            <ElSelect v-model="addForm.dependencyType" style="width: 100%">
              <ElOption
                v-for="opt in dependencyTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="级联禁用">
            <ElSwitch
              v-model="addForm.cascadeOnDisable"
              active-text="是"
              inactive-text="否"
            />
          </ElFormItem>
          <ElFormItem label="描述">
            <ElInput
              v-model="addForm.description"
              type="textarea"
              :rows="2"
              placeholder="依赖关系说明（可选）"
            />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="addDialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleAddDependency">确认添加</ElButton>
        </template>
      </ElDialog>

      <!-- 级联禁用影响弹窗 -->
      <ElDialog
        v-model="cascadeDialogVisible"
        :title="`级联禁用影响预览 - ${cascadeTargetCode}`"
        width="480px"
        destroy-on-close
      >
        <div v-if="cascadingPreview.length > 0">
          <p class="text-sm text-gray-500 mb-3">
            禁用规则 <strong>{{ cascadeTargetCode }}</strong> 将级联影响以下规则：
          </p>
          <div class="flex flex-wrap gap-2">
            <ElTag
              v-for="(code, idx) in cascadingPreview"
              :key="idx"
              type="warning"
              effect="dark"
            >
              {{ code }}
            </ElTag>
          </div>
        </div>
        <ElEmpty v-else description="无级联禁用影响" :image-size="60" />
      </ElDialog>
    </div>
  </Page>
</template>
