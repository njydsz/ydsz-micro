<!--
 * 规则包管理页面
 *
 * @path apps\literule-web\src\views\rule-pack\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则包管理（市场 / 已安装 / 可更新）
 * <p>消费后端契约 RulePackController（apps/literule-web/src/api/rulePack.ts）：
 * listPacks() / searchPacks() / installPack() / rollbackPack() / diffPack() /
 * publishPack() / listPackVersions() / checkPackUpdates() / batchUpdatePacks() 全量端点。
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
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessageBox,
  ElRate,
  ElRow,
  ElStatistic,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTooltip,
} from 'element-plus';
import { h, onMounted, ref } from 'vue';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { createLogger } from '@ydsz-core/shared/utils';

import type { PackDiffVO, PackUpdateInfoVO, RulePackVO } from '#/api/models';
import {
  batchUpdatePacks,
  checkPackUpdates,
  diffPack,
  installPack,
  listPackVersions,
  listPacks,
  publishPack,
  rollbackPack,
  searchPacks,
} from '#/api/rulePack';

const logger = createLogger('literule-rule-pack');

defineOptions({ name: 'RulePackManagement' });

/**
 * 市场规则包行类型。
 *
 * <p>契约 RulePackVO 未声明 publishTime，而市场列表需按发布时间展示，
 * 故以扩展类型收窄取值（替代 as any 断言）。待后端 DTO 补齐该字段并执行
 * `pnpm gen:contract` 重新生成契约后，本类型应随之移除。
 */
type MarketPackRow = RulePackVO & { publishTime?: string };

/** ========== 状态 ========== */
const activeTab = ref('market');
const loading = ref(false);
const packList = ref<RulePackVO[]>([]);
const installedPacks = ref<RulePackVO[]>([]);
const updatablePacks = ref<PackUpdateInfoVO[]>([]);
const versionDialogVisible = ref(false);
const publishDialogVisible = ref(false);
const diffDialogVisible = ref(false);
const currentPackCode = ref('');
const versionList = ref<RulePackVO[]>([]);
const diffData = ref<PackDiffVO | null>(null);
const keyword = ref('');

/** 发布表单 */
const publishForm = ref<RulePackVO>({
  packCode: '',
  packName: '',
  packVersion: '1.0.0',
  description: '',
  author: '',
  industry: '',
  tags: '',
});

/** ========== 指标卡 ========== */
const statPublished = ref(0);
const statInstalled = ref(0);
const statUpdatable = ref(0);

/** ========== 包市场（Tab 1） ========== */
const marketGridOptions: VxeTableGridOptions<MarketPackRow> = {
  columns: [
    { type: 'seq', width: 50, title: '#' },
    { field: 'packCode', title: '包编码', width: 140 },
    { field: 'packName', title: '名称', minWidth: 140 },
    { field: 'packVersion', title: '版本', width: 90 },
    {
      field: 'rating',
      title: '评分',
      width: 160,
      slots: {
        default: ({ row }) =>
          h(ElRate, {
            modelValue: row.rating ?? 0,
            disabled: true,
            'onUpdate:modelValue': () => {},
          }),
      },
    },
    { field: 'author', title: '作者', width: 100 },
    { field: 'downloadCount', title: '安装量', width: 90 },
    {
      field: 'description',
      title: '描述',
      minWidth: 160,
      slots: {
        default: ({ row }) =>
          h(
            ElTooltip,
            { content: row.description, placement: 'top' },
            { default: () => h('span', {}, row.description?.length > 20 ? `${row.description.slice(0, 20)}...` : (row.description ?? '-')) },
          ),
      },
    },
    {
      field: 'publishTime',
      title: '发布时间',
      width: 160,
      slots: {
        default: ({ row }) => h('span', {}, row.publishTime ?? '-'),
      },
    },
    {
      field: 'action',
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'success', onClick: () => handleInstall(row) },
              () => '安装',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleViewVersions(row) },
              () => '版本历史',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'warning', onClick: () => handleDiff(row) },
              () => '版本对比',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => ({ items: packList.value, total: packList.value.length }),
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

/** ========== 已安装（Tab 2） ========== */
const installedGridOptions: VxeTableGridOptions<RulePackVO> = {
  columns: [
    { type: 'seq', width: 50, title: '#' },
    { field: 'packCode', title: '包编码', width: 140 },
    { field: 'packName', title: '名称', minWidth: 140 },
    { field: 'packVersion', title: '当前版本', width: 100 },
    { field: 'industry', title: '行业', width: 100 },
    { field: 'author', title: '作者', width: 100 },
    { field: 'downloadCount', title: '安装量', width: 90 },
    {
      field: 'action',
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleViewVersions(row) },
              () => '版本历史',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'warning', onClick: () => handleDiff(row) },
              () => '版本对比',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleUninstall(row) },
              () => '卸载',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => ({ items: installedPacks.value, total: installedPacks.value.length }),
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

/** ========== 可更新（Tab 3） ========== */
const updatableGridOptions: VxeTableGridOptions<PackUpdateInfoVO> = {
  columns: [
    { type: 'seq', width: 50, title: '#' },
    { field: 'packCode', title: '包编码', width: 140 },
    { field: 'packName', title: '名称', minWidth: 140 },
    { field: 'installedVersion', title: '当前版本', width: 100 },
    { field: 'latestVersion', title: '最新版本', width: 100 },
    { field: 'industry', title: '行业', width: 100 },
    {
      field: 'hasUpdate',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.hasUpdate ? 'warning' : 'info' }, () =>
            row.hasUpdate ? '可更新' : '已最新',
          ),
      },
    },
    {
      field: 'action',
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h(
            ElButton,
            { size: 'small', link: true, type: 'success', onClick: () => handleUpdateSingle(row) },
            () => '一键更新',
          ),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => ({ items: updatablePacks.value, total: updatablePacks.value.length }),
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [MarketGrid, marketGridApi] = useYDSZVxeGrid({ gridOptions: marketGridOptions });
const [InstalledGrid, installedGridApi] = useYDSZVxeGrid({ gridOptions: installedGridOptions });
const [UpdatableGrid, updatableGridApi] = useYDSZVxeGrid({ gridOptions: updatableGridOptions });

/** ========== 数据加载 ========== */

async function loadMarket(): Promise<void> {
  try {
    packList.value = await listPacks();
    statPublished.value = packList.value.length;
  } catch (error) {
    logger.warn('加载包市场失败: {}', error);
  }
}

async function loadInstalled(): Promise<void> {
  try {
    // 已安装包：由 listPacks 过滤 enable=true 状态（此处全量展示，实际可增加 installed 字段过滤）
    const allPacks = await listPacks();
    installedPacks.value = allPacks.filter((p) => p.isEnabled === true);
    statInstalled.value = installedPacks.value.length;
  } catch (error) {
    logger.warn('加载已安装包失败: {}', error);
  }
}

async function loadUpdatable(): Promise<void> {
  try {
    updatablePacks.value = await checkPackUpdates();
    statUpdatable.value = updatablePacks.value.filter((p) => p.hasUpdate).length;
  } catch (error) {
    logger.warn('加载可更新包失败: {}', error);
  }
}

async function loadAll(): Promise<void> {
  loading.value = true;
  try {
    await Promise.all([loadMarket(), loadInstalled(), loadUpdatable()]);
  } finally {
    loading.value = false;
  }
}

/** ========== 操作回调 ========== */

async function handleSearch(): Promise<void> {
  if (!keyword.value.trim()) {
    await loadMarket();
    return;
  }
  try {
    packList.value = await searchPacks({ keyword: keyword.value.trim() });
    statPublished.value = packList.value.length;
  } catch (error) {
    logger.warn('搜索规则包失败: {}', error);
  }
}

async function handleInstall(row: RulePackVO): Promise<void> {
  if (!row.packCode) return;
  try {
    await installPack({ packCode: row.packCode }, { version: row.packVersion });
    ElMessageBox.alert(`规则包 ${row.packName} v${row.packVersion} 安装成功`, '安装结果', {
      type: 'success',
    });
    await loadAll();
  } catch (error) {
    logger.warn('安装规则包失败: {}', error);
  }
}

async function handleUninstall(row: RulePackVO): Promise<void> {
  if (!row.packCode) return;
  try {
    await ElMessageBox.confirm(`确认卸载规则包 "${row.packName}"？`, '卸载确认', {
      type: 'warning',
    });
  } catch {
    logger.debug('用户取消卸载规则包');
    return;
  }
  // 卸载逻辑（API 无直接 uninstall 端点，实际可调用 disable 或标记）
  logger.info('卸载规则包: {}', row.packCode);
  await loadInstalled();
}

async function handleViewVersions(row: RulePackVO): Promise<void> {
  if (!row.packCode) return;
  currentPackCode.value = row.packCode;
  try {
    versionList.value = await listPackVersions({ packCode: row.packCode });
    versionDialogVisible.value = true;
  } catch (error) {
    logger.warn('加载版本历史失败: {}', error);
  }
}

async function handleRollback(version: string): Promise<void> {
  if (!currentPackCode.value) return;
  try {
    await ElMessageBox.confirm(`确认回滚到版本 ${version}？`, '回滚确认', {
      type: 'warning',
    });
  } catch {
    logger.debug('用户取消回滚');
    return;
  }
  try {
    await rollbackPack({ packCode: currentPackCode.value }, { version });
    ElMessageBox.alert(`已回滚到版本 ${version}`, '回滚成功', { type: 'success' });
    versionDialogVisible.value = false;
    await loadAll();
  } catch (error) {
    logger.warn('回滚失败: {}', error);
  }
}

async function handleDiff(row: RulePackVO): Promise<void> {
  if (!row.packCode) return;
  currentPackCode.value = row.packCode;
  try {
    diffData.value = await diffPack(
      { packCode: row.packCode },
      { fromVersion: row.previousVersion, toVersion: row.packVersion },
    );
    diffDialogVisible.value = true;
  } catch (error) {
    logger.warn('版本对比失败: {}', error);
  }
}

async function _handleDiffVersions(fromVersion: string, toVersion: string): Promise<void> {
  if (!currentPackCode.value) return;
  try {
    diffData.value = await diffPack(
      { packCode: currentPackCode.value },
      { fromVersion, toVersion },
    );
  } catch (error) {
    logger.warn('版本对比失败: {}', error);
  }
}

function handleOpenPublishDialog(): void {
  publishForm.value = {
    packCode: '',
    packName: '',
    packVersion: '1.0.0',
    description: '',
    author: '',
    industry: '',
    tags: '',
  };
  publishDialogVisible.value = true;
}

async function handlePublish(): Promise<void> {
  if (!publishForm.value.packCode || !publishForm.value.packName) {
    ElMessageBox.alert('请填写包编码和名称', '提示', { type: 'warning' });
    return;
  }
  try {
    await publishPack(publishForm.value);
    ElMessageBox.alert('规则包发布成功', '发布结果', { type: 'success' });
    publishDialogVisible.value = false;
    await loadAll();
  } catch (error) {
    logger.warn('发布规则包失败: {}', error);
  }
}

async function handleUpdateSingle(row: PackUpdateInfoVO): Promise<void> {
  if (!row.packCode) return;
  try {
    await installPack({ packCode: row.packCode }, { version: row.latestVersion });
    ElMessageBox.alert(`规则包 ${row.packName} 已更新到 v${row.latestVersion}`, '更新成功', {
      type: 'success',
    });
    await loadAll();
  } catch (error) {
    logger.warn('更新规则包失败: {}', error);
  }
}

async function handleBatchUpdate(): Promise<void> {
  const codes = updatablePacks.value.filter((p) => p.hasUpdate).map((p) => p.packCode ?? '');
  if (codes.length === 0) {
    ElMessageBox.alert('当前没有可更新的规则包', '提示', { type: 'info' });
    return;
  }
  try {
    await batchUpdatePacks(codes);
    ElMessageBox.alert(`已成功更新 ${codes.length} 个规则包`, '批量更新成功', { type: 'success' });
    await loadAll();
  } catch (error) {
    logger.warn('批量更新失败: {}', error);
  }
}

/** ========== 版本历史弹窗表格 ========== */
const versionGridOptions: VxeTableGridOptions<RulePackVO> = {
  columns: [
    { field: 'packVersion', title: '版本号', width: 100 },
    { field: 'author', title: '发布者', width: 100 },
    {
      field: 'action',
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h(
            ElButton,
            { size: 'small', link: true, type: 'warning', onClick: () => handleRollback(row.packVersion ?? '') },
            () => '回滚',
          ),
      },
    },
  ],
  height: 240,
  proxyConfig: {
    ajax: {
      query: async () => ({ items: versionList.value, total: versionList.value.length }),
    },
  },
};
const [VersionGrid] = useYDSZVxeGrid({ gridOptions: versionGridOptions });

/** ========== Tab 切换 ========== */
function handleTabChange(tabName: string): void {
  if (tabName === 'market') {
    marketGridApi.query();
  } else if (tabName === 'installed') {
    installedGridApi.query();
  } else if (tabName === 'updatable') {
    updatableGridApi.query();
  }
}

onMounted(() => {
  void loadAll();
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-4">
      <!-- 顶部指标卡 -->
      <ElRow :gutter="12" class="mb-4">
        <ElCol :span="8">
          <ElCard shadow="never">
            <ElStatistic title="已发布包数" :value="statPublished" />
          </ElCard>
        </ElCol>
        <ElCol :span="8">
          <ElCard shadow="never">
            <ElStatistic title="已安装包数" :value="statInstalled" />
          </ElCard>
        </ElCol>
        <ElCol :span="8">
          <ElCard shadow="never">
            <ElStatistic title="可更新数" :value="statUpdatable" />
          </ElCard>
        </ElCol>
      </ElRow>

      <!-- Tab 区域 -->
      <ElCard shadow="never">
        <ElTabs v-model="activeTab" @tab-change="handleTabChange">
          <!-- 包市场 -->
          <ElTabPane label="包市场" name="market">
            <div class="flex items-center gap-2 mb-3">
              <ElInput
                v-model="keyword"
                placeholder="搜索编码/名称/描述"
                clearable
                style="width: 280px"
                @keyup.enter="handleSearch"
              />
              <ElButton type="primary" @click="handleSearch">搜索</ElButton>
              <ElButton type="success" @click="handleOpenPublishDialog">发布规则包</ElButton>
              <ElButton @click="loadMarket">刷新</ElButton>
            </div>
            <MarketGrid />
          </ElTabPane>

          <!-- 已安装 -->
          <ElTabPane label="已安装" name="installed">
            <div class="mb-2">
              <ElButton @click="loadInstalled">刷新</ElButton>
            </div>
            <InstalledGrid />
          </ElTabPane>

          <!-- 可更新 -->
          <ElTabPane label="可更新" name="updatable">
            <div class="mb-2 flex gap-2">
              <ElButton @click="loadUpdatable">刷新</ElButton>
              <ElButton type="success" @click="handleBatchUpdate">一键更新全部</ElButton>
            </div>
            <UpdatableGrid />
          </ElTabPane>
        </ElTabs>
      </ElCard>

      <!-- 版本历史弹窗 -->
      <ElDialog v-model="versionDialogVisible" :title="`版本历史 - ${currentPackCode}`" width="600px">
        <VersionGrid />
      </ElDialog>

      <!-- 版本对比弹窗 -->
      <ElDialog v-model="diffDialogVisible" :title="`版本对比 - ${currentPackCode}`" width="700px">
        <div v-if="diffData" class="space-y-3">
          <ElRow :gutter="12">
            <ElCol :span="12">
              <span class="text-sm text-gray-500">源版本:</span>
              <ElTag>{{ diffData.fromVersion }}</ElTag>
            </ElCol>
            <ElCol :span="12">
              <span class="text-sm text-gray-500">目标版本:</span>
              <ElTag>{{ diffData.toVersion }}</ElTag>
            </ElCol>
          </ElRow>
          <div>
            <p class="text-sm font-medium mb-1">
              <span class="text-green-600">新增规则</span> ({{ diffData.added?.length ?? 0 }})
            </p>
            <ElTag v-for="code in diffData.added" :key="code" type="success" class="mr-1 mb-1">
              {{ code }}
            </ElTag>
            <span v-if="!diffData.added?.length" class="text-xs text-gray-400">无</span>
          </div>
          <div>
            <p class="text-sm font-medium mb-1">
              <span class="text-red-600">移除规则</span> ({{ diffData.removed?.length ?? 0 }})
            </p>
            <ElTag v-for="code in diffData.removed" :key="code" type="danger" class="mr-1 mb-1">
              {{ code }}
            </ElTag>
            <span v-if="!diffData.removed?.length" class="text-xs text-gray-400">无</span>
          </div>
          <div>
            <p class="text-sm font-medium mb-1">
              <span class="text-orange-600">变更规则</span> ({{ diffData.changed?.length ?? 0 }})
            </p>
            <ElTag v-for="code in diffData.changed" :key="code" type="warning" class="mr-1 mb-1">
              {{ code }}
            </ElTag>
            <span v-if="!diffData.changed?.length" class="text-xs text-gray-400">无</span>
          </div>
        </div>
      </ElDialog>

      <!-- 发布规则包弹窗 -->
      <ElDialog v-model="publishDialogVisible" title="发布规则包" width="500px">
        <ElForm :model="publishForm" label-width="80px">
          <ElFormItem label="包编码" required>
            <ElInput v-model="publishForm.packCode" placeholder="如 finance-credit-score" />
          </ElFormItem>
          <ElFormItem label="包名称" required>
            <ElInput v-model="publishForm.packName" placeholder="如 金融信用评分包" />
          </ElFormItem>
          <ElFormItem label="版本号">
            <ElInput v-model="publishForm.packVersion" />
          </ElFormItem>
          <ElFormItem label="行业">
            <ElInput v-model="publishForm.industry" placeholder="如 finance/ecommerce" />
          </ElFormItem>
          <ElFormItem label="标签">
            <ElInput v-model="publishForm.tags" placeholder="逗号分隔" />
          </ElFormItem>
          <ElFormItem label="作者">
            <ElInput v-model="publishForm.author" placeholder="作者工号或姓名" />
          </ElFormItem>
          <ElFormItem label="描述">
            <ElInput v-model="publishForm.description" type="textarea" :rows="3" />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="publishDialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handlePublish">确认发布</ElButton>
        </template>
      </ElDialog>
    </div>
  </Page>
</template>
