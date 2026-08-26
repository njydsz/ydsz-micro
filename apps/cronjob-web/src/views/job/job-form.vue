<!--
 * 定时任务（表单组件）
 *
 * @path apps\cronjob-web\src\views\job\job-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 定时任务（表单组件）
 * <p>定时任务的创建/编辑弹窗，字段对应契约 JobPostDTO/JobPutDTO（src/api/job.ts，auto-generated）：
 * 基础配置（名称/标识/分组/执行器/调度/Cron）+ 高级配置（参数/超时/慢阈值/锁TTL/Misfire/分片/时区/集群）。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import {
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { create, update, validateCron } from '#/api/job';
import type { JobVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 常用时区列表（完整列表见 Java TimeZone#getAvailableIDs） */
const COMMON_TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'UTC',
  'America/New_York',
  'Europe/London',
];

/** Misfire 策略（与后端 MisfirePolicy 枚举对齐） */
const MISFIRE_POLICIES = [
  { label: '立即执行（默认）', value: 'FIRE_NOW' },
  { label: '跳过本次', value: 'SKIP' },
  { label: '合并执行', value: 'COALESCE' },
];

/** 阻塞策略（与后端 blockStrategy 枚举对齐） */
const BLOCK_STRATEGIES = [
  { label: '串行跳过（默认）', value: 'SERIAL' },
  { label: '丢弃本次', value: 'DISCARD' },
  { label: '丢弃重叠', value: 'DISCARD_OVERLAPPING' },
  { label: '覆盖执行', value: 'COVER' },
  { label: '并行执行', value: 'CONCURRENT' },
];

/** 重试退避策略 */
const RETRY_BACKOFFS = [
  { label: '固定间隔', value: 'FIXED' },
  { label: '指数退避', value: 'EXPONENTIAL' },
];

/** 表单状态（字段对应 JobPostDTO / JobPutDTO，P0-补全：新增高级配置字段） */
interface JobFormState {
  id: string;
  jobName: string;
  jobKey: string;
  jobGroup: string;
  handler: string;
  cronExpression: string;
  scheduleType: string;
  remark: string;
  fixedRateMs: number | undefined;
  fixedDelayMs: number | undefined;
  paramsJson: string;
  lockTtlMs: number | undefined;
  timeoutMs: number | undefined;
  slowThresholdMs: number | undefined;
  misfirePolicy: string;
  shardTotal: number | undefined;
  timezone: string;
  cluster: string;
  maxRetries: number | undefined;
  retryIntervalMs: number | undefined;
  retryBackoff: string;
  slaMs: number | undefined;
  blockStrategy: string;
  maxConsecutiveFails: number | undefined;
  autoResumeAfterMinutes: number | undefined;
  priority: number | undefined;
  canaryRatio: number | undefined;
  canaryHandler: string;
}

const DEFAULT_FORM = (): JobFormState => ({
  id: '',
  jobName: '',
  jobKey: '',
  jobGroup: '',
  handler: '',
  cronExpression: '',
  scheduleType: 'CRON',
  remark: '',
  fixedRateMs: undefined,
  fixedDelayMs: undefined,
  paramsJson: '',
  lockTtlMs: undefined,
  timeoutMs: undefined,
  slowThresholdMs: undefined,
  misfirePolicy: 'FIRE_NOW',
  shardTotal: 1,
  timezone: 'Asia/Shanghai',
  cluster: '',
  maxRetries: undefined,
  retryIntervalMs: undefined,
  retryBackoff: 'FIXED',
  slaMs: undefined,
  blockStrategy: 'SERIAL',
  maxConsecutiveFails: undefined,
  autoResumeAfterMinutes: undefined,
  priority: undefined,
  canaryRatio: undefined,
  canaryHandler: '',
});

const formData = reactive<JobFormState>(DEFAULT_FORM());

const rules = {
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  cronExpression: [{ required: true, message: '请输入Cron表达式', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: JobVO }>();
    if (data?.record) {
      isEdit.value = true;
      const r = data.record;
      Object.assign(formData, {
        id: r.id ?? '',
        jobName: r.jobName ?? '',
        jobKey: r.jobKey ?? '',
        jobGroup: r.jobGroup ?? '',
        handler: r.handler ?? '',
        cronExpression: r.cronExpression ?? '',
        scheduleType: r.scheduleType ?? 'CRON',
        remark: r.jobRemark ?? '',
        fixedRateMs: r.fixedRateMs ?? undefined,
        fixedDelayMs: r.fixedDelayMs ?? undefined,
        paramsJson: r.paramsJson ?? '',
        lockTtlMs: r.lockTtlMs ?? undefined,
        timeoutMs: r.timeoutMs ?? undefined,
        slowThresholdMs: r.slowThresholdMs ?? undefined,
        misfirePolicy: r.misfirePolicy ?? 'FIRE_NOW',
        shardTotal: r.shardTotal ?? 1,
        timezone: r.timezone ?? 'Asia/Shanghai',
        cluster: r.cluster ?? '',
        maxRetries: r.maxRetries ?? undefined,
        retryIntervalMs: r.retryIntervalMs ?? undefined,
        retryBackoff: r.retryBackoff ?? 'FIXED',
        slaMs: r.slaMs ?? undefined,
        blockStrategy: r.blockStrategy ?? 'SERIAL',
        maxConsecutiveFails: r.maxConsecutiveFails ?? undefined,
        autoResumeAfterMinutes: r.autoResumeAfterMinutes ?? undefined,
        priority: r.priority ?? undefined,
        canaryRatio: r.canaryRatio ?? undefined,
        canaryHandler: r.canaryHandler ?? '',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, DEFAULT_FORM());
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      const payload = {
        jobName: formData.jobName,
        jobKey: formData.jobKey,
        jobGroup: formData.jobGroup || undefined,
        handler: formData.handler,
        cronExpression: formData.cronExpression,
        scheduleType: formData.scheduleType,
        remark: formData.remark || undefined,
        fixedRateMs: formData.scheduleType === 'FIXED_RATE' ? formData.fixedRateMs : undefined,
        fixedDelayMs: formData.scheduleType === 'FIXED_DELAY' ? formData.fixedDelayMs : undefined,
        paramsJson: formData.paramsJson || undefined,
        lockTtlMs: formData.lockTtlMs,
        timeoutMs: formData.timeoutMs,
        slowThresholdMs: formData.slowThresholdMs,
        misfirePolicy: formData.misfirePolicy,
        shardTotal: formData.shardTotal,
        timezone: formData.timezone,
        cluster: formData.cluster || undefined,
        maxRetries: formData.maxRetries,
        retryIntervalMs: formData.retryIntervalMs,
        retryBackoff: formData.retryBackoff,
        slaMs: formData.slaMs,
        blockStrategy: formData.blockStrategy,
        maxConsecutiveFails: formData.maxConsecutiveFails,
        autoResumeAfterMinutes: formData.autoResumeAfterMinutes,
        priority: formData.priority,
        canaryRatio: formData.canaryRatio,
        canaryHandler: formData.canaryRatio ? formData.canaryHandler || undefined : undefined,
      };
      if (isEdit.value) {
        await update({ ...payload, id: formData.id || undefined });
        ElMessage.success('更新成功');
      } else {
        await create(payload);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑定时任务' : '新增定时任务'));

/** 校验 Cron 表达式（validateCron 返回 unknown，仅做成功提示与失败提示） */
async function handleValidateCron() {
  if (!formData.cronExpression) {
    ElMessage.warning('请先输入Cron表达式');
    return;
  }
  try {
    await validateCron({ expr: formData.cronExpression });
    ElMessage.success('Cron 表达式校验通过');
  } catch {
    ElMessage.error('Cron 表达式无效');
  }
}
</script>

<template>
  <Modal :title="title" :width="720">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="110px"
      label-position="right"
    >
      <ElFormItem label="任务名称" prop="jobName">
        <ElInput v-model="formData.jobName" placeholder="请输入任务名称" />
      </ElFormItem>
      <ElFormItem label="任务标识" prop="jobKey">
        <ElInput v-model="formData.jobKey" placeholder="请输入任务标识" />
      </ElFormItem>
      <ElFormItem label="任务分组" prop="jobGroup">
        <ElInput v-model="formData.jobGroup" placeholder="请输入任务分组" />
      </ElFormItem>
      <ElFormItem label="执行器" prop="handler">
        <ElInput v-model="formData.handler" placeholder="请输入执行器 Handler" />
      </ElFormItem>
      <ElFormItem label="调度类型" prop="scheduleType">
        <ElSelect v-model="formData.scheduleType" placeholder="请选择调度类型" class="w-full">
          <ElOption label="Cron" value="CRON" />
          <ElOption label="固定速率" value="FIXED_RATE" />
          <ElOption label="固定延迟" value="FIXED_DELAY" />
          <ElOption label="仅手动触发" value="API" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="formData.scheduleType === 'CRON'" label="Cron表达式" prop="cronExpression">
        <div class="flex w-full gap-2">
          <ElInput v-model="formData.cronExpression" placeholder="请输入Cron表达式" />
          <ElButton @click="handleValidateCron">校验</ElButton>
        </div>
      </ElFormItem>
      <ElFormItem v-if="formData.scheduleType === 'FIXED_RATE'" label="固定速率间隔(ms)">
        <ElInputNumber
          v-model="formData.fixedRateMs"
          :min="1"
          :step="1000"
          class="w-full"
          placeholder="如 30000=每30秒"
        />
      </ElFormItem>
      <ElFormItem v-if="formData.scheduleType === 'FIXED_DELAY'" label="固定延迟间隔(ms)">
        <ElInputNumber
          v-model="formData.fixedDelayMs"
          :min="1"
          :step="1000"
          class="w-full"
          placeholder="上次完成后等待毫秒数"
        />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </ElFormItem>

      <ElCollapse class="mt-2">
        <ElCollapseItem title="高级配置（参数 / 超时 / 重试 / 分片 / 时区）" name="advanced">
          <ElFormItem label="任务参数(JSON)">
            <ElInput
              v-model="formData.paramsJson"
              type="textarea"
              :rows="3"
              placeholder='如 {"url":"http://example.com","retry":3}'
            />
          </ElFormItem>
          <ElFormItem label="超时时间(ms)">
            <ElInputNumber
              v-model="formData.timeoutMs"
              :min="1"
              :step="1000"
              class="w-full"
              placeholder="null=不限超时"
            />
          </ElFormItem>
          <ElFormItem label="慢任务阈值(ms)">
            <ElInputNumber
              v-model="formData.slowThresholdMs"
              :min="1"
              :step="100"
              class="w-full"
              placeholder="超过则标记 is_slow"
            />
          </ElFormItem>
          <ElFormItem label="SLA阈值(ms)">
            <ElInputNumber
              v-model="formData.slaMs"
              :min="1"
              :step="1000"
              class="w-full"
              placeholder="超过触发 SLA_WARNING 告警"
            />
          </ElFormItem>
          <ElFormItem label="锁TTL(ms)">
            <ElInputNumber
              v-model="formData.lockTtlMs"
              :min="30000"
              :step="60000"
              class="w-full"
              placeholder="null=全局默认 5min"
            />
          </ElFormItem>
          <ElFormItem label="Misfire策略">
            <ElSelect v-model="formData.misfirePolicy" class="w-full">
              <ElOption
                v-for="item in MISFIRE_POLICIES"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="阻塞策略">
            <ElSelect v-model="formData.blockStrategy" class="w-full">
              <ElOption
                v-for="item in BLOCK_STRATEGIES"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="最大重试次数">
            <ElInputNumber
              v-model="formData.maxRetries"
              :min="0"
              :step="1"
              class="w-full"
              placeholder="null=不重试"
            />
          </ElFormItem>
          <ElFormItem label="重试间隔(ms)">
            <ElInputNumber
              v-model="formData.retryIntervalMs"
              :min="1"
              :step="1000"
              class="w-full"
            />
          </ElFormItem>
          <ElFormItem label="重试退避">
            <ElSelect v-model="formData.retryBackoff" class="w-full">
              <ElOption
                v-for="item in RETRY_BACKOFFS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="熔断阈值">
            <ElInputNumber
              v-model="formData.maxConsecutiveFails"
              :min="1"
              :step="1"
              class="w-full"
              placeholder="连续失败次数，达到后自动暂停"
            />
          </ElFormItem>
          <ElFormItem label="自动恢复(分钟)">
            <ElInputNumber
              v-model="formData.autoResumeAfterMinutes"
              :min="1"
              :step="5"
              class="w-full"
              placeholder="熔断后自动恢复"
            />
          </ElFormItem>
          <ElFormItem label="优先级">
            <ElInputNumber
              v-model="formData.priority"
              :min="0"
              :step="1"
              class="w-full"
              placeholder="数值越大越先派发"
            />
          </ElFormItem>
          <ElFormItem label="分片总数">
            <ElInputNumber
              v-model="formData.shardTotal"
              :min="1"
              :step="1"
              class="w-full"
              placeholder="1=非分片任务"
            />
          </ElFormItem>
          <ElFormItem label="时区">
            <ElSelect v-model="formData.timezone" class="w-full" filterable allow-create>
              <ElOption v-for="tz in COMMON_TIMEZONES" :key="tz" :label="tz" :value="tz" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="目标集群">
            <ElInput v-model="formData.cluster" placeholder="跨集群调度，留空=本地集群" />
          </ElFormItem>
          <ElFormItem label="灰度比例(%)">
            <ElInputNumber
              v-model="formData.canaryRatio"
              :min="0"
              :max="100"
              :step="5"
              class="w-full"
              placeholder="0-100，按 jobKey 哈希分桶"
            />
          </ElFormItem>
          <ElFormItem v-if="formData.canaryRatio" label="灰度处理器">
            <ElInput v-model="formData.canaryHandler" placeholder="canaryRatio>0 时生效" />
          </ElFormItem>
        </ElCollapseItem>
      </ElCollapse>
    </ElForm>
  </Modal>
</template>
