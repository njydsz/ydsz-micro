<!--
 * 代码预览对话框
 *
 * <p>展示模板引擎渲染后的代码内容，标记冲突文件。
 *
 * @path apps/generator-web/src/views/code-gen/code-preview-dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
/**
 * 代码预览对话框组件。
 *
 * <p>列表展示所有将要生成的文件，点击文件名查看代码内容。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref, watch } from 'vue';

import {
  ElDialog,
  ElEmpty,
  ElIcon,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';
import { Warning } from '@element-plus/icons-vue';

import type { CodePreviewVO } from '#/api/models';

interface Props {
  visible: boolean;
  previewList: CodePreviewVO[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

defineOptions({ name: 'CodePreviewDialog' });

const activeFileIndex = ref(0);

const conflictCount = computed(
  () => props.previewList.filter((item) => item.conflict).length,
);

const currentContent = computed(
  () => props.previewList[activeFileIndex.value]?.content ?? '',
);

const currentFileName = computed(
  () => props.previewList[activeFileIndex.value]?.fileName ?? '',
);

function handleFileSelect(index: number) {
  activeFileIndex.value = index;
}

function handleClose() {
  emit('update:visible', false);
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      activeFileIndex.value = 0;
    }
  },
);
</script>

<template>
  <ElDialog
    :model-value="visible"
    title="代码预览"
    width="80%"
    top="5vh"
    @update:model-value="handleClose"
  >
    <div v-if="previewList.length > 0" class="flex gap-4" style="height: 70vh">
      <!-- 文件列表 -->
      <div class="w-64 overflow-y-auto border-r pr-3">
        <div class="mb-2 text-sm text-gray-500">
          共 {{ previewList.length }} 个文件
          <ElTag v-if="conflictCount > 0" type="warning" size="small" class="ml-2">
            {{ conflictCount }} 个冲突
          </ElTag>
        </div>
        <div
          v-for="(item, idx) in previewList"
          :key="idx"
          class="cursor-pointer px-2 py-2 rounded text-sm hover:bg-gray-100 mb-1"
          :class="{ 'bg-blue-50 text-blue-600': idx === activeFileIndex }"
          @click="handleFileSelect(idx)"
        >
          <div class="flex items-center gap-1">
            <ElIcon v-if="item.conflict" color="#e6a23c">
              <Warning />
            </ElIcon>
            <span class="truncate">{{ item.fileName }}</span>
          </div>
          <div class="text-xs text-gray-400 truncate">{{ item.filePath }}</div>
        </div>
      </div>

      <!-- 代码内容 -->
      <div class="flex-1 overflow-auto">
        <div class="mb-2 flex items-center justify-between">
          <span class="font-medium">{{ currentFileName }}</span>
        </div>
        <pre class="bg-gray-50 p-4 rounded text-xs overflow-auto" style="max-height: 60vh"><code>{{ currentContent }}</code></pre>
      </div>
    </div>
    <ElEmpty v-else description="暂无预览数据" />
  </ElDialog>
</template>
