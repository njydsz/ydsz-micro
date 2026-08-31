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
import { ElButton, ElIcon, ElSlider, ElSpace, ElTooltip } from 'element-plus';
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
      <ElSpace :size="4">
        <!-- 撤销 -->
        <ElTooltip content="撤销 Ctrl+Z" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('undo')">
            <ElIcon><span class="icon-undo" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <!-- 重做 -->
        <ElTooltip content="重做 Ctrl+Y" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('redo')">
            <ElIcon><span class="icon-redo" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <div class="toolbar-divider" />
        <!-- 缩小 -->
        <ElTooltip content="缩小" placement="bottom">
          <ElButton :disabled="zoomPercent <= 50 || locked || loading" @click="handleZoomOut">
            <ElIcon><span class="icon-zoom-out" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <!-- 缩放滑块 -->
        <div class="zoom-slider">
          <ElSlider
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
        <ElTooltip content="放大" placement="bottom">
          <ElButton :disabled="zoomPercent >= 200 || locked || loading" @click="handleZoomIn">
            <ElIcon><span class="icon-zoom-in" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <!-- 重置缩放 -->
        <ElTooltip content="重置缩放" placement="bottom">
          <ElButton @click="handleZoomReset">
            {{ zoomLabel }}
          </ElButton>
        </ElTooltip>
        <div class="toolbar-divider" />
        <!-- 对齐操作 -->
        <ElTooltip content="左对齐" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('alignLeft')">
            <ElIcon><span class="icon-align-left" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <ElTooltip content="水平居中" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('alignCenter')">
            <ElIcon><span class="icon-align-center" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <ElTooltip content="右对齐" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('alignRight')">
            <ElIcon><span class="icon-align-right" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <ElTooltip content="上对齐" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('alignTop')">
            <ElIcon><span class="icon-align-top" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <ElTooltip content="垂直居中" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('alignMiddle')">
            <ElIcon><span class="icon-align-middle" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <ElTooltip content="下对齐" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('alignBottom')">
            <ElIcon><span class="icon-align-bottom" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <ElTooltip content="水平分布" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('distributeHorizontal')">
            <ElIcon><span class="icon-distribute-h" /></ElIcon>
          </ElButton>
        </ElTooltip>
        <ElTooltip content="垂直分布" placement="bottom">
          <ElButton :disabled="locked || loading" @click="emit('distributeVertical')">
            <ElIcon><span class="icon-distribute-v" /></ElIcon>
          </ElButton>
        </ElTooltip>
      </ElSpace>
    </div>
    <div class="toolbar-right">
      <ElSpace>
        <ElTooltip content="保存 Ctrl+S" placement="bottom">
          <ElButton
            type="primary"
            :loading="saving"
            :disabled="locked || loading"
            @click="emit('save')"
          >
            <ElIcon><span class="icon-save" /></ElIcon>
            保存
          </ElButton>
        </ElTooltip>
      </ElSpace>
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
  border-bottom: 1px solid var(--el-border-color-lighter);
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
  background: var(--el-border-color-lighter);
  margin: 0 4px;
}

.zoom-slider {
  width: 100px;
  padding: 0 8px;
}
</style>
