<!--
 * 技能详情抽屉
 *
 * <p>右侧抽屉展示技能完整详情，包括基本信息、输入参数、执行指标等。
 *
 * @path apps/agent-web/src/views/skill/skill-detail-drawer.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 技能详情抽屉组件
 * <p>展示技能的完整信息，消费 getSkillDetail API。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { YdAlert, YdButton, YdDescriptions, YdDescriptionsItem, YdDrawer, YdTable, YdTableColumn, YdTag } from '@ydsz-core/ydsz-ui';
import { useI18n } from '@ydsz/common-ui';
import { computed, ref, watch } from 'vue';

import { Info, RefreshCw } from 'lucide-vue-next';
import { getSkillDetail } from '#/api/skill';

const props = defineProps<{
  /** v-model 控制抽屉显示 */
  modelValue: boolean;
  /** 当前查看的技能编码 */
  skillCode: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();

/** 内部可见性双向绑定 */
const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

/** 详情数据加载状态 */
const detailLoading = ref<boolean>(false);
const detailData = ref<unknown>(null);
const detailError = ref<string>('');

/**
 * 类型守卫：判断 unknown 是否为合法详情对象
 */
function isDetailRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null;
}

/** 安全取字段 */
function getField(field: string): string {
  if (!isDetailRecord(detailData.value)) return '';
  const val = detailData.value[field];
  return val != null ? String(val) : '';
}

/**
 * 加载技能详情
 */
async function loadDetail(): Promise<void> {
  if (!props.skillCode) return;
  detailLoading.value = true;
  detailError.value = '';
  try {
    const data = await getSkillDetail({ skillCode: props.skillCode });
    detailData.value = data ?? null;
  } catch {
    detailError.value = t('business.skill.executeFailed') || '加载详情失败';
    detailData.value = null;
  } finally {
    detailLoading.value = false;
  }
}

/** 监听抽屉打开及 skillCode 变化 */
watch(
  [visible, () => props.skillCode],
  ([vis, code]) => {
    if (vis && code) {
      void loadDetail();
    }
  },
  { immediate: true },
);
</script>

<template>
  <YdDrawer
    v-model="visible"
    :title="t('business.skill.detail.title') || '技能详情'"
    size="50%"
  >
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div>
        <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-text-primary">
          <Info :size="16" class="text-brand-500" />
          {{ t('business.skill.skillName') || '基本信息' }}
        </h3>

        <!-- 加载态 -->
        <div
          v-if="detailLoading"
          class="flex h-32 items-center justify-center"
        >
          <RefreshCw class="animate-spin text-brand-500" :size="16" />
          <span class="ml-2 text-sm text-text-secondary">
            {{ t('business.skill.loading') || '加载中...' }}
          </span>
        </div>

        <!-- 错误态 -->
        <YdAlert
          v-else-if="detailError"
          :title="detailError"
          type="error"
          :closable="false"
        />

        <!-- 详情内容 -->
        <YdDescriptions
          v-else
          :column="2"
          border
          size="sm"
        >
          <YdDescriptionsItem :label="t('business.skill.skillCode') || '技能编码'">
            {{ skillCode }}
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="t('business.skill.skillName') || '技能名称'">
            {{ getField('skillName') || '-' }}
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="t('business.skill.skillType') || '技能类型'">
            <YdTag
              v-if="getField('skillType')"
              size="sm"
              variant="primary"
            >
              {{ getField('skillType') }}
            </YdTag>
            <span v-else>-</span>
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="t('business.skill.version') || '版本'">
            {{ getField('version') || '-' }}
          </YdDescriptionsItem>
          <YdDescriptionsItem
            :label="t('business.skill.status') || '状态'"
            :span="2"
          >
            <YdTag
              v-if="getField('status')"
              size="sm"
              :variant="getField('status') === 'ACTIVE' ? 'success' : 'info'"
            >
              {{ getField('status') }}
            </YdTag>
            <span v-else>-</span>
          </YdDescriptionsItem>
          <YdDescriptionsItem
            :label="t('business.skill.description') || '描述'"
            :span="2"
          >
            {{ getField('description') || '-' }}
          </YdDescriptionsItem>
          <YdDescriptionsItem
            :label="t('business.skill.updatedAt') || '更新时间'"
            :span="2"
          >
            {{ getField('updatedAt') || '-' }}
          </YdDescriptionsItem>
        </YdDescriptions>
      </div>

      <!-- 执行指标（metrics） -->
      <div v-if="isDetailRecord(detailData) && detailData.metrics">
        <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-text-primary">
          <Info :size="16" class="text-brand-500" />
          {{ t('business.skill.detail.metrics') || '执行指标' }}
        </h3>
        <YdDescriptions
          :column="2"
          border
          size="sm"
        >
          <YdDescriptionsItem
            v-for="(value, key) in (detailData.metrics as Record<string, unknown>)"
            :key="key"
            :label="String(key)"
          >
            {{ value != null ? JSON.stringify(value) : '-' }}
          </YdDescriptionsItem>
        </YdDescriptions>
      </div>

      <!-- 产物文件 -->
      <div v-if="isDetailRecord(detailData) && Array.isArray(detailData.outputFiles) && (detailData.outputFiles as unknown[]).length > 0">
        <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-text-primary">
          <Info :size="16" class="text-brand-500" />
          {{ t('business.skill.detail.outputFiles') || '产物文件' }}
        </h3>
        <YdTable
          :data="(detailData.outputFiles as unknown[]).map((f: unknown) => ({ file: String(f) }))"
          size="sm"
          border
          stripe
        >
          <YdTableColumn
            prop="file"
            :label="t('business.skill.detail.outputFiles') || '文件路径'"
            min-width="200"
            show-overflow-tooltip
          />
        </YdTable>
      </div>

      <!-- 底部刷新 -->
      <div class="flex justify-end border-t border-border-subtle pt-4">
        <YdButton
          :loading="detailLoading"
          @click="loadDetail"
        >
          <RefreshCw v-if="!detailLoading" :size="14" />
          {{ t('business.skill.refresh') || '刷新' }}
        </YdButton>
      </div>
    </div>
  </YdDrawer>
</template>
