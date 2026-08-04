<!--
 * icon-button 通用组件
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\button\icon-button.vue
 * @author remi-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ButtonVariants } from '../../ui';
import type { REMIButtonProps } from './button';

import { computed, useSlots } from 'vue';

import { cn } from '@remi-core/shared/utils';

import { REMITooltip } from '../tooltip';
import REMIButton from './button.vue';

interface Props extends REMIButtonProps {
  class?: any;
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: string;
  tooltipDelayDuration?: number;
  tooltipSide?: 'bottom' | 'left' | 'right' | 'top';
  variant?: ButtonVariants;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  onClick: () => {},
  tooltipDelayDuration: 200,
  tooltipSide: 'bottom',
  variant: 'icon',
});

const slots = useSlots();

const showTooltip = computed(() => !!slots.tooltip || !!props.tooltip);
</script>

<template>
  <REMIButton
    v-if="!showTooltip"
    :class="cn('rounded-full', props.class)"
    :disabled="disabled"
    :variant="variant"
    size="icon"
    @click="onClick"
  >
    <slot></slot>
  </REMIButton>

  <REMITooltip
    v-else
    :delay-duration="tooltipDelayDuration"
    :side="tooltipSide"
  >
    <template #trigger>
      <REMIButton
        :class="cn('rounded-full', props.class)"
        :disabled="disabled"
        :variant="variant"
        size="icon"
        @click="onClick"
      >
        <slot></slot>
      </REMIButton>
    </template>
    <slot v-if="slots.tooltip" name="tooltip"> </slot>
    <template v-else>
      {{ tooltip }}
    </template>
  </REMITooltip>
</template>
