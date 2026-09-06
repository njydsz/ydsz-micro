<!--
 * JSON 版本对比对话框 — 左右分栏展示两个版本快照的差异，高亮显示差异行
 *
 * @path apps\system-web\src\views\config\json-diff-dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * JSON diff 对比对话框
 * <p>左右分栏展示两个版本的快照 JSON，通过行级差异高亮显示不同之处。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { ElButton, ElDialog } from 'element-plus';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@YDSZ-core/shared/utils';

const logger = createLogger('json-diff-dialog');

const { t } = useI18n();

interface Props {
  /** 对话框可见性 */
  visible: boolean;
  /** 左侧版本号 */
  versionA: string;
  /** 右侧版本号 */
  versionB: string;
  /** 左侧格式化后的 JSON 快照 */
  snapshotA: string;
  /** 右侧格式化后的 JSON 快照 */
  snapshotB: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  versionA: '',
  versionB: '',
  snapshotA: '',
  snapshotB: '',
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

/** 左侧 JSON 按行拆分 */
const linesA = computed(() => {
  return props.snapshotA.split('\n');
});

/** 右侧 JSON 按行拆分 */
const linesB = computed(() => {
  return props.snapshotB.split('\n');
});

/** 计算行级差异 */
interface DiffLine {
  text: string;
  status: 'same' | 'added' | 'removed';
}

const diffLines = computed(() => {
  const aLines = linesA.value;
  const bLines = linesB.value;
  const maxLen = Math.max(aLines.length, bLines.length);
  const result: { left: DiffLine | null; right: DiffLine | null }[] = [];

  let aIdx = 0;
  let bIdx = 0;

  // 简化的 LCS diff 算法：逐行比较，标记相同/新增/删除
  while (aIdx < aLines.length || bLines.length) {
    const aLine = aIdx < aLines.length ? aLines[aIdx] : null;
    const bLine = bIdx < bLines.length ? bLines[bIdx] : null;

    if (aLine === bLine) {
      result.push({
        left: { text: aLine!, status: 'same' },
        right: { text: bLine!, status: 'same' },
      });
      aIdx++;
      bIdx++;
    } else if (aLine !== null && bLine !== null) {
      // 查找右侧是否有与当前左侧匹配的行
      const bMatchIdx = bLines.indexOf(aLine, bIdx);
      const aMatchIdx = aLines.indexOf(bLine, aIdx);

      if (aMatchIdx === -1 && bMatchIdx === -1) {
        // 两行都不在对方剩余内容中：都视为修改
        result.push({
          left: { text: aLine!, status: 'removed' },
          right: { text: bLine!, status: 'added' },
        });
        aIdx++;
        bIdx++;
      } else if (bMatchIdx !== -1 && (aMatchIdx === -1 || bMatchIdx - bIdx <= aMatchIdx - aIdx)) {
        // 左侧行在右侧较近位置：右侧中间的行视为新增
        while (bIdx < bMatchIdx) {
          result.push({
            left: null,
            right: { text: bLines[bIdx], status: 'added' },
          });
          bIdx++;
        }
      } else {
        // 右侧行在左侧较近位置：左侧中间的行视为删除
        while (aIdx < aMatchIdx) {
          result.push({
            left: { text: aLines[aIdx], status: 'removed' },
            right: null,
          });
          aIdx++;
        }
      }
    } else if (aLine !== null) {
      result.push({
        left: { text: aLine!, status: 'removed' },
        right: null,
      });
      aIdx++;
    } else if (bLine !== null) {
      result.push({
        left: null,
        right: { text: bLine!, status: 'added' },
      });
      bIdx++;
    }

    // 防止无限循环
    if (result.length > maxLen * 2 + 10) {
      logger.warn('Diff 计算异常，提前终止');
      break;
    }
  }

  return result;
});

/** 统计差异数量 */
const diffStats = computed(() => {
  let added = 0;
  let removed = 0;
  for (const line of diffLines.value) {
    if (line.left?.status === 'removed') removed++;
    if (line.right?.status === 'added') added++;
  }
  return { added, removed };
});

/** 关闭对话框 */
function handleClose() {
  emit('update:visible', false);
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    width="85%"
    :title="t('configVersion.diffTitle', { versionA, versionB })"
    :destroy-on-close="true"
    @update:model-value="emit('update:visible', $event)"
  >
    <!-- 差异统计 -->
    <div class="mb-3 flex gap-4 text-sm">
      <span class="text-red-500">
        {{ t('configVersion.diffRemoved') }}: {{ diffStats.removed }}
      </span>
      <span class="text-green-500">
        {{ t('configVersion.diffAdded') }}: {{ diffStats.added }}
      </span>
    </div>

    <!-- 左右分栏对比 -->
    <div class="diff-container">
      <!-- 左侧面板 -->
      <div class="diff-panel left">
        <div class="diff-panel-header">
          <ElButton text size="small" type="primary">
            {{ t('configVersion.leftVersion', [versionA]) }}
          </ElButton>
        </div>
        <div class="diff-panel-body">
          <div
            v-for="(line, idx) in diffLines"
            :key="'left-' + idx"
            class="diff-line"
            :class="{
              'diff-line-removed': line.left?.status === 'removed',
              'diff-line-empty': !line.left,
            }"
          >
            <span v-if="line.left" class="diff-line-content">{{ line.left.text }}</span>
            <span v-else class="diff-line-placeholder"> </span>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="diff-panel right">
        <div class="diff-panel-header">
          <ElButton text size="small" type="success">
            {{ t('configVersion.rightVersion', [versionB]) }}
          </ElButton>
        </div>
        <div class="diff-panel-body">
          <div
            v-for="(line, idx) in diffLines"
            :key="'right-' + idx"
            class="diff-line"
            :class="{
              'diff-line-added': line.right?.status === 'added',
              'diff-line-empty': !line.right,
            }"
          >
            <span v-if="line.right" class="diff-line-content">{{ line.right.text }}</span>
            <span v-else class="diff-line-placeholder"> </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">{{ t('common.close') }}</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.diff-container {
  display: flex;
  gap: 0;
  max-height: 55vh;
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.diff-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.diff-panel.left {
  border-right: 1px solid #ebeef5;
}

.diff-panel-header {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-weight: 600;
  font-size: 13px;
}

.diff-panel-body {
  flex: 1;
  overflow: auto;
}

.diff-line {
  min-height: 22px;
  padding: 2px 8px;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 22px;
  white-space: pre-wrap;
  word-break: break-all;
}

.diff-line-removed {
  background-color: #fef0f0;
}

.diff-line-added {
  background-color: #f0f9eb;
}

.diff-line-empty {
  background-color: #fafafa;
}

.diff-line-content {
  display: block;
}

.diff-line-placeholder {
  display: block;
  height: 22px;
}
</style>
