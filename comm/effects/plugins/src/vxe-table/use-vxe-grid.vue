<!--
 * use-vxe-grid Vue 组件
 *
 * @path comm\effects\plugins\src\vxe-table\use-vxe-grid.vue
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 表格核心逻辑已抽取至 {@link useVxeGridLogic} composable，
 * 本文件仅保留 Props/Emits 定义、Template 与 Styles，
 * 确保单文件组件不超过 400 行。
 *
 * 完整逻辑请参考：
 * - `composables/use-vxe-grid-logic.ts` — CRUD、分页、数据加载、列配置
 * - `init.ts` — vxe-table 组件注册与表单初始化
 * - `extends.ts` — 代理请求包装与格式化器注册
 * - `api.ts` — VxeGridApi 操作句柄
 * - `types.ts` — 类型定义
 * - `use-vxe-grid.ts` — useYDSZVxeGrid 工厂函数
*/
-->
<script lang="ts" setup>
import type { ExtendedVxeGridApi, VxeGridProps } from './types';

import { cn } from '@ydsz/utils';

import { YDSZHelpTooltip, YDSZLoading } from '@YDSZ-core/shadcn-ui';

import { VxeButton } from 'vxe-pc-ui';
import { VxeGrid } from 'vxe-table';

import { EmptyIcon } from '@ydsz/icons';
import { $t } from '@ydsz/locales';

import { useVxeGridLogic } from './composables/use-vxe-grid-logic';

import 'vxe-table/styles/cssvar.scss';
import 'vxe-pc-ui/styles/cssvar.scss';
import './style.css';

interface Props extends VxeGridProps {
  api: ExtendedVxeGridApi;
}

const props = withDefaults(defineProps<Props>(), {});

const {
  gridRef,
  options,
  events,
  showToolbar,
  showTableTitle,
  tableTitle,
  tableTitleHelp,
  delegatedSlots,
  delegatedFormSlots,
  formOptions,
  showSearchForm,
  isCompactForm,
  isSeparator,
  separatorBg,
  FORM_SLOT_PREFIX,
  Form,
  onSearchBtnClick,
  gridOptions,
  showDefaultEmpty,
  className,
  gridClass,
} = useVxeGridLogic(props);
</script>

<template>
  <div :class="cn('bg-card h-full rounded-md', className)">
    <VxeGrid
      ref="gridRef"
      :class="
        cn(
          'p-2',
          {
            'pt-0': showToolbar && !formOptions,
          },
          gridClass,
        )
      "
      v-bind="options"
      v-on="events"
    >
      <!-- 左侧操作区域或者title -->
      <template v-if="showToolbar" #toolbar-actions="slotProps">
        <slot v-if="showTableTitle" name="table-title">
          <div class="mr-1 pl-1 text-[1rem]">
            {{ tableTitle }}
            <YDSZHelpTooltip v-if="tableTitleHelp" trigger-class="pb-1">
              {{ tableTitleHelp }}
            </YDSZHelpTooltip>
          </div>
        </slot>
        <slot name="toolbar-actions" v-bind="slotProps"> </slot>
      </template>

      <!-- 继承默认的slot -->
      <template
        v-for="slotName in delegatedSlots"
        :key="slotName"
        #[slotName]="slotProps"
      >
        <slot :name="slotName" v-bind="slotProps"></slot>
      </template>
      <template #toolbar-tools="slotProps">
        <slot name="toolbar-tools" v-bind="slotProps"></slot>
        <VxeButton
          icon="vxe-icon-search"
          circle
          class="ml-2"
          v-if="gridOptions?.toolbarConfig?.search && !!formOptions"
          :status="showSearchForm ? 'primary' : undefined"
          :title="$t('common.search')"
          @click="onSearchBtnClick"
        />
      </template>

      <!-- form表单 -->
      <template #form>
        <div
          v-if="formOptions"
          v-show="showSearchForm !== false"
          :class="
            cn(
              'relative rounded py-3',
              isCompactForm
                ? isSeparator
                  ? 'pb-8'
                  : 'pb-4'
                : isSeparator
                  ? 'pb-4'
                  : 'pb-0',
            )
          "
        >
          <slot name="form">
            <Form>
              <template
                v-for="slotName in delegatedFormSlots"
                :key="slotName"
                #[slotName]="slotProps"
              >
                <slot
                  :name="`${FORM_SLOT_PREFIX}${slotName}`"
                  v-bind="slotProps"
                ></slot>
              </template>
              <template #reset-before="slotProps">
                <slot name="reset-before" v-bind="slotProps"></slot>
              </template>
              <template #submit-before="slotProps">
                <slot name="submit-before" v-bind="slotProps"></slot>
              </template>
              <template #expand-before="slotProps">
                <slot name="expand-before" v-bind="slotProps"></slot>
              </template>
              <template #expand-after="slotProps">
                <slot name="expand-after" v-bind="slotProps"></slot>
              </template>
            </Form>
          </slot>
          <div
            v-if="isSeparator"
            :style="{
              ...(separatorBg ? { backgroundColor: separatorBg } : undefined),
            }"
            class="bg-background-deep z-100 absolute -left-2 bottom-1 h-2 w-[calc(100%+1rem)] overflow-hidden md:bottom-2 md:h-3"
          ></div>
        </div>
      </template>
      <!-- loading -->
      <template #loading>
        <slot name="loading">
          <YDSZLoading :spinning="true" />
        </slot>
      </template>
      <!-- 统一控状态 -->
      <template v-if="showDefaultEmpty" #empty>
        <slot name="empty">
          <EmptyIcon class="mx-auto" />
          <div class="mt-2">{{ $t('common.noData') }}</div>
        </slot>
      </template>
    </VxeGrid>
  </div>
</template>
