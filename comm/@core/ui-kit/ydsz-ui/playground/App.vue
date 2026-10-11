<!--
 * YDSZ UI 在线演练场 Demo —— 展示核心组件用法。
 *
 * 覆盖：Button / Input / Select / Dialog / ConfigProvider，
 * 每个 section 独立展示组件的变体与交互，附带 ARIA 标签满足 §11 可访问性规范。
 *
 * @path comm\@core\ui-kit\ydsz-ui\playground\App.vue
 * @author ydsz-team
 * @since 26.10.27
 -->
<script setup lang="ts">
import { ref } from 'vue';

import YdButton from '../src/ui/button/button.vue';
import YdInput from '../src/ui/input/input.vue';
import YdSelect from '../src/ui/select/select.vue';
import YdConfigProvider from '../src/ui/config-provider/config-provider.vue';
import YdDialogContent from '../src/primitives/dialog/YdDialogContent.vue';
import YdDialogTrigger from '../src/primitives/dialog/YdDialogTrigger.vue';
import YdDialog from '../src/primitives/dialog/YdDialog.vue';

const inputValue = ref('');
const selectOpen = ref(false);
const dialogOpen = ref(false);
</script>

<template>
  <YdConfigProvider
    theme="auto"
    locale="zh-CN"
    density="standard"
  >
    <main
      id="playground-main"
      aria-label="YDSZ UI 演练场主内容区"
      class="playground"
    >
      <header class="playground__header">
        <h1 class="playground__title">
          YDSZ UI Playground
        </h1>
        <p class="playground__subtitle">
          在线体验 YDSZ 设计系统核心组件 —— Button / Input / Select / Dialog
        </p>
      </header>

      <!-- ==================== Button ==================== -->
      <section
        aria-labelledby="section-button"
        class="playground__section"
      >
        <h2
          id="section-button"
          class="playground__section-title"
        >
          Button 按钮
        </h2>
        <div
          class="playground__row"
          role="group"
          aria-label="按钮变体示例"
        >
          <YdButton variant="primary">
            主要
          </YdButton>
          <YdButton variant="secondary">
            次要
          </YdButton>
          <YdButton variant="ghost">
            幽灵
          </YdButton>
          <YdButton variant="destructive">
            危险
          </YdButton>
          <YdButton disabled>
            禁用
          </YdButton>
        </div>
      </section>

      <!-- ==================== Input ==================== -->
      <section
        aria-labelledby="section-input"
        class="playground__section"
      >
        <h2
          id="section-input"
          class="playground__section-title"
        >
          Input 输入框
        </h2>
        <div class="playground__row">
          <label
            for="demo-input"
            class="playground__label"
          >请输入内容</label>
          <YdInput
            id="demo-input"
            v-model="inputValue"
            placeholder="请输入内容..."
            aria-label="演示输入框"
            class="playground__input"
          />
          <output
            class="playground__output"
            aria-live="polite"
          >
            当前值：{{ inputValue || '（空）' }}
          </output>
        </div>
      </section>

      <!-- ==================== Select ==================== -->
      <section
        aria-labelledby="section-select"
        class="playground__section"
      >
        <h2
          id="section-select"
          class="playground__section-title"
        >
          Select 选择器
        </h2>
        <div class="playground__row">
          <label
            for="demo-select"
            class="playground__label"
          >请选择</label>
          <YdSelect
            id="demo-select"
            v-model:open="selectOpen"
            aria-label="演示选择器"
            class="playground__select"
          >
            <option value="1">选项一</option>
            <option value="2">选项二</option>
            <option value="3">选项三</option>
          </YdSelect>
        </div>
      </section>

      <!-- ==================== Dialog ==================== -->
      <section
        aria-labelledby="section-dialog"
        class="playground__section"
      >
        <h2
          id="section-dialog"
          class="playground__section-title"
        >
          Dialog 对话框
        </h2>
        <div class="playground__row">
          <YdDialog v-model:open="dialogOpen">
            <YdDialogTrigger as-child>
              <YdButton variant="primary">
                打开 Dialog
              </YdButton>
            </YdDialogTrigger>
            <YdDialogContent
              aria-labelledby="dialog-title"
              aria-describedby="dialog-desc"
            >
              <h3
                id="dialog-title"
                class="playground__dialog-title"
              >
                Dialog 标题
              </h3>
              <p
                id="dialog-desc"
                class="playground__dialog-desc"
              >
                这是一个对话框内容示例。支持 Esc 关闭与点击遮罩关闭。
              </p>
              <div class="playground__dialog-footer">
                <YdButton
                  variant="outline"
                  @click="dialogOpen = false"
                >
                  取消
                </YdButton>
                <YdButton
                  variant="primary"
                  @click="dialogOpen = false"
                >
                  确认
                </YdButton>
              </div>
            </YdDialogContent>
          </YdDialog>
        </div>
      </section>
    </main>
  </YdConfigProvider>
</template>

<style scoped>
/* ==================== 布局容器 ==================== */
.playground {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--ydsz-spacing-lg, 24px);
  font-family: var(
    --ydsz-font-family,
    'YDSZ Sans',
    system-ui,
    sans-serif
  );
  color: hsl(var(--ydsz-text-primary));
  background-color: hsl(var(--ydsz-surface-1));
  min-height: 100vh;
}

/* ==================== 页头 ==================== */
.playground__header {
  margin-bottom: var(--ydsz-spacing-xl, 32px);
  padding-bottom: var(--ydsz-spacing-md, 16px);
  border-bottom: 1px solid hsl(var(--ydsz-border-default));
}

.playground__title {
  margin: 0 0 var(--ydsz-spacing-xs, 4px);
  font-size: var(--ydsz-font-size-2xl, 1.5rem);
  font-weight: var(--ydsz-font-weight-bold, 700);
  color: hsl(var(--ydsz-text-primary));
  line-height: var(--ydsz-line-height-tight);
}

.playground__subtitle {
  margin: 0;
  font-size: var(--ydsz-font-size-sm, 0.875rem);
  color: hsl(var(--ydsz-text-secondary));
}

/* ==================== 区块 ==================== */
.playground__section {
  margin-bottom: var(--ydsz-spacing-xl, 32px);
}

.playground__section-title {
  margin: 0 0 var(--ydsz-spacing-sm, 8px);
  font-size: var(--ydsz-font-size-lg, 1.125rem);
  font-weight: var(--ydsz-font-weight-semibold, 600);
  color: hsl(var(--ydsz-text-primary));
}

.playground__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ydsz-spacing-sm, 8px);
}

/* ==================== 表单控件 ==================== */
.playground__label {
  font-size: var(--ydsz-font-size-sm, 0.875rem);
  font-weight: var(--ydsz-font-weight-medium, 500);
  color: hsl(var(--ydsz-text-secondary));
}

.playground__input {
  max-width: 300px;
}

.playground__select {
  max-width: 200px;
}

.playground__output {
  font-size: var(--ydsz-font-size-xs, 0.75rem);
  color: hsl(var(--ydsz-text-tertiary));
}

/* ==================== Dialog 内部 ==================== */
.playground__dialog-title {
  margin: 0 0 var(--ydsz-spacing-sm, 8px);
  font-size: var(--ydsz-font-size-lg, 1.125rem);
  font-weight: var(--ydsz-font-weight-semibold, 600);
  color: hsl(var(--ydsz-text-primary));
}

.playground__dialog-desc {
  margin: 0 0 var(--ydsz-spacing-md, 16px);
  font-size: var(--ydsz-font-size-sm, 0.875rem);
  color: hsl(var(--ydsz-text-secondary));
  line-height: var(--ydsz-line-height-normal);
}

.playground__dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ydsz-spacing-sm, 8px);
}
</style>
