<!--
 * user-dropdown 布局组件
 *
 * @path comm\effects\layouts\src\widgets\user-dropdown\user-dropdown.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { Component } from 'vue';

import type { AnyFunction } from '@ydsz/types';

import { computed, useTemplateRef, watch } from 'vue';

import { useHoverToggle } from '@ydsz/hooks';
import { LockKeyhole, LogOut } from '@ydsz/icons';
import { $t } from '@ydsz/locales';
import { preferences, usePreferences } from '@ydsz/preferences';
import { useTokenStore } from '@ydsz/stores';
import { isWindowsOs } from '@ydsz/utils';

import { useYdModal } from '@ydsz-core/popup-ui';
import {
  YdBadge,
  YdDropdownMenuBase,
  YdDropdownMenuContentBase,
  YdDropdownMenuItemBase,
  YdDropdownMenuLabelBase,
  YdDropdownMenuSeparatorBase,
  YdDropdownMenuShortcutBase,
  YdDropdownMenuTriggerBase,
  YdAvatar,
  YdIcon,
} from '@ydsz-core/ydsz-ui';

import { useMagicKeys, whenever } from '@vueuse/core';

import { LockScreenModal } from '../lock-screen';

interface Props {
  /**
   * 头像
   */
  avatar?: string;
  /**
   * @zh_CN 描述
   */
  description?: string;
  /**
   * 是否启用快捷键
   */
  enableShortcutKey?: boolean;
  /**
   * 菜单数组
   */
  menus?: Array<{
    handler: AnyFunction;
    icon?: Component | Function | string;
    text: string;
  }>;

  /**
   * 标签文本
   */
  tagText?: string;
  /**
   * 文本
   */
  text?: string;
  /** 触发方式 */
  trigger?: 'both' | 'click' | 'hover';
  /** hover触发时，延迟响应的时间 */
  hoverDelay?: number;
}

defineOptions({
  name: 'UserDropdown',
});

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  description: '',
  enableShortcutKey: true,
  menus: () => [],
  showShortcutKey: true,
  tagText: '',
  text: '',
  trigger: 'click',
  hoverDelay: 500,
});

const emit = defineEmits<{ logout: [] }>();

const { globalLockScreenShortcutKey, globalLogoutShortcutKey } =
  usePreferences();
const tokenStore = useTokenStore();
const [LockModal, lockModalApi] = useYdModal({
  connectedComponent: LockScreenModal,
});
const [LogoutModal, logoutModalApi] = useYdModal({
  onConfirm() {
    handleSubmitLogout();
  },
});

const refTrigger = useTemplateRef('refTrigger');
const refContent = useTemplateRef('refContent');
const [openPopover, hoverWatcher] = useHoverToggle(
  [refTrigger, refContent],
  () => props.hoverDelay,
);

watch(
  () => props.trigger === 'hover' || props.trigger === 'both',
  (val) => {
    if (val) {
      hoverWatcher.enable();
    } else {
      hoverWatcher.disable();
    }
  },
  {
    immediate: true,
  },
);

const altView = computed(() => (isWindowsOs() ? 'Alt' : '⌥'));

const enableLogoutShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLogoutShortcutKey.value;
});

const enableLockScreenShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLockScreenShortcutKey.value;
});

const enableShortcutKey = computed(() => {
  return props.enableShortcutKey && preferences.shortcutKeys.enable;
});

function handleOpenLock() {
  lockModalApi.open();
}

function handleSubmitLock(lockScreenPassword: string) {
  lockModalApi.close();
  tokenStore.lockScreen(lockScreenPassword);
}

function handleLogout() {
  // emit
  logoutModalApi.open();
  openPopover.value = false;
}

function handleSubmitLogout() {
  emit('logout');
  logoutModalApi.close();
}

if (enableShortcutKey.value) {
  const keys = useMagicKeys();
  whenever(keys['Alt+KeyQ']!, () => {
    if (enableLogoutShortcutKey.value) {
      handleLogout();
    }
  });

  whenever(keys['Alt+KeyL']!, () => {
    if (enableLockScreenShortcutKey.value) {
      handleOpenLock();
    }
  });
}
</script>

<template>
  <LockModal
    v-if="preferences.widget.lockScreen"
    :avatar="avatar"
    :text="text"
    @submit="handleSubmitLock"
  />

  <LogoutModal
    :cancel-text="$t('common.cancel')"
    :confirm-text="$t('common.confirm')"
    :fullscreen-button="false"
    :title="$t('common.prompt')"
    centered
    content-class="px-8 min-h-10"
    footer-class="border-none mb-3 mr-3"
    header-class="border-none"
  >
    {{ $t('ui.widgets.logoutTip') }}
  </LogoutModal>

  <YdDropdownMenuBase v-model:open="openPopover">
    <YdDropdownMenuTriggerBase ref="refTrigger" :disabled="props.trigger === 'hover'">
      <div class="hover:bg-accent ml-1 mr-2 cursor-pointer rounded-full p-1.5">
        <div class="hover:text-accent-foreground flex-center">
          <YdAvatar :alt="text" :src="avatar" class="size-8" dot />
        </div>
      </div>
    </YdDropdownMenuTriggerBase>
    <YdDropdownMenuContentBase class="mr-2 min-w-[240px] p-0 pb-1">
      <div ref="refContent">
        <YdDropdownMenuLabelBase class="flex items-center p-3">
          <YdAvatar
            :alt="text"
            :src="avatar"
            class="size-12"
            dot
            dot-class="bottom-0 right-1 border-2 size-4 bg-green-500"
          />
          <div class="ml-2 w-full">
            <div
              v-if="tagText || text || $slots.tagText"
              class="text-foreground mb-1 flex items-center text-sm font-medium"
            >
              {{ text }}
              <slot name="tagText">
                <YdBadge v-if="tagText" class="ml-2 text-green-400">
                  {{ tagText }}
                </YdBadge>
              </slot>
            </div>
            <div class="text-muted-foreground text-xs font-normal">
              {{ description }}
            </div>
          </div>
        </YdDropdownMenuLabelBase>
        <YdDropdownMenuSeparatorBase v-if="menus?.length" />
        <YdDropdownMenuItemBase
          v-for="menu in menus"
          :key="menu.text"
          class="mx-1 flex cursor-pointer items-center rounded-sm py-1 leading-8"
          @click="menu.handler"
        >
          <YdIcon :icon="menu.icon" class="mr-2 size-4" />
          {{ menu.text }}
        </YdDropdownMenuItemBase>
        <YdDropdownMenuSeparatorBase />
        <YdDropdownMenuItemBase
          v-if="preferences.widget.lockScreen"
          class="mx-1 flex cursor-pointer items-center rounded-sm py-1 leading-8"
          @click="handleOpenLock"
        >
          <LockKeyhole class="mr-2 size-4" />
          {{ $t('ui.widgets.lockScreen.title') }}
          <YdDropdownMenuShortcutBase v-if="enableLockScreenShortcutKey">
            {{ altView }} L
          </YdDropdownMenuShortcutBase>
        </YdDropdownMenuItemBase>
        <YdDropdownMenuSeparatorBase v-if="preferences.widget.lockScreen" />
        <YdDropdownMenuItemBase
          class="mx-1 flex cursor-pointer items-center rounded-sm py-1 leading-8"
          @click="handleLogout"
        >
          <LogOut class="mr-2 size-4" />
          {{ $t('common.logout') }}
          <YdDropdownMenuShortcutBase v-if="enableLogoutShortcutKey">
            {{ altView }} Q
          </YdDropdownMenuShortcutBase>
        </YdDropdownMenuItemBase>
      </div>
    </YdDropdownMenuContentBase>
  </YdDropdownMenuBase>
</template>
