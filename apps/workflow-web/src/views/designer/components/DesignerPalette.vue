<!--
 * 流程设计器节点面板
 *
 * <p>左侧节点面板，提供可拖拽的流程节点类型。
 *
 * @path apps\workflow-web\src\views\designer\components\DesignerPalette.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程设计器节点面板
 * <p>展示可拖拽的节点类型，支持拖拽到画布创建节点。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ref } from 'vue';
import type { PaletteItem } from '../types';
import { DesignerNodeType } from '../types';

/** 节点面板列表 */
const paletteItems = ref<PaletteItem[]>([
  {
    type: DesignerNodeType.START,
    label: '开始',
    icon: 'lucide:play-circle',
    width: 60,
    height: 60,
  },
  {
    type: DesignerNodeType.END,
    label: '结束',
    icon: 'lucide:stop-circle',
    width: 60,
    height: 60,
  },
  {
    type: DesignerNodeType.APPROVE,
    label: '审批',
    icon: 'lucide:user-check',
    width: 120,
    height: 60,
  },
  {
    type: DesignerNodeType.AI_AGENT,
    label: 'AI审批',
    icon: 'lucide:bot',
    width: 120,
    height: 60,
  },
  {
    type: DesignerNodeType.SERVICE,
    label: '服务',
    icon: 'lucide:server',
    width: 120,
    height: 60,
  },
  {
    type: DesignerNodeType.CONDITION,
    label: '条件',
    icon: 'lucide:git-branch',
    width: 100,
    height: 100,
  },
  {
    type: DesignerNodeType.SUB_PROCESS,
    label: '子流程',
    icon: 'lucide:layers',
    width: 120,
    height: 60,
  },
]);

/**
 * 处理拖拽开始
 *
 * @param event 拖拽事件
 * @param item 节点项
 */
function handleDragStart(event: DragEvent, item: PaletteItem) {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData('application/json', JSON.stringify(item));
  event.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <div class="designer-palette">
    <div class="palette-header">节点面板</div>
    <div class="palette-list">
      <div
        v-for="item in paletteItems"
        :key="item.type"
        class="palette-item"
        draggable="true"
        @dragstart="handleDragStart($event, item)"
      >
        <div class="item-icon">
          <span class="node-preview" :class="`node-preview--${item.type}`" />
        </div>
        <span class="item-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.designer-palette {
  width: 160px;
  background: #fff;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.palette-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.palette-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: grab;
  transition: background 0.2s;
  user-select: none;
}

.palette-item:hover {
  background: var(--el-color-primary-light-9);
}

.palette-item:active {
  cursor: grabbing;
}

.item-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-preview {
  display: inline-block;
  border: 2px solid;
}

.node-preview--start,
.node-preview--end {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.node-preview--start {
  border-color: #67c23a;
  background: #f0f9eb;
}

.node-preview--end {
  border-color: #f56c6c;
  background: #fef0f0;
}

.node-preview--approve {
  width: 28px;
  height: 18px;
  border-radius: 4px;
  border-color: #409eff;
  background: #ecf5ff;
}

.node-preview--service {
  width: 28px;
  height: 18px;
  border-radius: 4px;
  border-color: #e6a23c;
  background: #fdf6ec;
}

.node-preview--condition {
  width: 20px;
  height: 20px;
  transform: rotate(45deg);
  border-color: #909399;
  background: #f4f4f5;
}

.node-preview--sub_process {
  width: 28px;
  height: 18px;
  border-radius: 4px;
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: inset 2px 2px 0 #409eff;
}

.node-preview--ai_agent {
  width: 28px;
  height: 18px;
  border-radius: 4px;
  border-color: #9254de;
  background: #f9f0ff;
}

.item-label {
  font-size: 13px;
  color: #606266;
}
</style>
