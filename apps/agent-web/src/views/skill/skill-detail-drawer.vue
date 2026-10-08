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
import { useI18n } from '@ydsz/common-ui';
import { computed, ref, watch } from 'vue';
import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElIcon,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import { InfoFilled, Refresh } from '@element-plus/icons-vue';
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

/**
 * 关闭抽屉
 */
function handleClose(): void {
  visible.value = false;
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
  <ElDrawer
    v-model="visible"
    :title="t('business.skill.detail.title') || '技能详情'"
    direction="rtl"
    size="50%"
    :before-close="handleClose"
  >
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div>
        <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-text-primary">
          <ElIcon><InfoFilled /></ElIcon>
          {{ t('business.skill.skillName') || '基本信息' }}
        </h3>

        <!-- 加载态 -->
        <div
          v-if="detailLoading"
          class="flex h-32 items-center justify-center"
        >
          <ElIcon class="is-loading" />
          <span class="ml-2 text-sm text-text-secondary">
            {{ t('business.skill.loading') || '加载中...' }}
          </span>
        </div>

        <!-- 错误态 -->
        <ElAlert
          v-else-if="detailError"
          :title="detailError"
          type="error"
          show-icon
          :closable="false"
        />

        <!-- 详情内容 -->
        <ElDescriptions
          v-else
          :column="2"
          border
          size="small"
        >
          <ElDescriptionsItem :label="t('business.skill.skillCode') || '技能编码'">
            {{ skillCode }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('business.skill.skillName') || '技能名称'">
            {{ getField('skillName') || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('business.skill.skillType') || '技能类型'">
            <ElTag
              v-if="getField('skillType')"
              size="small"
              type="primary"
            >
              {{ getField('skillType') }}
            </ElTag>
            <span v-else>-</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('business.skill.version') || '版本'">
            {{ getField('version') || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem
            :label="t('business.skill.status') || '状态'"
            :span="2"
          >
            <ElTag
              v-if="getField('status')"
              size="small"
              :type="getField('status') === 'ACTIVE' ? 'success' : 'info'"
            >
              {{ getField('status') }}
            </ElTag>
            <span v-else>-</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem
            :label="t('business.skill.description') || '描述'"
            :span="2"
          >
            {{ getField('description') || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem
            :label="t('business.skill.updatedAt') || '更新时间'"
            :span="2"
          >
            {{ getField('updatedAt') || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 执行指标（metrics） -->
      <div v-if="isDetailRecord(detailData) && detailData.metrics">
        <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-text-primary">
          <ElIcon><InfoFilled /></ElIcon>
          {{ t('business.skill.detail.metrics') || '执行指标' }}
        </h3>
        <ElDescriptions
          :column="2"
          border
          size="small"
        >
          <ElDescriptionsItem
            v-for="(value, key) in (detailData.metrics as Record<string, unknown>)"
            :key="key"
            :label="String(key)"
          >
            {{ value != null ? JSON.stringify(value) : '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 产物文件 -->
      <div v-if="isDetailRecord(detailData) && Array.isArray(detailData.outputFiles) && (detailData.outputFiles as unknown[]).length > 0">
        <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-text-primary">
          <ElIcon><InfoFilled /></ElIcon>
          {{ t('business.skill.detail.outputFiles') || '产物文件' }}
        </h3>
        <ElTable
          :data="(detailData.outputFiles as unknown[]).map((f: unknown) => ({ file: String(f) }))"
          size="small"
          stripe
        >
          <ElTableColumn
            prop="file"
            :label="t('business.skill.detail.outputFiles') || '文件路径'"
            minWidth="200"
            show-overflow-tooltip
          />
        </ElTable>
      </div>

      <!-- 底部刷新 -->
      <div class="flex justify-end border-t border-border-subtle pt-4">
        <ElButton
          :icon="Refresh"
          :loading="detailLoading"
          @click="loadDetail"
        >
          {{ t('business.skill.refresh') || '刷新' }}
        </ElButton>
      </div>
    </div>
  </ElDrawer>
</template>

<style scoped>
:deep(.el-descriptions__cell) {
  padding: 8px 12px;
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
}

:deep(.el-drawer__body) {
  padding: 20px;
  overflow-y: auto;
}
</style>
