<!--
 * authentication 布局组件 - 现代化登录布局
 *
 * @path comm\effects\layouts\src\authentication\authentication.vue
 * @author remi-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ToolbarType } from "./types";

import { preferences, usePreferences } from "@remi/preferences";

import { Copyright } from "../basic/copyright";
import AuthenticationFormView from "./form.vue";
import SloganIcon from "./icons/slogan.vue";
import Toolbar from "./toolbar.vue";

interface Props {
  appName?: string;
  logo?: string;
  pageTitle?: string;
  pageDescription?: string;
  sloganImage?: string;
  toolbar?: boolean;
  copyright?: boolean;
  toolbarList?: ToolbarType[];
  clickLogo?: () => void;
}

withDefaults(defineProps<Props>(), {
  appName: "",
  copyright: true,
  logo: "",
  pageDescription: "",
  pageTitle: "",
  sloganImage: "",
  toolbar: true,
  toolbarList: () => ["color", "language", "layout", "theme"],
  clickLogo: () => {},
});

const { authPanelCenter, authPanelLeft, authPanelRight, isDark } =
  usePreferences();
</script>

<template>
  <div
    :class="[isDark ? 'dark' : '']"
    class="gradient-subtle flex min-h-screen flex-1 select-none overflow-x-hidden"
  >
    <template v-if="toolbar">
      <slot name="toolbar">
        <Toolbar :toolbar-list="toolbarList" />
      </slot>
    </template>

    <!-- 左侧认证面板 -->
    <AuthenticationFormView
      v-if="authPanelLeft"
      class="min-h-screen w-2/5 flex-1"
      transition-name="slide-left"
    >
      <template v-if="copyright" #copyright>
        <slot name="copyright">
          <Copyright
            v-if="preferences.copyright.enable"
            v-bind="preferences.copyright"
          />
        </slot>
      </template>
    </AuthenticationFormView>

    <slot name="logo">
      <!-- 头部 Logo 和应用名称 -->
      <div
        v-if="logo || appName"
        class="absolute left-0 top-0 z-10 flex flex-1"
        @click="clickLogo"
      >
        <div
          class="text-text-primary lg:text-text-primary ml-6 mt-6 flex flex-1 items-center sm:left-8 sm:top-8"
        >
          <img v-if="logo" :alt="appName" :src="logo" class="size-10" />
          <p
            v-if="appName"
            class="ml-3 m-0 text-xl font-semibold tracking-tight"
          >
            {{ appName }}
          </p>
        </div>
      </div>
    </slot>

    <!-- 系统介绍 - 现代化渐变背景 -->
    <div v-if="!authPanelCenter" class="relative hidden w-0 flex-1 lg:block">
      <div
        class="absolute inset-0 size-full"
        :class="isDark ? 'login-background-dark' : 'login-background'"
      >
        <!-- 装饰图形 -->
        <div
          class="login-decoration-1 absolute left-[10%] top-[20%] size-32 rounded-full bg-primary/10 blur-3xl"
        ></div>
        <div
          class="login-decoration-2 absolute right-[15%] top-[60%] size-40 rounded-full bg-primary/5 blur-3xl"
        ></div>
        <div
          class="login-decoration-3 absolute bottom-[20%] left-[30%] size-24 rounded-full bg-brand-300/20 blur-2xl"
        ></div>

        <div class="flex-col-center -enter-x mr-24 h-full">
          <template v-if="sloganImage">
            <img
              :alt="appName"
              :src="sloganImage"
              class="animate-float h-64 w-2/5"
            />
          </template>
          <SloganIcon v-else :alt="appName" class="animate-float h-64 w-2/5" />
          <div
            class="mt-8 text-2xl font-semibold tracking-tight text-text-primary"
          >
            {{ pageTitle }}
          </div>
          <div class="mt-3 text-base text-text-secondary">
            {{ pageDescription }}
          </div>
        </div>
      </div>
    </div>

    <!-- 中心认证面板 -->
    <div v-if="authPanelCenter" class="flex-center relative w-full">
      <div class="absolute inset-0 size-full gradient-subtle">
        <div
          class="login-decoration-1 absolute left-[10%] top-[20%] size-32 rounded-full bg-primary/8 blur-3xl"
        ></div>
        <div
          class="login-decoration-2 absolute right-[15%] top-[60%] size-40 rounded-full bg-primary/4 blur-3xl"
        ></div>
      </div>
      <AuthenticationFormView
        class="glass w-full max-w-md rounded-2xl p-8 shadow-overlay"
      >
        <template v-if="copyright" #copyright>
          <slot name="copyright">
            <Copyright
              v-if="preferences.copyright.enable"
              v-bind="preferences.copyright"
            />
          </slot>
        </template>
      </AuthenticationFormView>
    </div>

    <!-- 右侧认证面板 -->
    <AuthenticationFormView
      v-if="authPanelRight"
      class="min-h-screen w-[34%] flex-1"
    >
      <template v-if="copyright" #copyright>
        <slot name="copyright">
          <Copyright
            v-if="preferences.copyright.enable"
            v-bind="preferences.copyright"
          />
        </slot>
      </template>
    </AuthenticationFormView>
  </div>
</template>

<style scoped>
.login-background {
  background: linear-gradient(
    135deg,
    hsl(var(--bg-canvas)) 0%,
    hsl(var(--brand-50)) 50%,
    hsl(var(--bg-canvas)) 100%
  );
}

.login-background-dark {
  background: linear-gradient(
    135deg,
    hsl(var(--bg-canvas)) 0%,
    hsl(var(--brand-50)) 50%,
    hsl(var(--bg-canvas)) 100%
  );
}

.login-decoration-1 {
  animation: float 8s ease-in-out infinite;
}

.login-decoration-2 {
  animation: float 10s ease-in-out infinite reverse;
}

.login-decoration-3 {
  animation: float 6s ease-in-out infinite;
  animation-delay: 2s;
}
</style>
