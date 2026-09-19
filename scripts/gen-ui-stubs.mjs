/**
 * 为 ydzs-ui/src/ui/ 下每个组件目录生成最小可用的 Vue SFC。
 *
 * 策略：
 *  - 每个组件至少导出一个默认 Vue 组件 + 配套 index.ts。
 *  - 结构遵循云顶编码规范：defineProps<Props> + withDefaults + <script setup lang="ts">。
 *  - 仅覆盖「index.ts 仅含占位注释」的目录（避免破坏已深化的组件）。
 *
 * @since 26.09.19
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'comm/@core/ui-kit/ydsz-ui/src/ui';

const INDEX_TPL = `/**
 * {CAMEL} 组件 barrel。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */
export { default as yd{PASCAL} } from './{KEBAB}.vue';
export type { {CAMEL}Props } from './{KEBAB}-types';
`;

const TYPES_TPL = `/**
 * {CAMEL} 组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * {CAMEL} 组件属性。
 */
export interface {CAMEL}Props {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
}

/**
 * {CAMEL} 组件事件。
 */
export interface {CAMEL}Emits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
`;

const SFC_TPL = `<!--
 * {CAMEL}（{YZSHN}）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { {CAMEL}Emits, {CAMEL}Props } from './{KEBAB}-types';

defineOptions({ name: 'Yd{PASCAL}' });

const props = withDefaults(defineProps<{CAMEL}Props>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<{CAMEL}Emits>();

function handleConfirm() {
  emit('confirm');
  emit('update:open', false);
}

function handleCancel() {
  emit('cancel');
  emit('update:open', false);
}
</script>

<template>
  <div :class="[\`yd-{KEBAB}\`, { 'yd-{KEBAB}--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-{KEBAB} {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-{KEBAB}--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
`;

function toCamel(s) {
  return s.replace(/(^|-)([a-z])/g, (_, _p, c) => c.toUpperCase());
}
function toPascal(s) {
  return s.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
}

const dirs = readdirSync(BASE).filter(d => {
  const p = join(BASE, d, 'index.ts');
  return existsSync(p);
});

let created = 0;

for (const kebab of dirs) {
  const indexPath = join(BASE, kebab, 'index.ts');
  const indexContent = readFileSync(indexPath, 'utf8');

  // 只覆盖「占位注释」状态（避免破坏已深化的组件）
  if (!indexContent.includes('@author ydsz-ai') && !indexContent.includes('barrel')) {
    continue;
  }
  if (indexContent.includes('export { default')) {
    continue; // 已经有实质导出
  }

  const camel = toCamel(kebab);
  const pascal = toPascal(kebab);

  const indexContentNew = INDEX_TPL
    .replaceAll('{CAMEL}', camel)
    .replaceAll('{PASCAL}', pascal)
    .replaceAll('{KEBAB}', kebab);

  const typesPath = join(BASE, kebab, `${kebab}-types.ts`);
  const sfcPath = join(BASE, kebab, `${kebab}.vue`);

  if (!existsSync(typesPath)) {
    writeFileSync(typesPath, TYPES_TPL.replaceAll('{CAMEL}', camel));
  }
  if (!existsSync(sfcPath)) {
    writeFileSync(sfcPath, SFC_TPL
      .replaceAll('{CAMEL}', camel)
      .replaceAll('{PASCAL}', pascal)
      .replaceAll('{KEBAB}', kebab)
      .replaceAll('{YZSHN}', kebab));
  }
  writeFileSync(indexPath, indexContentNew);
  created++;
}

console.log(`✓ 为 ${created} 个组件生成了 SFC + types + barrel。`);
