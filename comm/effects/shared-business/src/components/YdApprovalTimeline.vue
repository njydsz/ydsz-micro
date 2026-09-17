<!--
 * 审批历史时间轴组件
 *
 * 为避免自研 Timeline 组件未就绪前阻塞 P0-1 comm 清零，本组件已用纯 HTML 结构 +
 * 自研 YdBadge + lucide 图标替代原生 EP ElTimeline/ElTimelineItem/ElTag（桥接模式）。
 * TODO: P1-1 Timeline 组件发布后回补为 <y-timeline><y-timeline-item> 语义化 API。
 *
 * @path comm\effects\shared-business\src\components\approval-timeline.vue
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
import { CheckCircle2, Clock, RefreshCw, Send, XCircle } from 'lucide-vue-next';

import { YdBadge } from '@ydsz-core/shadcn-ui';

/** 审批记录 */
export interface ApprovalRecord {
  id: string;
  /** 审批人 */
  operator: string;
  /** 审批动作：SUBMIT/APPROVE/REJECT/RETURN/TRANSFER */
  action: string;
  /** 审批意见 */
  comment?: string;
  /** 审批时间 */
  time: string;
}

interface Props {
  /** 审批记录 */
  records: ApprovalRecord[];
}

defineProps<Props>();

interface ActionMeta {
  variant: 'default' | 'outline' | 'secondary' | 'destructive';
  text: string;
  icon: typeof CheckCircle2;
}

/** 动作 -> 标签样式 + 图标 */
function actionMeta(action: string): ActionMeta {
  const map: Record<string, ActionMeta> = {
    APPROVE: { variant: 'default', text: '通过', icon: CheckCircle2 },
    REJECT: { variant: 'destructive', text: '驳回', icon: XCircle },
    SUBMIT: { variant: 'outline', text: '提交', icon: Send },
    RETURN: { variant: 'outline', text: '退回', icon: RefreshCw },
    TRANSFER: { variant: 'secondary', text: '转办', icon: Clock },
  };
  return map[action] || { variant: 'secondary', text: action, icon: Clock };
}
</script>

<template>
  <!-- 审批历史 -->
  <ol
    v-if="records.length > 0"
    class="approval-timeline relative border-l border-border-subtle pl-6"
  >
    <li
      v-for="record in records"
      :key="record.id"
      class="approval-timeline__item relative pb-5 last:pb-0"
    >
      <!-- 节点圆点 -->
      <span
        class="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bg-surface-2 ring-4 ring-bg-surface-2"
        aria-hidden="true"
      >
        <component
          :is="actionMeta(record.action).icon"
          :size="12"
          class="text-txt-secondary"
        />
      </span>

      <!-- 内容 -->
      <div class="approval-timeline__item-body">
        <div class="approval-timeline__head flex flex-wrap items-center gap-2">
          <span class="approval-timeline__operator text-sm font-semibold">
            {{ record.operator }}
          </span>
          <YdBadge :variant="actionMeta(record.action).variant">
            {{ actionMeta(record.action).text }}
          </YdBadge>
          <span class="approval-timeline__time text-xs text-txt-tertiary">
            {{ record.time }}
          </span>
        </div>
        <p
          v-if="record.comment"
          class="approval-timeline__comment mt-1 rounded bg-neutral-50 px-3 py-2 text-sm text-txt-secondary"
        >
          {{ record.comment }}
        </p>
      </div>
    </li>
  </ol>

  <!-- 空态 -->
  <p
    v-else
    class="approval-timeline__empty py-4 text-center text-sm text-txt-tertiary"
  >
    暂无审批记录
  </p>
</template>

<style scoped>
.approval-timeline__operator {
  color: hsl(var(--txt-primary, #1f2937));
}

.approval-timeline__time {
  color: hsl(var(--txt-tertiary, #909399));
}

.approval-timeline__comment {
  background-color: hsl(var(--neutral-50, #f5f7fa));
  color: hsl(var(--txt-secondary, #606266));
}

.approval-timeline__empty {
  color: hsl(var(--txt-tertiary, #909399));
}
</style>
