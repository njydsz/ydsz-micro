<!--
 * 流程图进度组件
 *
 * <p>展示流程实例的进度图，高亮当前节点和已完成路径。
 *
 * <p><b>核心功能：</b>
 * <ul>
 *   <li>渲染流程图 SVG/JSON
 *   <li>高亮当前节点（进行中）
 *   <li>高亮已完成路径
 *   <li>支持点击节点查看详情
 * </ul>
 *
 * @path apps\workflow-web\src\components\FlowDiagram\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程图进度组件
 * <p>通过 instanceId 加载流程图数据并渲染。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ElCard, ElEmpty, ElSkeleton } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import { diagram } from '#/api/flowInstance';
import type { FlowDiagramVO } from '#/api/models';

interface Props {
  /** 流程实例 ID */
  instanceId: string;
  /** 是否显示边框 */
  bordered?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  bordered: true,
});

const emit = defineEmits<{
  nodeClick: [nodeCode: string];
}>();

const loading = ref(false);
const diagramData = ref<FlowDiagramVO>({});

/** SVG 内容 */
const svgContent = computed(() => diagramData.value.svgContent || '');

/** 是否有图表数据 */
const hasDiagram = computed(() => !!svgContent.value || !!diagramData.value.diagramJson);

/**
 * 加载流程图数据
 */
async function loadDiagram() {
  if (!props.instanceId) return;
  loading.value = true;
  try {
    diagramData.value = await diagram({ id: props.instanceId });
  } catch {
    diagramData.value = {};
  } finally {
    loading.value = false;
  }
}

/**
 * 处理 SVG 点击事件
 */
function handleSvgClick(event: MouseEvent) {
  const target = event.target as SVGElement;
  const nodeCode = target.getAttribute('data-node-code');
  if (nodeCode) {
    emit('nodeClick', nodeCode);
  }
}

watch(() => props.instanceId, loadDiagram);

onMounted(() => {
  loadDiagram();
});
</script>

<template>
  <ElCard v-if="bordered" class="flow-diagram" shadow="never">
    <template #header>
      <span class="header-title">流程进度</span>
    </template>
    <div class="diagram-container">
      <ElSkeleton v-if="loading" :rows="6" animated />
      <ElEmpty v-else-if="!hasDiagram" description="暂无流程图" />
      <div
        v-else
        class="diagram-content"
        @click="handleSvgClick"
        v-safe-html="svgContent"
      />
    </div>
  </ElCard>
  <div v-else class="flow-diagram flow-diagram--borderless">
    <div class="diagram-container">
      <ElSkeleton v-if="loading" :rows="6" animated />
      <ElEmpty v-else-if="!hasDiagram" description="暂无流程图" />
      <div
        v-else
        class="diagram-content"
        @click="handleSvgClick"
        v-safe-html="svgContent"
      />
    </div>
  </div>
</template>

<style scoped>
.flow-diagram {
  overflow: hidden;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
}

.diagram-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.diagram-content {
  width: 100%;
  overflow-x: auto;
}

.diagram-content :deep(svg) {
  max-width: 100%;
  height: auto;
}

.flow-diagram--borderless {
  background: transparent;
}
</style>
