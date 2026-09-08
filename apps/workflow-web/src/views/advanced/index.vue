<!--
 * 高级审批
 *
 * @path apps\workflow-web\src\views\advanced\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 高级审批
 * <p>提供催办中心、合并审批、离线转办、报告推送四个功能模块。
 * <p>催办中心：查询流程实例的催办冷却倒计时；
 * <p>合并审批：查看可合并审批项并通过/驳回操作；
 * <p>离线转办：自动/手动将审批任务转交给目标用户；
 * <p>报告推送：查看周/月报历史记录并手动触发推送。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElSpace,
  ElStatistic,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';
import { onMounted, ref } from 'vue';
import {
  approvedUsers,
  autoForward,
  getMergeGroup,
  merge,
  mergePass,
  mergeReject,
  mergeable,
  monthlyReport,
  sendMonthly,
  sendWeekly,
  urgeCooldown,
  weeklyReport,
} from '#/api/flowAdvanced';
import { createLogger } from '@YDSZ-core/shared/utils';

const logger = createLogger('workflow-advanced');
defineOptions({ name: 'AdvancedApprovalManagement' });

// ==================== Tab 状态 ====================

/** 当前激活 Tab */
const activeTab = ref<'urge' | 'merge' | 'forward' | 'report'>('urge');

// ==================== Tab 1: 催办中心 ====================

/** 催办查询 -- 流程实例 ID */
const urgeInstanceId = ref('');
/** 催办冷却倒计时信息（record 格式：{ [key]: value }） */
const urgeCooldownData = ref<Record<string, Record<string, unknown>> | null>(null);
/** 催办记录中当前冷却剩余秒数 */
const urgeRemainingSeconds = ref<number>(0);
/** 已审批用户列表 */
const approvedUserList = ref<string[]>([]);

/** 催办冷却倒计时 -- 查询 */
async function handleQueryUrgeCooldown() {
  if (!urgeInstanceId.value.trim()) {
    ElMessage.warning('请输入流程实例 ID');
    return;
  }
  try {
    const data = await urgeCooldown({ instanceId: urgeInstanceId.value.trim() });
    urgeCooldownData.value = data;
    // 提取剩余冷却秒数（后端可能返回 remainingSeconds / cooldownRemaining 等字段）
    const raw = data?.[urgeInstanceId.value] ?? data;
    urgeRemainingSeconds.value = Number(
      raw?.remainingSeconds ?? raw?.cooldownRemaining ?? raw?.remaining ?? 0,
    );
    logger.info('催办冷却查询成功', urgeInstanceId.value, urgeRemainingSeconds.value);
    // 同步查询已审批用户
    try {
      const users = await approvedUsers({ instanceId: urgeInstanceId.value.trim() });
      approvedUserList.value = (users ?? []).map((u) => u.value ?? '').filter(Boolean);
    } catch (error) {
      logger.warn('查询已审批用户失败', error);
    }
  } catch (error) {
    logger.warn('催办冷却查询失败', error);
  }
}

// ==================== Tab 2: 合并审批 ====================

/** 可合并审批列表 */
const mergeableList = ref<Array<Record<string, Record<string, unknown>>>>([]);
/** 当前合并组详情 */
const mergeGroupDetail = ref<Record<string, Record<string, unknown>> | null>(null);
/** 审批意见 */
const mergeComment = ref('');
/** 待合并的实例 ID（逗号分隔，手动输入合并用） */
const mergeInstanceIds = ref('');

/** 加载可合并审批列表 */
async function loadMergeable() {
  try {
    const data = await mergeable();
    mergeableList.value = data ?? [];
    logger.info('加载可合并审批列表成功，共', mergeableList.value.length, '条');
  } catch (error) {
    logger.warn('加载可合并审批列表失败', error);
  }
}

/** 查看合并组详情 */
async function handleViewMergeGroup(item: Record<string, Record<string, unknown>>) {
  const groupId = String(item?.mergeGroupId ?? item?.id ?? item?.groupId ?? '');
  if (!groupId) {
    ElMessage.warning('未找到合并组 ID');
    return;
  }
  try {
    const data = await getMergeGroup({ mergeGroupId: groupId });
    mergeGroupDetail.value = data;
    logger.info('查看合并组详情成功', groupId);
  } catch (error) {
    logger.warn('查看合并组详情失败', error);
  }
}

/** 通过合并审批 */
async function handleMergePass(item: Record<string, Record<string, unknown>>) {
  const groupId = String(item?.mergeGroupId ?? item?.id ?? item?.groupId ?? '');
  if (!groupId) return;
  try {
    await ElMessageBox.confirm(`确认通过合并审批组「${groupId}」？`, '通过确认', {
      type: 'warning',
    });
  } catch {
    logger.warn('用户取消合并通过操作');
    return;
  }
  try {
    await mergePass({ mergeGroupId: groupId }, { comment: mergeComment.value });
    ElMessage.success('合并审批通过成功');
    mergeComment.value = '';
    loadMergeable();
  } catch (error) {
    logger.warn('合并审批通过失败', error);
  }
}

/** 驳回合并审批 */
async function handleMergeReject(item: Record<string, Record<string, unknown>>) {
  const groupId = String(item?.mergeGroupId ?? item?.id ?? item?.groupId ?? '');
  if (!groupId) return;
  try {
    await ElMessageBox.confirm(`确认驳回合并审批组「${groupId}」？`, '驳回确认', {
      type: 'warning',
    });
  } catch {
    logger.warn('用户取消合并驳回操作');
    return;
  }
  try {
    await mergeReject({ mergeGroupId: groupId }, { comment: mergeComment.value });
    ElMessage.success('合并审批驳回成功');
    mergeComment.value = '';
    loadMergeable();
  } catch (error) {
    logger.warn('合并审批驳回失败', error);
  }
}

/** 执行合并（手动指定实例 ID） */
async function handleMerge() {
  if (!mergeInstanceIds.value.trim()) {
    ElMessage.warning('请输入要合并的实例 ID（逗号分隔）');
    return;
  }
  const ids = mergeInstanceIds.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    const result = await merge({ instanceIds: ids });
    ElMessage.success(`合并成功，组 ID: ${result?.value ?? ''}`);
    mergeInstanceIds.value = '';
    loadMergeable();
  } catch (error) {
    logger.warn('合并操作失败', error);
  }
}

// 页面加载时自动刷新可合并列表
onMounted(() => {
  if (activeTab.value === 'merge') {
    loadMergeable();
  }
});

/** Tab 切换事件 */
function handleTabChange(name: string) {
  if (name === 'merge' && mergeableList.value.length === 0) {
    loadMergeable();
  }
}

// ==================== Tab 3: 离线转办 ====================

/** 自动转办 -- 授权 ID */
const autoForwardAuthId = ref('');
/** 手动转办 -- 用户选择 */
const manualForwardUserId = ref('');
const manualForwardDelegateId = ref('');
/** 手动转办原因 */
const manualReason = ref('');

/** 触发自动转办 */
async function handleAutoForward() {
  if (!autoForwardAuthId.value.trim()) {
    ElMessage.warning('请输入授权 ID');
    return;
  }
  try {
    const count = await autoForward({ authId: autoForwardAuthId.value.trim() });
    ElMessage.success(`自动转办成功，转办 ${count} 条任务`);
    autoForwardAuthId.value = '';
  } catch (error) {
    logger.warn('自动转办失败', error);
  }
}

/** 触发手动转办 */
async function handleManualForward() {
  if (!manualForwardUserId.value.trim() || !manualForwardDelegateId.value.trim()) {
    ElMessage.warning('请选择源用户和目标用户');
    return;
  }
  try {
    const count = await manualForward({
      userId: manualForwardUserId.value.trim(),
      delegateUserId: manualForwardDelegateId.value.trim(),
    });
    ElMessage.success(`手动转办成功，转办 ${count} 条任务`);
    manualForwardUserId.value = '';
    manualForwardDelegateId.value = '';
    manualReason.value = '';
  } catch (error) {
    logger.warn('手动转办失败', error);
  }
}

// ==================== Tab 4: 报告推送 ====================

/** 周报历史 */
const weeklyReportData = ref<Record<string, Record<string, unknown>> | null>(null);
/** 月报历史 */
const monthlyReportData = ref<Record<string, Record<string, unknown>> | null>(null);

/** 加载周报历史 */
async function loadWeeklyReport() {
  try {
    const data = await weeklyReport();
    weeklyReportData.value = data;
    logger.info('加载周报历史成功');
  } catch (error) {
    logger.warn('加载周报历史失败', error);
  }
}

/** 加载月报历史 */
async function loadMonthlyReport() {
  try {
    const data = await monthlyReport();
    monthlyReportData.value = data;
    logger.info('加载月报历史成功');
  } catch (error) {
    logger.warn('加载月报历史失败', error);
  }
}

/** 手动触发周报 */
async function handleSendWeekly() {
  try {
    await sendWeekly();
    ElMessage.success('周报推送已触发');
    loadWeeklyReport();
  } catch (error) {
    logger.warn('周报推送失败', error);
  }
}

/** 手动触发月报 */
async function handleSendMonthly() {
  try {
    await sendMonthly();
    ElMessage.success('月报推送已触发');
    loadMonthlyReport();
  } catch (error) {
    logger.warn('月报推送失败', error);
  }
}
</script>
<template>
  <Page auto-content-height>
    <ElTabs v-model="activeTab" class="px-4 pt-2" @tab-change="handleTabChange">
      <!-- ==================== Tab 1: 催办中心 ==================== -->
      <ElTabPane label="催办中心" name="urge">
        <div class="p-4 space-y-4">
          <!-- 查询区域 -->
          <ElCard shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <span class="text-sm font-medium text-gray-700">催办冷却查询</span>
            </template>
            <ElForm inline>
              <ElFormItem label="流程实例 ID">
                <ElInput
                  v-model="urgeInstanceId"
                  placeholder="请输入流程实例 ID"
                  style="width: 280px"
                  clearable
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" @click="handleQueryUrgeCooldown">查询</ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <!-- 催办结果 -->
          <ElCard v-if="urgeCooldownData" shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <span class="text-sm font-medium text-gray-700">催办冷却状态</span>
            </template>
            <ElSpace :size="20" alignment="flex-start">
              <ElStatistic
                label="剩余冷却时间（秒）"
                :value="urgeRemainingSeconds"
                :value-style="{ color: urgeRemainingSeconds > 0 ? '#e6a23c' : '#67c23a' }"
              />
              <ElStatistic label="冷却状态" :value="urgeRemainingSeconds > 0 ? '冷却中' : '可催办'" />
            </ElSpace>
            <div v-if="approvedUserList.length > 0" class="mt-3">
              <div class="text-xs text-gray-500 mb-1">已审批用户</div>
              <ElSpace :size="4" wrap>
                <ElTag v-for="user in approvedUserList" :key="user" size="small" type="success">
                  {{ user }}
                </ElTag>
              </ElSpace>
            </div>
          </ElCard>

          <ElEmpty v-if="!urgeCooldownData" description="请输入流程实例 ID 后点击查询" :image-size="80" />
        </div>
      </ElTabPane>

      <!-- ==================== Tab 2: 合并审批 ==================== -->
      <ElTabPane label="合并审批" name="merge">
        <div class="p-4 space-y-4">
          <!-- 手动合并 -->
          <ElCard shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <span class="text-sm font-medium text-gray-700">手动合并实例</span>
            </template>
            <ElForm>
              <ElFormItem label="实例 ID 列表">
                <ElInput
                  v-model="mergeInstanceIds"
                  placeholder="输入多个实例 ID，逗号分隔"
                  style="width: 400px"
                  clearable
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" @click="handleMerge">执行合并</ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <!-- 可合并列表 -->
          <ElCard shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">可合并审批列表</span>
                <ElButton size="small" @click="loadMergeable">刷新</ElButton>
              </div>
            </template>
            <ElTable :data="mergeableList" stripe border max-height="400">
              <ElTableColumn prop="mergeGroupId" label="合并组 ID" width="180" />
              <ElTableColumn prop="flowName" label="流程名称" width="160" />
              <ElTableColumn prop="count" label="实例数量" width="100" />
              <ElTableColumn prop="createTime" label="创建时间" width="170" />
              <ElTableColumn label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <ElSpace :size="4">
                    <ElButton size="small" link type="primary" @click="handleViewMergeGroup(row)">
                      详情
                    </ElButton>
                    <ElButton size="small" link type="success" @click="handleMergePass(row)">
                      通过
                    </ElButton>
                    <ElButton size="small" link type="danger" @click="handleMergeReject(row)">
                      驳回
                    </ElButton>
                  </ElSpace>
                </template>
              </ElTableColumn>
            </ElTable>
            <div class="mt-3">
              <ElInput
                v-model="mergeComment"
                placeholder="审批意见（可选）"
                type="textarea"
                :rows="2"
                style="max-width: 400px"
              />
            </div>
          </ElCard>

          <!-- 合并组详情 -->
          <ElCard v-if="mergeGroupDetail" shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <span class="text-sm font-medium text-gray-700">合并组详情</span>
            </template>
            <ElDescriptions :column="2" border size="small">
              <ElDescriptionsItem
                v-for="(value, key) in mergeGroupDetail"
                :key="key"
                :label="key"
              >
                {{ typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-') }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>
        </div>
      </ElTabPane>

      <!-- ==================== Tab 3: 离线转办 ==================== -->
      <ElTabPane label="离线转办" name="forward">
        <div class="p-4 space-y-4">
          <!-- 自动转办 -->
          <ElCard shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <span class="text-sm font-medium text-gray-700">自动转办</span>
            </template>
            <p class="text-xs text-gray-500 mb-3">
              基于预设授权规则自动将离线用户的审批任务转交给指定代理人。
            </p>
            <ElForm>
              <ElFormItem label="授权 ID">
                <ElInput
                  v-model="autoForwardAuthId"
                  placeholder="输入授权规则 ID"
                  style="width: 320px"
                  clearable
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" @click="handleAutoForward">触发自动转办</ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <!-- 手动转办 -->
          <ElCard shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <span class="text-sm font-medium text-gray-700">手动转办</span>
            </template>
            <p class="text-xs text-gray-500 mb-3">
              手动将指定用户的审批任务全部转交给目标用户。
            </p>
            <ElForm>
              <ElFormItem label="源用户 ID">
                <ElInput
                  v-model="manualForwardUserId"
                  placeholder="待转出的用户 ID"
                  style="width: 320px"
                  clearable
                />
              </ElFormItem>
              <ElFormItem label="目标用户 ID">
                <ElInput
                  v-model="manualForwardDelegateId"
                  placeholder="接收转办的用户 ID"
                  style="width: 320px"
                  clearable
                />
              </ElFormItem>
              <ElFormItem label="转办原因">
                <ElInput
                  v-model="manualReason"
                  placeholder="转办原因（可选）"
                  style="width: 320px"
                  clearable
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" @click="handleManualForward">执行手动转办</ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>
        </div>
      </ElTabPane>

      <!-- ==================== Tab 4: 报告推送 ==================== -->
      <ElTabPane label="报告推送" name="report">
        <div class="p-4 space-y-4">
          <!-- 周报 -->
          <ElCard shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">周报推送</span>
                <ElSpace>
                  <ElButton size="small" @click="loadWeeklyReport">刷新历史</ElButton>
                  <ElButton type="primary" size="small" @click="handleSendWeekly">
                    手动推送
                  </ElButton>
                </ElSpace>
              </div>
            </template>
            <div v-if="weeklyReportData" class="grid grid-cols-2 gap-3">
              <div
                v-for="(value, key) in weeklyReportData"
                :key="key"
                class="rounded border border-gray-100 bg-gray-50 p-3"
              >
                <div class="text-xs text-gray-500 mb-1">{{ key }}</div>
                <div class="text-sm font-medium">
                  {{ typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-') }}
                </div>
              </div>
            </div>
            <ElEmpty v-else description="暂无周报记录，点击刷新或手动推送" :image-size="60" />
          </ElCard>

          <!-- 月报 -->
          <ElCard shadow="never" class="rounded-lg border border-gray-200">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">月报推送</span>
                <ElSpace>
                  <ElButton size="small" @click="loadMonthlyReport">刷新历史</ElButton>
                  <ElButton type="primary" size="small" @click="handleSendMonthly">
                    手动推送
                  </ElButton>
                </ElSpace>
              </div>
            </template>
            <div v-if="monthlyReportData" class="grid grid-cols-2 gap-3">
              <div
                v-for="(value, key) in monthlyReportData"
                :key="key"
                class="rounded border border-gray-100 bg-gray-50 p-3"
              >
                <div class="text-xs text-gray-500 mb-1">{{ key }}</div>
                <div class="text-sm font-medium">
                  {{ typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-') }}
                </div>
              </div>
            </div>
            <ElEmpty v-else description="暂无月报记录，点击刷新或手动推送" :image-size="60" />
          </ElCard>
        </div>
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
