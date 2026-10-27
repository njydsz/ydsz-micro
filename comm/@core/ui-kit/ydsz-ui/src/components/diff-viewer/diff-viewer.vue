<script lang="ts" setup>
/**
* DiffViewer 文本对比组件。
* 
 * 内置 LCS（最长公共子序列）差量算法按行比较两份文本，
 * 支持 split（分栏）/ unified（单栏）两种视图模式，
 * 可选行号显示、上下文折叠与自定义标题。
* 
 * 对标 react-diff-view / GitHub PR diff 的阅读体验。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\components\diff-viewer\diff-viewer.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref, watch } from 'vue';

import type {
  DiffChunk,
  DiffLine,
  DiffOpType,
} from './diff-viewer-types';

import type { DiffViewerProps } from './diff-viewer-types';

import { useLocale } from '../../locale/useLocale';

defineOptions({ name: 'YdDiffViewer' });

const { t } = useLocale();

const props = withDefaults(defineProps<DiffViewerProps>(), {
  mode: 'unified',
  contextSize: 3,
  showLineNumbers: true,
  expandable: false,
});

const expandedChunks = ref<Set<number>>(new Set());

// ---- LCS Diff 算法 ---------------------------------------------------------

/**
 * 使用动态规划求解两行数组的 LCS 长度表。
 * dp[i][j] 表示 oldLines[0..i) 与 newLines[0..j) 的 LCS 长度。
 */
function computeLCSTable(
  oldLines: readonly string[],
  newLines: readonly string[],
): number[][] {
  const m = oldLines.length;
  const n = newLines.length;
  // dp[i][j] = LCS 长度
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

/**
 * 回溯 LCS 长度表生成操作序列（add / remove / equal）。
 */
function backtrackLCS(
  dp: readonly (readonly number[])[],
  oldLines: readonly string[],
  newLines: readonly string[],
): DiffLine[] {
  const ops: DiffLine[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      // 该行相等 —— 属于 LCS
      ops.push({
        type: 'equal',
        oldNumber: i,
        newNumber: j,
        content: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // 新文本有新增行
      ops.push({
        type: 'add',
        oldNumber: null,
        newNumber: j,
        content: newLines[j - 1],
      });
      j--;
    } else if (i > 0) {
      // 旧文本有删除行
      ops.push({
        type: 'remove',
        oldNumber: i,
        newNumber: null,
        content: oldLines[i - 1],
      });
      i--;
    }
  }

  return ops.reverse();
}

/**
 * 将操作序列按上下文行数分组为 chunks。
 */
function chunkDiffLines(
  lines: readonly DiffLine[],
  contextSize: number,
): DiffChunk[] {
  if (lines.length === 0) {
    return [];
  }

  const chunks: DiffChunk[] = [];
  let currentLines: DiffLine[] = [];
  let oldStart = 1;
  let newStart = 1;
  let lastDiffIndex = -contextSize - 1;

  lines.forEach((line, index) => {
    if (line.type !== 'equal') {
      if (currentLines.length === 0) {
        // 第一个差异点：先补上 contextSize 行前文
        const start = Math.max(0, index - contextSize);
        oldStart =
          (lines[start].oldNumber ?? oldStart);
        newStart =
          (lines[start].newNumber ?? newStart);
        for (let k = start; k < index; k++) {
          currentLines.push(lines[k]);
        }
      }
      lastDiffIndex = index;
    } else {
      // equal 行：检查是否距离上一个差异点超过 contextSize
      if (index - lastDiffIndex > contextSize * 2 && currentLines.length > 0) {
        // 结束当前 chunk，截断尾部多余 equal 行
        const tailStart = currentLines.length - contextSize;
        if (tailStart > 0) {
          const tail = currentLines.splice(tailStart);
          chunks.push({
            lines: [...currentLines],
            oldStart,
            newStart,
          });
          // 新 chunk 从前文开始
          const headStart = tail[0];
          oldStart = headStart?.oldNumber ?? oldStart;
          newStart = headStart?.newNumber ?? newStart;
          currentLines = [...tail];
        }
      }
    }
    currentLines.push(line);
  });

  if (currentLines.length > 0) {
    chunks.push({
      lines: currentLines,
      oldStart,
      newStart,
    });
  }

  return chunks;
}

// ---- 响应式计算 ------------------------------------------------------------

const oldLinesArr = computed(() => props.oldValue.split('\n'));
const newLinesArr = computed(() => props.newValue.split('\n'));

const chunks = computed<DiffChunk[]>(() => {
  const dp = computeLCSTable(oldLinesArr.value, newLinesArr.value);
  const ops = backtrackLCS(dp, oldLinesArr.value, newLinesArr.value);
  return chunkDiffLines(ops, props.contextSize);
});

watch(
  () => [props.oldValue, props.newValue, props.contextSize],
  () => {
    expandedChunks.value = new Set();
  },
);

// ---- 方法 ------------------------------------------------------------------

function toggleChunk(index: number): void {
  const next = new Set(expandedChunks.value);
  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }
  expandedChunks.value = next;
}

function isLineVisible(chunkIndex: number): boolean {
  return !props.expandable || expandedChunks.value.has(chunkIndex);
}
</script>

<template>
  <div
    :class="[
      'yd-diff-viewer flex flex-col overflow-hidden rounded-md border border-border bg-background text-sm font-mono',
      props.class,
    ]"
    role="region"
    :aria-label="t('diffViewer.ariaLabel')"
  >
    <!-- header -->
    <header
      v-if="props.oldTitle || props.newTitle"
      class="yd-diff-header flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 text-xs font-sans"
    >
      <span class="text-muted-foreground">{{ props.oldTitle ?? t('diffViewer.oldVersion') }}</span>
      <span class="text-muted-foreground">{{ props.newTitle ?? t('diffViewer.newVersion') }}</span>
    </header>

    <!-- diff content -->
    <div class="yd-diff-content overflow-auto">
      <!-- split 模式：分栏 -->
      <div
        v-if="props.mode === 'split'"
        class="yd-diff-split grid grid-cols-2"
      >
        <div
          v-for="(chunk, chunkIndex) in chunks"
          :key="chunkIndex"
          class="contents"
        >
          <!-- 展开按钮 -->
          <button
            v-if="props.expandable && !isLineVisible(chunkIndex)"
            :key="'expand-' + chunkIndex"
            class="col-span-2 border-y border-border bg-muted/30 px-4 py-1 text-xs text-muted-foreground hover:bg-muted/50"
            type="button"
            @click="toggleChunk(chunkIndex)"
          >
            {{ t('diffViewer.expandLines', { count: chunk.lines.length }) }}
          </button>

          <!-- 分栏行渲染 -->
          <template v-if="isLineVisible(chunkIndex)">
            <div
              v-for="(line, lineIndex) in chunk.lines"
              :key="`s-${chunkIndex}-${lineIndex}`"
              class="contents"
            >
              <!-- 旧侧 -->
              <div
                :class="[
                  'yd-diff-old-row flex items-start border-r border-border px-2 font-mono leading-relaxed',
                  {
                    'bg-red-500/10 dark:bg-red-900/20':
                      line.type === 'remove',
                    'bg-transparent':
                      line.type !== 'remove',
                  },
                ]"
              >
                <span
                  v-if="props.showLineNumbers"
                  class="mr-2 w-8 select-none text-right text-xs text-muted-foreground"
                >
                  {{ line.oldNumber ?? '' }}
                </span>
                <span
                  :class="[
                    'flex-1 whitespace-pre-wrap break-all',
                    {
                      'text-red-700 dark:text-red-400':
                        line.type === 'remove',
                    },
                  ]"
                >
                  <span v-if="line.type === 'remove'" class="mr-1">-</span>
                  {{ line.type !== 'add' ? line.content : '' }}
                </span>
              </div>

              <!-- 新侧 -->
              <div
                :class="[
                  'yd-diff-new-row flex items-start px-2 font-mono leading-relaxed',
                  {
                    'bg-green-500/10 dark:bg-green-900/20':
                      line.type === 'add',
                    'bg-transparent':
                      line.type !== 'add',
                  },
                ]"
              >
                <span
                  v-if="props.showLineNumbers"
                  class="mr-2 w-8 select-none text-right text-xs text-muted-foreground"
                >
                  {{ line.newNumber ?? '' }}
                </span>
                <span
                  :class="[
                    'flex-1 whitespace-pre-wrap break-all',
                    {
                      'text-green-700 dark:text-green-400':
                        line.type === 'add',
                    },
                  ]"
                >
                  <span v-if="line.type === 'add'" class="mr-1">+</span>
                  {{ line.type !== 'remove' ? line.content : '' }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- unified 模式：单栏 -->
      <div v-else class="yd-diff-unified flex flex-col">
        <template
          v-for="(chunk, chunkIndex) in chunks"
          :key="chunkIndex"
        >
          <!-- 展开按钮 -->
          <button
            v-if="props.expandable && !isLineVisible(chunkIndex)"
            :key="'u-expand-' + chunkIndex"
            class="border-y border-border bg-muted/30 px-4 py-1 text-xs text-muted-foreground hover:bg-muted/50"
            type="button"
            @click="toggleChunk(chunkIndex)"
          >
            {{ t('diffViewer.expandLines', { count: chunk.lines.length }) }}
          </button>

          <!-- 单栏行渲染 -->
          <div
            v-for="(line, lineIndex) in isLineVisible(chunkIndex) ? chunk.lines : []"
            :key="`u-${chunkIndex}-${lineIndex}`"
            :class="[
              'yd-diff-row flex items-start px-2 font-mono leading-relaxed',
              {
                'bg-red-500/10 dark:bg-red-900/20':
                  line.type === 'remove',
                'bg-green-500/10 dark:bg-green-900/20':
                  line.type === 'add',
                'bg-transparent': line.type === 'equal',
              },
            ]"
          >
            <!-- 旧行号 -->
            <span
              v-if="props.showLineNumbers"
              class="mr-1 w-7 shrink-0 select-none text-right text-xs text-muted-foreground"
            >
              {{ line.oldNumber ?? '' }}
            </span>
            <!-- 新行号 -->
            <span
              v-if="props.showLineNumbers"
              class="mr-2 w-7 shrink-0 select-none text-right text-xs text-muted-foreground"
            >
              {{ line.newNumber ?? '' }}
            </span>
            <!-- 行内容 -->
            <span
              :class="[
                'flex-1 whitespace-pre-wrap break-all',
                {
                  'text-red-700 dark:text-red-400':
                    line.type === 'remove',
                  'text-green-700 dark:text-green-400':
                    line.type === 'add',
                  'text-foreground': line.type === 'equal',
                },
              ]"
            >
              <span
                v-if="line.type === 'remove'"
                class="mr-1 font-bold"
              >-</span>
              <span
                v-else-if="line.type === 'add'"
                class="mr-1 font-bold"
              >+</span>
              <span v-else class="mr-1">&nbsp;</span>
              {{ line.content }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
