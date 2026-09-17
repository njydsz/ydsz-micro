<!--
 * 实体卡片：用于卡片网格视图下的业务实体展示。
 *
 * 设计目标：
 *  - 替代 VxeTable 的表格行，在列表页展示为信息密度更低的卡片；
 *  - 统一 ForgeLab forge-admin 风格：图标 + 标题 + 编码 + 描述 + 状态标签 + 更新时间 + 操作区；
 *  - 通过 slot 注入自定义字段行，不绑定具体业务字段名。
 *
 * 交互：
 *  - hover 时抬升阴影并浮现快捷操作；
 *  - 卡片主体可点击（@click），clickable 启用后附 cursor-pointer；
 *  - 多选模式下顶部出现 checkbox。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\entity-card\YdEntityCard.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { YdCard, YdCardContent, YdCardDescription, YdCardFooter, YdCardHeader, YdCardTitle, YdCheckbox } from '../../primitives';
import { cn } from '@ydsz-core/shared/utils';

defineOptions({
  name: 'YdEntityCard',
});

interface Props {
  /** 图标区内容（图名字首字母 / emoji / 自定义图标），透传至具名 slot 上方作为默认视觉锚点 */
  avatarText?: string;
  /** 卡片主体是否可点击 */
  clickable?: boolean;
  /** 实体编码/副标题文本 */
  code?: string;
  /** 描述文本（单行截断） */
  description?: string;
  /** 自定义类名 */
  class?: string;
  /** 是否显示多选框 */
  selectable?: boolean;
  /** 当前是否选中（v-model） */
  selected?: boolean;
  /** 图标背景色语义：'primary' | 'purple' | 'orange' | 'red' | 'blue' | 'green' | 'neutral' */
  avatarVariant?: 'primary' | 'purple' | 'orange' | 'red' | 'blue' | 'green' | 'neutral';
}

const props = withDefaults(defineProps<Props>(), {
  avatarVariant: 'primary',
  clickable: true,
  code: '',
  description: '',
  selectable: false,
  selected: false,
});

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'update:selected', value: boolean): void;
}>();

/** 头像首字母对应的背景色变体 */
const avatarBgClass = computed<string>(() => {
  const map: Record<NonNullable<Props['avatarVariant']>, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300',
    neutral: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
    primary: 'bg-primary-subtle text-primary',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  };
  return map[props.avatarVariant];
});

/** 从 avatarText 提取首个字符作为图标兜底文案 */
const displayAvatarText = computed<string>(() => {
  return (props.avatarText ?? '').charAt(0).toUpperCase() || '?';
});

function handleCardClick(): void {
  if (!props.clickable) {
    return;
  }
  emit('click');
}

function handleSelectChange(checked: boolean): void {
  emit('update:selected', checked);
}
</script>

<template>
  <YdCard
    :class="
      cn(
        'group relative transition-all duration-200',
        clickable && 'cursor-pointer',
        selected && 'border-primary ring-1 ring-primary',
        props.class,
      )
    "
    hoverable
    @click="handleCardClick"
  >
    <!-- 多选框（右上角绝对定位） -->
    <div
      v-if="selectable"
      class="absolute start-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100"
      :class="{ 'opacity-100': selected }"
    >
      <YdCheckboxSmart
        :checked="selected"
        @update:checked="handleSelectChange"
      />
    </div>

    <YdCardHeader class="pb-3">
      <div class="flex w-full items-start gap-3">
        <!-- 图标 -->
        <div
          :class="
            cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
              avatarBgClass,
            )
          "
        >
          <slot name="avatar">
            <span>{{ displayAvatarText }}</span>
          </slot>
        </div>

        <!-- 标题区域 -->
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <YdCardTitle class="text-sm leading-tight">
              <slot name="title">{{ avatarText }}</slot>
            </YdCardTitle>
            <!-- 状态标签插槽 -->
            <slot name="status-badge" />
          </div>
          <YdCardDescription
            v-if="code || $slots.code"
            class="mt-0.5 text-xs"
          >
            <slot name="code">{{ code }}</slot>
          </YdCardDescription>
        </div>
      </div>
    </YdCardHeader>

    <YdCardContent class="pb-3">
      <!-- 描述 -->
      <p
        v-if="description"
        class="line-clamp-2 text-xs text-text-secondary leading-relaxed"
      >
        {{ description }}
      </p>

      <!-- 自定义字段行（如模型、温度、更新时间等） -->
      <slot name="meta" />
    </YdCardContent>

    <!-- 底部操作区：默认具名 slot，hover 时完全浮现 -->
    <YdCardFooter class="flex items-center justify-between pb-3 pt-0 opacity-0 transition-opacity group-hover:opacity-100">
      <!-- 底部左侧辅助信息 -->
      <div class="text-xs text-text-tertiary">
        <slot name="footer-left" />
      </div>

      <!-- 快捷操作按钮 -->
      <div class="flex items-center gap-1">
        <slot name="actions" />
      </div>
    </YdCardFooter>
  </YdCard>
</template>
