<!--
 * 流程仿真运行页面
 *
 * <p>选择流程定义、传入参数、运行仿真、可视化展示预测执行路径。
 *
 * @path apps\workflow-web\src\views\simulation\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程仿真运行
 * <p>消费后端契约 FlowSimulationController（apps/workflow-web/src/api/flowSimulation.ts）。
 * <p>包含：流程定义选择、参数配置、仿真执行、预测路径可视化。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import {
  ElButton,
  ElCard,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElStep,
  ElSteps,
  ElTabPane,
  ElTabs,
  ElTag,
  ElMessage,
} from 'element-plus';
import { computed, ref } from 'vue';
import { runSimulation } from '#/api/flowSimulation';
import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('workflow-simulation');

defineOptions({ name: 'FlowSimulationManagement' });

/** 当前激活的 Tab */
const activeTab = ref('config');

/** 流程定义选择 */
const selectedFlowCode = ref('');

/** 仿真参数 JSON */
const paramJson = ref('{\n  "amount": 5000,\n  "department": "技术部",\n  "priority": "HIGH"\n}');

/** 是否正在仿真中 */
const running = ref(false);

/** 仿真结果 */
const simulationResult = ref<Record<string, unknown> | null>(null);

/** 流程定义选项（模拟数据） */
const flowDefinitionOptions = [
  { label: '请假申请流程 - leave_apply', value: 'leave_apply' },
  { label: '采购审批流程 - purchase_approval', value: 'purchase_approval' },
  { label: '报销申请流程 - expense_reimburse', value: 'expense_reimburse' },
  { label: '入职审批流程 - onboarding_flow', value: 'onboarding_flow' },
  { label: '项目立项流程 - project_initiation', value: 'project_initiation' },
];

/** 预测节点列表（从仿真结果提取） */
const predictedNodes = computed(() => {
  if (!simulationResult.value) return [];
  return (simulationResult.value.nodes as Record<string, unknown>[]) ?? [];
});

/** 预计总耗时（格式化） */
const estimatedTotalDuration = computed(() => {
  if (!simulationResult.value) return '--';
  const ms = (simulationResult.value.estimatedDurationMs as number) ?? 0;
  if (ms < 60000) return `${Math.round(ms / 1000)} 秒`;
  if (ms < 3600000) return `${Math.round(ms / 60000)} 分钟`;
  return `${(ms / 3600000).toFixed(1)} 小时`;
});

/** 仿真状态标签类型 */
const statusTagType = computed(() => {
  const status = (simulationResult.value?.status as string) ?? '';
  if (status === 'SUCCESS') return 'success';
  if (status === 'PARTIAL') return 'warning';
  if (status === 'FAILED') return 'danger';
  return 'info';
});

/** 运行仿真 */
async function handleRunSimulation(): Promise<void> {
  if (!selectedFlowCode.value) {
    ElMessage.warning('请先选择流程定义');
    return;
  }

  // 校验 JSON 格式
  let parsedParams: Record<string, unknown>;
  try {
    parsedParams = JSON.parse(paramJson.value);
  } catch {
    ElMessage.error('仿真参数 JSON 格式错误，请检查输入');
    return;
  }

  running.value = true;
  simulationResult.value = null;
  try {
    const result = await runSimulation({
      flowCode: selectedFlowCode.value,
      variables: parsedParams,
    });
    simulationResult.value = result as Record<string, unknown>;
    activeTab.value = 'result';
    ElMessage.success('仿真运行完成');
  } catch (error) {
    logger.warn('流程仿真运行失败', error);
    ElMessage.error('仿真运行失败，请查看日志');
  } finally {
    running.value = false;
  }
}

/** 重置表单 */
function handleReset(): void {
  selectedFlowCode.value = '';
  paramJson.value = '{\n  "amount": 5000,\n  "department": "技术部",\n  "priority": "HIGH"\n}';
  simulationResult.value = null;
  activeTab.value = 'config';
}
</script>

<template>
  <Page auto-content-height>
    <!-- 顶部标题栏 -->
    <div class="mb-4 flex items-center justify-between px-4 pt-3">
      <h1 class="text-xl font-bold text-gray-800">流程仿真</h1>
      <div class="flex items-center gap-3">
        <ElButton @click="handleReset">重置</ElButton>
        <ElButton type="primary" :loading="running" @click="handleRunSimulation">运行仿真</ElButton>
      </div>
    </div>

    <!-- 概览卡片（有结果时展示） -->
    <div v-if="simulationResult" class="mb-4 grid grid-cols-4 gap-4 px-4">
      <ElCard shadow="hover">
        <div class="text-center">
          <div class="text-sm text-gray-500">仿真状态</div>
          <ElTag :type="statusTagType" class="mt-1 text-base">
            {{ (simulationResult.status as string) ?? 'UNKNOWN' }}
          </ElTag>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="text-center">
          <div class="text-sm text-gray-500">预计总耗时</div>
          <div class="mt-1 text-2xl font-bold text-blue-600">{{ estimatedTotalDuration }}</div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="text-center">
          <div class="text-sm text-gray-500">预计节点数</div>
          <div class="mt-1 text-2xl font-bold text-green-600">{{ predictedNodes.length }}</div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="text-center">
          <div class="text-sm text-gray-500">流程编码</div>
          <div class="mt-1 text-base font-medium text-gray-700">
            {{ (simulationResult.flowCode as string) ?? selectedFlowCode }}
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 主内容区：Tab 切换 -->
    <div class="px-4 pb-4">
      <ElTabs v-model="activeTab" type="border-card">
        <!-- 参数配置 Tab -->
        <ElTabPane label="参数配置" name="config">
          <ElCard shadow="never">
            <ElForm label-width="120px" label-position="left">
              <ElFormItem label="流程定义">
                <ElSelect
                  v-model="selectedFlowCode"
                  placeholder="请选择流程定义"
                  filterable
                  clearable
                  class="w-full"
                >
                  <ElOption
                    v-for="opt in flowDefinitionOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="仿真参数">
                <ElInput
                  v-model="paramJson"
                  type="textarea"
                  :rows="12"
                  placeholder='请输入 JSON 格式的仿真参数，如 { "amount": 5000, "department": "技术部" }'
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="running" @click="handleRunSimulation">
                  运行仿真
                </ElButton>
                <ElButton @click="handleReset">重置</ElButton>
              </ElFormItem>
            </ElForm>
          </ElCard>
        </ElTabPane>

        <!-- 仿真结果 Tab -->
        <ElTabPane label="仿真结果" name="result">
          <div v-if="simulationResult">
            <!-- 预测执行路径（步骤条） -->
            <ElCard shadow="never" class="mb-4">
              <template #header>
                <span class="font-semibold text-gray-700">预测执行路径</span>
              </template>
              <ElSteps
                :active="predictedNodes.length"
                finish-status="success"
                align-center
                class="mt-4"
              >
                <ElStep
                  v-for="(node, index) in predictedNodes"
                  :key="index"
                  :title="(node.nodeName as string) ?? (node.nodeCode as string) ?? `节点 ${index + 1}`"
                >
                  <template #description>
                    <div class="mt-1 text-xs text-gray-500">
                      <div>编码: {{ (node.nodeCode as string) ?? '--' }}</div>
                      <div>
                        预计耗时:
                        {{ node.estimatedDurationMs ? `${Math.round((node.estimatedDurationMs as number) / 1000)}s` : '--' }}
                      </div>
                      <div>审批人: {{ (node.assigneeName as string) ?? (node.assignee as string) ?? '--' }}</div>
                      <div v-if="node.condition">
                        条件: <ElTag size="small" type="warning">{{ node.condition as string }}</ElTag>
                      </div>
                      <div v-if="node.branch">
                        分支: <ElTag size="small" type="info">{{ node.branch as string }}</ElTag>
                      </div>
                    </div>
                  </template>
                </ElStep>
              </ElSteps>
            </ElCard>

            <!-- 节点明细表格 -->
            <ElCard shadow="never">
              <template #header>
                <span class="font-semibold text-gray-700">节点执行明细</span>
              </template>
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 text-left">
                    <th class="px-4 py-2 font-medium text-gray-600">序号</th>
                    <th class="px-4 py-2 font-medium text-gray-600">节点名称</th>
                    <th class="px-4 py-2 font-medium text-gray-600">节点编码</th>
                    <th class="px-4 py-2 font-medium text-gray-600">审批人</th>
                    <th class="px-4 py-2 font-medium text-gray-600">预计耗时</th>
                    <th class="px-4 py-2 font-medium text-gray-600">条件/分支</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(node, index) in predictedNodes"
                    :key="index"
                    class="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td class="px-4 py-2 text-gray-500">{{ index + 1 }}</td>
                    <td class="px-4 py-2 font-medium">
                      {{ (node.nodeName as string) ?? '--' }}
                    </td>
                    <td class="px-4 py-2 text-gray-500">{{ (node.nodeCode as string) ?? '--' }}</td>
                    <td class="px-4 py-2">
                      {{ (node.assigneeName as string) ?? (node.assignee as string) ?? '--' }}
                    </td>
                    <td class="px-4 py-2">
                      {{
                        node.estimatedDurationMs
                          ? `${Math.round((node.estimatedDurationMs as number) / 1000)} 秒`
                          : '--'
                      }}
                    </td>
                    <td class="px-4 py-2">
                      <div v-if="node.condition" class="mb-1">
                        <ElTag size="small" type="warning">{{ node.condition as string }}</ElTag>
                      </div>
                      <div v-if="node.branch">
                        <ElTag size="small" type="info">{{ node.branch as string }}</ElTag>
                      </div>
                      <span v-if="!node.condition && !node.branch" class="text-gray-400">--</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </ElCard>
          </div>

          <!-- 无结果时展示空状态 -->
          <ElCard v-else shadow="never">
            <ElEmpty description="请先在「参数配置」Tab 中配置参数并运行仿真" />
          </ElCard>
        </ElTabPane>
      </ElTabs>
    </div>
  </Page>
</template>
