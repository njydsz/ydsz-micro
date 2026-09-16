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
 * @path apps\workflow-web\src\components\flow-diagram\index.vue
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
import { Card, CardContent, CardHeader, CardTitle } from '@ydsz-core/ui-kit/shadcn-ui';
// TODO: ElEmpty / ElSkeleton 待后续迁移（shadcn-ui 无直接对应，需替换为空态组件）
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
  <Card v-if="bordered" class="flow-diagram">
    <CardHeader>
      <CardTitle class="text-sm font-semibold">流程进度</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="diagram-container">
        <div v-if="loading" class="animate-pulse space-y-2">
          <div v-for="n in 6" :key="n" class="h-4 bg-gray-200 rounded" />
        </div>
        <div v-else-if="!hasDiagram" class="flex items-center justify-center py-12 text-sm text-gray-400">
          暂无流程图
        </div>
        <div v-else class="diagram-content" @click="handleSvgClick" v-safe-html="svgContent" />
      </div>
    </CardContent>
  </Card>
  <div v-else class="flow-diagram flow-diagram--borderless">
    <div class="diagram-container">
      <div v-if="loading" class="animate-pulse space-y-2">
        <div v-for="n in 6" :key="n" class="h-4 bg-gray-200 rounded" />
      </div>
      <div v-else-if="!hasDiagram" class="flex items-center justify-center py-12 text-sm text-gray-400">
        暂无流程图
      </div>
      <div v-else class="diagram-content" @click="handleSvgClick" v-safe-html="svgContent" />
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
