<!--
 * 流程设计器工具栏
 *
 * <p>顶部工具栏，提供保存、撤销、重做、缩放、对齐等操作。
 *
 * @path apps\workflow-web\src\views\designer\components\DesignerToolbar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程设计器工具栏
 * <p>提供撤销/重做、缩放控制、对齐操作、保存等功能。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { YdButton, YdIcon, YdSlider, YdSpace, YdTooltip } from '@ydsz-core/ydsz-ui';
import { computed, ref } from 'vue';

interface Props {
  /** 加载状态 */
  loading: boolean;
  /** 保存状态 */
  saving: boolean;
  /** 锁定状态 */
  locked: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  save: [];
  undo: [];
  redo: [];
  zoomIn: [];
  zoomOut: [];
  zoomReset: [];
  alignLeft: [];
  alignCenter: [];
  alignRight: [];
  alignTop: [];
  alignMiddle: [];
  alignBottom: [];
  distributeHorizontal: [];
  distributeVertical: [];
}>();

/** 当前缩放比例（百分比） */
const zoomPercent = ref(100);

/** 缩放显示文本 */
const zoomLabel = computed(() => `${zoomPercent.value}%`);

/** 处理缩放变化 */
function handleZoomChange(value: number): void {
  zoomPercent.value = value;
  if (value > 100) {
    emit('zoomIn');
  } else if (value < 100) {
    emit('zoomOut');
  } else {
    emit('zoomReset');
  }
}

/** 放大 */
function handleZoomIn(): void {
  if (zoomPercent.value < 200) {
    zoomPercent.value = Math.min(zoomPercent.value + 10, 200);
    emit('zoomIn');
  }
}

/** 缩小 */
function handleZoomOut(): void {
  if (zoomPercent.value > 50) {
    zoomPercent.value = Math.max(zoomPercent.value - 10, 50);
    emit('zoomOut');
  }
}

/** 重置缩放 */
function handleZoomReset(): void {
  zoomPercent.value = 100;
  emit('zoomReset');
}
</script>

<template>
  <div class="designer-toolbar">
    <div class="toolbar-left">
      <span class="toolbar-title">流程设计器</span>
    </div>
    <div class="toolbar-center">
      <YdSpace :size="4">
        <!-- 撤销 -->
        <YdTooltip content="撤销 Ctrl+Z" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('undo')">
            <YdIcon><span class="icon-undo" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <!-- 重做 -->
        <YdTooltip content="重做 Ctrl+Y" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('redo')">
            <YdIcon><span class="icon-redo" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <div class="toolbar-divider" />
        <!-- 缩小 -->
        <YdTooltip content="缩小" placement="bottom">
          <YdButton :disabled="zoomPercent <= 50 || locked || loading" @click="handleZoomOut">
            <YdIcon><span class="icon-zoom-out" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <!-- 缩放滑块 -->
        <div class="zoom-slider">
          <YdSlider
            v-model="zoomPercent"
            :min="50"
            :max="200"
            :step="10"
            :disabled="locked || loading"
            :format-tooltip="() => zoomLabel"
            @change="handleZoomChange"
          />
        </div>
        <!-- 放大 -->
        <YdTooltip content="放大" placement="bottom">
          <YdButton :disabled="zoomPercent >= 200 || locked || loading" @click="handleZoomIn">
            <YdIcon><span class="icon-zoom-in" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <!-- 重置缩放 -->
        <YdTooltip content="重置缩放" placement="bottom">
          <YdButton @click="handleZoomReset">
            {{ zoomLabel }}
          </YdButton>
        </YdTooltip>
        <div class="toolbar-divider" />
        <!-- 对齐操作 -->
        <YdTooltip content="左对齐" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('alignLeft')">
            <YdIcon><span class="icon-align-left" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <YdTooltip content="水平居中" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('alignCenter')">
            <YdIcon><span class="icon-align-center" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <YdTooltip content="右对齐" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('alignRight')">
            <YdIcon><span class="icon-align-right" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <YdTooltip content="上对齐" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('alignTop')">
            <YdIcon><span class="icon-align-top" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <YdTooltip content="垂直居中" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('alignMiddle')">
            <YdIcon><span class="icon-align-middle" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <YdTooltip content="下对齐" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('alignBottom')">
            <YdIcon><span class="icon-align-bottom" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <YdTooltip content="水平分布" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('distributeHorizontal')">
            <YdIcon><span class="icon-distribute-h" /></YdIcon>
          </YdButton>
        </YdTooltip>
        <YdTooltip content="垂直分布" placement="bottom">
          <YdButton :disabled="locked || loading" @click="emit('distributeVertical')">
            <YdIcon><span class="icon-distribute-v" /></YdIcon>
          </YdButton>
        </YdTooltip>
      </YdSpace>
    </div>
    <div class="toolbar-right">
      <YdSpace>
        <YdTooltip content="保存 Ctrl+S" placement="bottom">
          <YdButton
            type="primary"
            :loading="saving"
            :disabled="locked || loading"
            @click="emit('save')"
          >
            <YdIcon><span class="icon-save" /></YdIcon>
            保存
          </YdButton>
        </YdTooltip>
      </YdSpace>
    </div>
  </div>
</template>

<style scoped>
.designer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid hsl(var(--border-subtle));
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 120px;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.toolbar-center {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  min-width: 120px;
  justify-content: flex-end;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: hsl(var(--border-subtle));
  margin: 0 4px;
}

.zoom-slider {
  width: 100px;
  padding: 0 8px;
}
</style>
