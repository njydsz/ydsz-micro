<!--
 * 定时任务（表单组件）
 *
 * @path apps\cronjob-web\src\views\job\job-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { $t } from '@ydsz/locales';
/**
 * 定时任务（表单组件）
 * <p>定时任务的创建/编辑弹窗，字段对应契约 JobPostDTO/JobPutDTO（src/api/job.ts，auto-generated）：
 * 基础配置（名称/标识/分组/执行器/调度/Cron）+ 高级配置（参数/超时/慢阈值/锁TTL/Misfire/分片/时区/集群）。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import {
  YdAccordion,
  YdAccordionContent,
  YdAccordionItem,
  YdAccordionTrigger,
  YdInput,
  YdSelectBase,
  YdSelectContentBase,
  YdSelectItemBase,
  YdSelectTriggerBase,
  YdTextarea,
  YdForm,
  YdFormItem,
} from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { showToast } from '@ydsz/notification';

import { create, update } from '#/api/job';
import type { JobVO } from '#/api/models';

import { createLogger } from '@ydsz-core/shared/utils';
import CronBuilder from '#/components/cron-builder/index.vue';

const logger = createLogger('cronjob-job');

const emit = defineEmits<{ success: [] }>();
const { t } = useI18n();

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
const MISFIRE_POLICIES = computed(() => [
  { label: t('business.misfirePolicyFireNow'), value: 'FIRE_NOW' },
  { label: t('business.misfirePolicySkip'), value: 'SKIP' },
  { label: t('business.misfirePolicyCoalesce'), value: 'COALESCE' },
]);

/** 阻塞策略（与后端 blockStrategy 枚举对齐） */
const BLOCK_STRATEGIES = computed(() => [
  { label: t('business.blockStrategySerial'), value: 'SERIAL' },
  { label: t('business.blockStrategyDiscard'), value: 'DISCARD' },
  { label: t('business.blockStrategyDiscardOverlapping'), value: 'DISCARD_OVERLAPPING' },
  { label: t('business.blockStrategyCover'), value: 'COVER' },
  { label: t('business.blockStrategyConcurrent'), value: 'CONCURRENT' },
]);

/** 重试退避策略 */
const RETRY_BACKOFFS = computed(() => [
  { label: t('business.retryBackoffFixed'), value: 'FIXED' },
  { label: t('business.retryBackoffExponential'), value: 'EXPONENTIAL' },
]);

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
  jobName: [{ required: true, message: t('business.jobNameRequired'), trigger: 'blur' }],
  cronExpression: [
    { required: true, message: t('business.cronExpressionRequired'), trigger: 'blur' },
  ],
};

const [Modal, modalApi] = useYdModal({
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
      logger.warn('表单校验未通过');
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
        showToast.success($t('operation.update.success'));
      } else {
        await create(payload);
        showToast.success($t('operation.create.success'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() =>
  isEdit.value ? t('business.jobEditTitle') : t('business.jobCreateTitle'),
);

/** 判断给定字段名在 rules 中是否包含 required 校验 */
function isRequired(field: string): boolean {
  const fieldRules = rules[field];
  if (!fieldRules) return false;
  if (Array.isArray(fieldRules)) return fieldRules.some((r) => r.required);
  return false;
}
</script>

<template>
  <Modal :title="title" :width="720">
    <YdForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="110px"
      label-position="right"
    >
      <YdFormItem prop="jobName">
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">
          <span v-if="isRequired('jobName')" class="mr-0.5 text-red-500">*</span>
          {{ t('business.jobName') }}
        </label>
        <YdInput v-model="formData.jobName" :placeholder="t('business.jobNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem>
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
          t('business.jobKey')
        }}</label>
        <YdInput v-model="formData.jobKey" :placeholder="t('business.jobKeyPlaceholder')" />
      </YdFormItem>
      <YdFormItem>
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
          t('business.jobGroup')
        }}</label>
        <YdInput v-model="formData.jobGroup" :placeholder="t('business.jobGroupPlaceholder')" />
      </YdFormItem>
      <YdFormItem>
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
          t('business.handler')
        }}</label>
        <YdInput v-model="formData.handler" :placeholder="t('business.handlerPlaceholder')" />
      </YdFormItem>
      <YdFormItem>
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
          t('business.scheduleType')
        }}</label>
        <YdSelectBase v-model="formData.scheduleType">
          <YdSelectTriggerBase :placeholder="t('business.scheduleTypePlaceholder')" class="w-full" />
          <YdSelectContentBase>
            <YdSelectItemBase value="CRON">Cron</YdSelectItemBase>
            <YdSelectItemBase value="FIXED_RATE">{{
              t('business.scheduleTypeFixedRate')
            }}</YdSelectItemBase>
            <YdSelectItemBase value="FIXED_DELAY">{{
              t('business.scheduleTypeFixedDelay')
            }}</YdSelectItemBase>
            <YdSelectItemBase value="API">{{ t('business.scheduleTypeApi') }}</YdSelectItemBase>
          </YdSelectContentBase>
        </YdSelectBase>
      </YdFormItem>
      <YdFormItem v-if="formData.scheduleType === 'CRON'" prop="cronExpression">
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">
          <span v-if="isRequired('cronExpression')" class="mr-0.5 text-red-500">*</span>
          {{ t('business.cronExpression') }}
        </label>
        <CronBuilder v-model="formData.cronExpression" />
      </YdFormItem>
      <YdFormItem v-if="formData.scheduleType === 'FIXED_RATE'">
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
          t('business.fixedRateIntervalLabel')
        }}</label>
        <YdInput
          v-model="formData.fixedRateMs"
          type="number"
          :min="1"
          :step="1000"
          class="w-full"
          :placeholder="t('business.fixedRateIntervalPlaceholder')"
        />
      </YdFormItem>
      <YdFormItem v-if="formData.scheduleType === 'FIXED_DELAY'">
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
          t('business.fixedDelayIntervalLabel')
        }}</label>
        <YdInput
          v-model="formData.fixedDelayMs"
          type="number"
          :min="1"
          :step="1000"
          class="w-full"
          :placeholder="t('business.fixedDelayIntervalPlaceholder')"
        />
      </YdFormItem>
      <YdFormItem>
        <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
          t('business.remark')
        }}</label>
        <YdTextarea
          v-model="formData.remark"
          :placeholder="t('business.remarkPlaceholder')"
          :rows="2"
        />
      </YdFormItem>

      <YdAccordion type="single" collapsible class="mt-2 w-full">
        <YdAccordionItem value="advanced">
          <YdAccordionTrigger>{{ t('business.advancedConfigTrigger') }}</YdAccordionTrigger>
          <YdAccordionContent>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.paramsJsonLabel')
              }}</label>
              <YdTextarea
                v-model="formData.paramsJson"
                :rows="3"
                :placeholder="t('business.paramsJsonPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.timeoutLabel')
              }}</label>
              <YdInput
                v-model="formData.timeoutMs"
                type="number"
                :min="1"
                :step="1000"
                class="w-full"
                :placeholder="t('business.timeoutPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.slowThresholdLabel')
              }}</label>
              <YdInput
                v-model="formData.slowThresholdMs"
                type="number"
                :min="1"
                :step="100"
                class="w-full"
                :placeholder="t('business.slowThresholdPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.slaThresholdLabel')
              }}</label>
              <YdInput
                v-model="formData.slaMs"
                type="number"
                :min="1"
                :step="1000"
                class="w-full"
                :placeholder="t('business.slaThresholdPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.lockTtlLabel')
              }}</label>
              <YdInput
                v-model="formData.lockTtlMs"
                type="number"
                :min="30000"
                :step="60000"
                class="w-full"
                :placeholder="t('business.lockTtlPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.misfirePolicyLabel')
              }}</label>
              <YdSelectBase v-model="formData.misfirePolicy" class="w-full">
                <YdSelectTriggerBase class="w-full" />
                <YdSelectContentBase>
                  <YdSelectItemBase
                    v-for="item in MISFIRE_POLICIES"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </YdSelectItemBase>
                </YdSelectContentBase>
              </YdSelectBase>
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.blockStrategyLabel')
              }}</label>
              <YdSelectBase v-model="formData.blockStrategy">
                <YdSelectTriggerBase class="w-full" />
                <YdSelectContentBase>
                  <YdSelectItemBase
                    v-for="item in BLOCK_STRATEGIES"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </YdSelectItemBase>
                </YdSelectContentBase>
              </YdSelectBase>
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.maxRetriesLabel')
              }}</label>
              <YdInput
                v-model="formData.maxRetries"
                type="number"
                :min="0"
                :step="1"
                class="w-full"
                :placeholder="t('business.maxRetriesPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.retryIntervalLabel')
              }}</label>
              <YdInput
                v-model="formData.retryIntervalMs"
                type="number"
                :min="1"
                :step="1000"
                class="w-full"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.retryBackoffLabel')
              }}</label>
              <YdSelectBase v-model="formData.retryBackoff">
                <YdSelectTriggerBase class="w-full" />
                <YdSelectContentBase>
                  <YdSelectItemBase
                    v-for="item in RETRY_BACKOFFS"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </YdSelectItemBase>
                </YdSelectContentBase>
              </YdSelectBase>
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.circuitBreakerThresholdLabel')
              }}</label>
              <YdInput
                v-model="formData.maxConsecutiveFails"
                type="number"
                :min="1"
                :step="1"
                class="w-full"
                :placeholder="t('business.circuitBreakerThresholdPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.autoResumeLabel')
              }}</label>
              <YdInput
                v-model="formData.autoResumeAfterMinutes"
                type="number"
                :min="1"
                :step="5"
                class="w-full"
                :placeholder="t('business.autoResumePlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.priorityLabel')
              }}</label>
              <YdInput
                v-model="formData.priority"
                type="number"
                :min="0"
                :step="1"
                class="w-full"
                :placeholder="t('business.priorityPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.shardTotalLabel')
              }}</label>
              <YdInput
                v-model="formData.shardTotal"
                type="number"
                :min="1"
                :step="1"
                class="w-full"
                :placeholder="t('business.shardTotalPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.timezoneLabel')
              }}</label>
              <YdSelectBase v-model="formData.timezone">
                <YdSelectTriggerBase
                  class="w-full"
                  :placeholder="t('business.timezonePlaceholder')"
                />
                <YdSelectContentBase>
                  <YdSelectItemBase v-for="tz in COMMON_TIMEZONES" :key="tz" :value="tz">
                    {{ tz }}
                  </YdSelectItemBase>
                </YdSelectContentBase>
              </YdSelectBase>
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.clusterLabel')
              }}</label>
              <YdInput v-model="formData.cluster" :placeholder="t('business.clusterPlaceholder')" />
            </YdFormItem>
            <YdFormItem>
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.canaryRatioLabel')
              }}</label>
              <YdInput
                v-model="formData.canaryRatio"
                type="number"
                :min="0"
                :max="100"
                :step="5"
                class="w-full"
                :placeholder="t('business.canaryRatioPlaceholder')"
              />
            </YdFormItem>
            <YdFormItem v-if="formData.canaryRatio">
              <label class="text-text-primary mb-1 flex items-center text-sm font-medium">{{
                t('business.canaryHandlerLabel')
              }}</label>
              <YdInput
                v-model="formData.canaryHandler"
                :placeholder="t('business.canaryHandlerPlaceholder')"
              />
            </YdFormItem>
          </YdAccordionContent>
        </YdAccordionItem>
      </YdAccordion>
    </YdForm>
  </Modal>
</template>
