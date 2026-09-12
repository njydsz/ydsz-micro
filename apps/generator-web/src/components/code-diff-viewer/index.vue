<!--
 * Diff 预览组件
 *
 * <p>纯 CSS 实现的 inline diff 查看器，支持左右分栏和单栏 inline 两种模式。
 * 使用 LCS 算法实现行级 diff 对比。
 *
 * @path apps/generator-web/src/components/code-diff-viewer/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts">
/**
 * Diff 预览组件 — 公共导出。
 *
 * <p>提供 {@link DiffLine} 与 {@link diffLines} 供外部模块复用。
 *
 * @author ydsz-team
 * @since 1.0.0
 */

// ══════ 类型定义 ══════

/**
 * Diff 行类型。
 */
export interface DiffLine {
  /** 行类型 —— 新增 / 删除 / 未变更 */
  type: 'add' | 'delete' | 'equal';
  /** 旧文件行号（equal / delete 时有值） */
  oldLineNum?: number;
  /** 新文件行号（equal / add 时有值） */
  newLineNum?: number;
  /** 行内容 */
  content: string;
}

// ══════ 内部算法 ══════

/**
 * 计算最长公共子序列（LCS）。
 *
 * @param a 旧行数组
 * @param b 新行数组
 * @returns 布尔二维矩阵，true 表示该元素对在 LCS 中
 */
function computeLCS(a: string[], b: string[]): boolean[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯构造 LCS 命中矩阵
  const lcs: boolean[][] = Array.from({ length: m }, () => new Array<boolean>(n).fill(false));
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs[i - 1][j - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * 执行行级 diff。
 *
 * <p>使用 LCS 算法对比两段文本的行差异。通过回溯 LCS 矩阵生成 add/delete/equal 序列。
 *
 * @param oldLines 旧代码行数组
 * @param newLines 新代码行数组
 * @returns DiffLine 数组
 */
export function diffLines(oldLines: string[], newLines: string[]): DiffLine[] {
  const lcs = computeLCS(oldLines, newLines);
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    // 两行都在范围内且匹配
    if (i < oldLines.length && j < newLines.length && lcs[i] && lcs[i][j]) {
      result.push({
        type: 'equal',
        oldLineNum: i + 1,
        newLineNum: j + 1,
        content: oldLines[i] ?? '',
      });
      i++;
      j++;
    }
    // 旧行已经遍历完，剩余都是新增
    else if (i >= oldLines.length && j < newLines.length) {
      result.push({
        type: 'add',
        newLineNum: j + 1,
        content: newLines[j] ?? '',
      });
      j++;
    }
    // 新行已经遍历完，剩余都是删除
    else if (j >= newLines.length && i < oldLines.length) {
      result.push({
        type: 'delete',
        oldLineNum: i + 1,
        content: oldLines[i] ?? '',
      });
      i++;
    }
    // 两边都还有行：先输出新增行再输出删除行（标准 LCS 回溯方式）
    else {
      // 检查新当前行 j 是否在后续有 LCS 匹配，如果没有则视为新增
      const newLineHasFutureMatch = j < newLines.length && hasFutureLCSMatch(lcs, i, j, oldLines.length);
      if (!newLineHasFutureMatch && j < newLines.length) {
        result.push({
          type: 'add',
          newLineNum: j + 1,
          content: newLines[j] ?? '',
        });
        j++;
      } else if (i < oldLines.length) {
        result.push({
          type: 'delete',
          oldLineNum: i + 1,
          content: oldLines[i] ?? '',
        });
        i++;
      }
    }
  }

  return result;
}

/**
 * 检查 newLines[col] 在 oldLines[row..] 范围内是否有 LCS 匹配。
 */
function hasFutureLCSMatch(lcs: boolean[][], row: number, col: number, rows: number): boolean {
  for (let r = row; r < rows; r++) {
    if (lcs[r] && lcs[r][col]) return true;
  }
  return false;
}
</script>

<script lang="ts" setup>
/**
 * Diff 预览组件。
 *
 * <p>纯 CSS 实现的 inline diff 查看器，不依赖第三方库。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed } from 'vue';

/**
 * 组件 Props。
 */
interface Props {
  /** 旧代码（可选，仅用于对比） */
  oldCode?: string;
  /** 新代码（必填） */
  newCode: string;
  /** 代码语言（默认 'typescript'） */
  language?: string;
  /** 是否 inline 对比（默认 false，使用左右分栏） */
  showInline?: boolean;
  /** 文件名（可选展示） */
  fileName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  oldCode: '',
  language: 'typescript',
  showInline: false,
  fileName: '',
});

defineOptions({ name: 'CodeDiffViewer' });

// ══════ 计算属性 ══════

/** 是否处于纯展示模式（无旧代码） */
const isPlainText = computed(() => !props.oldCode);

/** 旧代码行 */
const oldLines = computed(() => (props.oldCode ? props.oldCode.split('\n') : []));

/** 新代码行 */
const newLines = computed(() => props.newCode.split('\n'));

/** 差异结果行 */
const diffResult = computed<DiffLine[]>(() => {
  if (isPlainText.value) {
    return newLines.value.map((line, idx) => ({
      type: 'equal' as const,
      oldLineNum: idx + 1,
      newLineNum: idx + 1,
      content: line,
    }));
  }
  return diffLines(oldLines.value, newLines.value);
});

/** 新增行数 */
const addCount = computed(() => diffResult.value.filter((l) => l.type === 'add').length);

/** 删除行数 */
const deleteCount = computed(() => diffResult.value.filter((l) => l.type === 'delete').length);

// ══════ 左右分栏数据 ══════

/** 左侧行数据（旧代码侧） */
const leftLines = computed(() => {
  if (props.showInline) return [];
  const lines: Array<{ lineNum: number | null; content: string; type: string }> = [];
  for (const d of diffResult.value) {
    if (d.type === 'equal' || d.type === 'delete') {
      lines.push({ lineNum: d.oldLineNum ?? null, content: d.content, type: d.type });
    } else {
      lines.push({ lineNum: null, content: '', type: 'placeholder' });
    }
  }
  return lines;
});

/** 右侧行数据（新代码侧） */
const rightLines = computed(() => {
  if (props.showInline) return [];
  const lines: Array<{ lineNum: number | null; content: string; type: string }> = [];
  for (const d of diffResult.value) {
    if (d.type === 'equal' || d.type === 'add') {
      lines.push({ lineNum: d.newLineNum ?? null, content: d.content, type: d.type });
    } else {
      lines.push({ lineNum: null, content: '', type: 'placeholder' });
    }
  }
  return lines;
});
</script>

<template>
  <div class="code-diff-viewer">
    <!-- 头部信息栏 -->
    <div v-if="fileName || !isPlainText" class="diff-header">
      <div v-if="fileName" class="diff-file-name">
        {{ fileName }}
      </div>
      <div v-if="!isPlainText" class="diff-stats">
        <span class="diff-stat-add">+{{ addCount }}</span>
        <span class="diff-stat-delete">-{{ deleteCount }}</span>
      </div>
    </div>

    <!-- 纯代码展示（无旧代码对比时） -->
    <div v-if="isPlainText" class="diff-plain">
      <div
        v-for="(line, idx) in diffResult"
        :key="line.newLineNum ?? idx"
        class="diff-line diff-line-equal"
      >
        <span class="diff-line-num">{{ line.newLineNum }}</span>
        <span class="diff-line-content"><code>{{ line.content }}</code></span>
      </div>
    </div>

    <!-- Inline 单栏模式 -->
    <div v-else-if="showInline" class="diff-inline">
      <div
        v-for="(line, idx) in diffResult"
        :key="`${line.oldLineNum ?? 'o'}-${line.newLineNum ?? 'n'}-${idx}`"
        class="diff-line"
        :class="{
          'diff-line-add': line.type === 'add',
          'diff-line-delete': line.type === 'delete',
          'diff-line-equal': line.type === 'equal',
        }"
      >
        <span class="diff-line-num diff-line-num-old">{{ line.oldLineNum ?? '' }}</span>
        <span class="diff-line-num diff-line-num-new">{{ line.newLineNum ?? '' }}</span>
        <span class="diff-line-sign">{{ line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' ' }}</span>
        <span class="diff-line-content"><code>{{ line.content }}</code></span>
      </div>
    </div>

    <!-- 左右分栏模式 -->
    <div v-else class="diff-side-by-side">
      <div class="diff-panel diff-panel-left">
        <div class="diff-panel-title">旧版本</div>
        <div class="diff-panel-body">
          <div
            v-for="(line, idx) in leftLines"
            :key="line.lineNum ?? idx"
            class="diff-line"
            :class="{
              'diff-line-delete': line.type === 'delete',
              'diff-line-placeholder': line.type === 'placeholder',
            }"
          >
            <span class="diff-line-num">{{ line.lineNum ?? '' }}</span>
            <span class="diff-line-content"><code>{{ line.content }}</code></span>
          </div>
        </div>
      </div>
      <div class="diff-panel diff-panel-right">
        <div class="diff-panel-title">新版本</div>
        <div class="diff-panel-body">
          <div
            v-for="(line, idx) in rightLines"
            :key="line.lineNum ?? idx"
            class="diff-line"
            :class="{
              'diff-line-add': line.type === 'add',
              'diff-line-placeholder': line.type === 'placeholder',
            }"
          >
            <span class="diff-line-num">{{ line.lineNum ?? '' }}</span>
            <span class="diff-line-content"><code>{{ line.content }}</code></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-diff-viewer {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  font-family: Menlo, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  background: #fff;
}

/* ══════ 头部 ══════ */
.diff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.diff-file-name {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.diff-stats {
  display: flex;
  gap: 8px;
}

.diff-stat-add {
  color: #16a34a;
  font-weight: 600;
}

.diff-stat-delete {
  color: #dc2626;
  font-weight: 600;
}

/* ══════ 通用行样式 ══════ */
.diff-line {
  display: flex;
  min-height: 20px;
  white-space: pre;
}

.diff-line-num {
  display: inline-block;
  width: 40px;
  padding: 0 8px;
  text-align: right;
  color: #9ca3af;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  user-select: none;
  flex-shrink: 0;
}

.diff-line-content {
  flex: 1;
  padding: 0 12px;
  overflow-x: auto;
  word-break: break-all;
  white-space: pre-wrap;
}

/* ══════ 纯文本展示 ══════ */
.diff-plain {
  max-height: 500px;
  overflow-y: auto;
}

/* ══════ Inline 模式 ══════ */
.diff-inline {
  max-height: 500px;
  overflow-y: auto;
}

.diff-line-num-old {
  border-right: none;
}

.diff-line-num-new {
  border-left: 1px solid #e5e7eb;
}

.diff-line-sign {
  display: inline-block;
  width: 20px;
  text-align: center;
  font-weight: bold;
  user-select: none;
  flex-shrink: 0;
}

.diff-line-add {
  background: #f0fdf4;
}

.diff-line-add .diff-line-sign {
  color: #16a34a;
}

.diff-line-add .diff-line-num {
  background: #dcfce7;
}

.diff-line-delete {
  background: #fef2f2;
}

.diff-line-delete .diff-line-sign {
  color: #dc2626;
}

.diff-line-delete .diff-line-num {
  background: #fee2e2;
}

.diff-line-placeholder {
  background: #f9fafb;
}

.diff-line-placeholder .diff-line-num {
  background: #f3f4f6;
}

/* ══════ 左右分栏模式 ══════ */
.diff-side-by-side {
  display: flex;
  max-height: 500px;
  overflow-y: auto;
}

.diff-panel {
  flex: 1;
  overflow-x: auto;
  min-width: 0;
}

.diff-panel-left {
  border-right: 1px solid #e5e7eb;
}

.diff-panel-title {
  padding: 6px 12px;
  font-weight: 500;
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1;
}

.diff-panel-left .diff-line-delete {
  background: #fee2e2;
}

.diff-panel-right .diff-line-add {
  background: #dcfce7;
}

.diff-side-by-side .diff-line-placeholder {
  background: repeating-linear-gradient(
    45deg,
    #f9fafb,
    #f9fafb 10px,
    #f3f4f6 10px,
    #f3f4f6 20px
  );
}
</style>
