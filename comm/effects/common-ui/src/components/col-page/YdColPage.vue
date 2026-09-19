<!--
 * col-page 通用组件
 *
 * @path comm\effects\common-ui\src\components\col-page\col-page.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { ColPageProps } from './types';

import { computed, ref, useSlots } from 'vue';

import {
  YdResizableHandle,
  YdResizablePanel,
  YdResizablePanelGroup,
} from '@ydsz-core/ydsz-ui';

import Page from '../page/YdPage.vue';

defineOptions({
  name: 'YdColPage',
  inheritAttrs: false,
});

const props = withDefaults(defineProps<ColPageProps>(), {
  leftWidth: 30,
  rightWidth: 70,
  resizable: true,
});

const delegatedProps = computed(() => {
  const { leftWidth: _, ...delegated } = props;
  return delegated;
});

const slots = useSlots();

const delegatedSlots = computed(() => {
  const resultSlots: string[] = [];

  for (const key of Object.keys(slots)) {
    if (!['default', 'left'].includes(key)) {
      resultSlots.push(key);
    }
  }
  return resultSlots;
});

const leftPanelRef = ref<InstanceType<typeof YdResizablePanel>>();

function expandLeft() {
  leftPanelRef.value?.expand();
}

function collapseLeft() {
  leftPanelRef.value?.collapse();
}

defineExpose({
  expandLeft,
  collapseLeft,
});
</script>
<template>
  <Page v-bind="delegatedProps">
    <!-- 继承默认的slot -->
    <template
      v-for="slotName in delegatedSlots"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps"></slot>
    </template>

    <YdResizablePanelGroup class="w-full" direction="horizontal">
      <YdResizablePanel
        ref="leftPanelRef"
        :collapsed-size="leftCollapsedWidth"
        :collapsible="leftCollapsible"
        :default-size="leftWidth"
        :max-size="leftMaxWidth"
        :min-size="leftMinWidth"
      >
        <template #default="slotProps">
          <slot
            name="left"
            v-bind="{
              ...slotProps,
              expand: expandLeft,
              collapse: collapseLeft,
            }"
          ></slot>
        </template>
      </YdResizablePanel>
      <YdResizableHandle
        v-if="resizable"
        :style="{ backgroundColor: splitLine ? undefined : 'transparent' }"
        :with-handle="splitHandle"
      />
      <YdResizablePanel
        :collapsed-size="rightCollapsedWidth"
        :collapsible="rightCollapsible"
        :default-size="rightWidth"
        :max-size="rightMaxWidth"
        :min-size="rightMinWidth"
      >
        <template #default>
          <slot></slot>
        </template>
      </YdResizablePanel>
    </YdResizablePanelGroup>
  </Page>
</template>
