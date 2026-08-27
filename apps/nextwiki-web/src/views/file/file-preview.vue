<!--
 * 文件预览组件
 *
 * @path apps\nextwiki-web\src\views\file\file-preview.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件预览组件
 * <p>支持图片、PDF、文本、Office 文档（通过后端转换）等多种格式的预览。
 * <p>消费后端契约 PreviewController（generatePreview/isSupported/getPreviewType）。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ElButton, ElMessage, ElSkeleton, ElTag } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import { generatePreview, getPreviewType, isSupported } from '#/api/preview';
import { download } from '#/api/download';
import type { FileNodeVO } from '#/api/models';

defineOptions({ name: 'FilePreview' });

interface Props {
  /** 文件节点信息 */
  fileNode: FileNodeVO | null;
}

const props = withDefaults(defineProps<Props>(), {
  fileNode: null,
});

const emit = defineEmits<{ close: [] }>();

const loading = ref(false);
const previewSupported = ref(false);
const previewType = ref<string>('');
const previewUrl = ref<string>('');
const previewContent = ref<string>('');
const generating = ref(false);

/** 文件后缀 */
const fileSuffix = computed(() => {
  const name = props.fileNode?.name ?? '';
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : '';
});

/** 是否图片文件 */
const isImage = computed(() => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileSuffix.value));

/** 是否文本文件 */
const isText = computed(() => ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'java', 'py', 'log'].includes(fileSuffix.value));

/** 是否 PDF 文件 */
const isPdf = computed(() => fileSuffix.value === 'pdf');

/** 检查预览支持状态 */
async function checkPreviewSupport(): Promise<void> {
  if (!props.fileNode) return;
  loading.value = true;
  try {
    previewSupported.value = await isSupported({ suffix: fileSuffix.value });
    if (previewSupported.value) {
      previewType.value = await getPreviewType({ suffix: fileSuffix.value }) ?? '';
    }
  } catch {
    previewSupported.value = false;
  } finally {
    loading.value = false;
  }
}

/** 生成预览 */
async function handleGeneratePreview(): Promise<void> {
  if (!props.fileNode?.id) return;
  generating.value = true;
  try {
    await generatePreview({ fileNodeId: props.fileNode.id });
    ElMessage.success('预览生成成功，请刷新查看');
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    generating.value = false;
  }
}

/** 执行下载 */
async function handleDownload(): Promise<void> {
  if (!props.fileNode?.id) return;
  try {
    await download({ nodeId: props.fileNode.id }, {});
    ElMessage.success('下载已开始');
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载预览内容 */
async function loadPreviewContent(): Promise<void> {
  if (!props.fileNode) return;
  previewContent.value = '';
  previewUrl.value = '';

  if (isImage.value) {
    // 图片直接使用 URL 预览
    previewUrl.value = `/api/v1/nextwiki/download/${props.fileNode.id}`;
    return;
  }

  if (isText.value) {
    // 文本文件通过 fetch 获取内容
    try {
      const resp = await fetch(`/api/v1/nextwiki/download/${props.fileNode.id}`);
      previewContent.value = await resp.text();
    } catch {
      previewContent.value = '加载文本内容失败';
    }
    return;
  }

  if (isPdf.value) {
    previewUrl.value = `/api/v1/nextwiki/download/${props.fileNode.id}`;
    return;
  }
}

watch(() => props.fileNode, async (node) => {
  if (node) {
    await checkPreviewSupport();
    await loadPreviewContent();
  }
}, { immediate: true });

onMounted(async () => {
  if (props.fileNode) {
    await checkPreviewSupport();
    await loadPreviewContent();
  }
});
</script>

<template>
  <div class="file-preview">
    <div v-if="!fileNode" class="flex h-64 items-center justify-center text-gray-400">
      请选择要预览的文件
    </div>
    <ElSkeleton v-else-if="loading" :rows="6" animated />
    <div v-else class="preview-container">
      <!-- 文件信息头部 -->
      <div class="mb-4 flex items-center justify-between border-b pb-3">
        <div>
          <h3 class="text-base font-medium">{{ fileNode.name }}</h3>
          <p class="mt-1 text-xs text-gray-500">
            {{ fileSuffix.toUpperCase() }} 格式
            <ElTag v-if="previewSupported" type="success" size="small" class="ml-2">支持预览</ElTag>
            <ElTag v-else type="warning" size="small" class="ml-2">不支持预览</ElTag>
          </p>
        </div>
        <div class="flex gap-2">
          <ElButton
            v-if="previewSupported && !isImage && !isText && !isPdf"
            type="primary"
            size="small"
            :loading="generating"
            @click="handleGeneratePreview"
          >
            生成预览
          </ElButton>
          <ElButton type="primary" size="small" @click="handleDownload">
            下载
          </ElButton>
          <ElButton size="small" @click="emit('close')">关闭</ElButton>
        </div>
      </div>

      <!-- 预览内容区 -->
      <div class="preview-content min-h-[400px] rounded border bg-gray-50 p-4">
        <!-- 图片预览 -->
        <div v-if="isImage && previewUrl" class="flex justify-center">
          <img :src="previewUrl" :alt="fileNode.name" class="max-h-[600px] max-w-full object-contain" />
        </div>

        <!-- PDF 预览 -->
        <div v-else-if="isPdf && previewUrl">
          <iframe :src="previewUrl" class="h-[600px] w-full rounded border-0" :title="fileNode.name" />
        </div>

        <!-- 文本预览 -->
        <div v-else-if="isText">
          <pre class="overflow-auto whitespace-pre-wrap break-words rounded bg-white p-4 font-mono text-sm">{{ previewContent }}</pre>
        </div>

        <!-- 已生成预览 -->
        <div v-else-if="fileNode.previewReady && fileNode.thumbnailKey">
          <img
            :src="`/api/v1/nextwiki/preview/${fileNode.id}`"
            :alt="fileNode.name"
            class="max-h-[600px] max-w-full object-contain"
          />
        </div>

        <!-- 不支持预览 -->
        <div v-else class="flex h-64 flex-col items-center justify-center text-gray-400">
          <p class="text-lg">该文件格式暂不支持在线预览</p>
          <p class="mt-2 text-sm">请下载后使用本地应用打开</p>
          <ElButton type="primary" class="mt-4" @click="handleDownload">立即下载</ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-preview {
  min-height: 500px;
}
.preview-content {
  max-height: 700px;
  overflow: auto;
}
</style>
