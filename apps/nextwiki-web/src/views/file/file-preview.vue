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
import { download, generateSignedUrl } from '#/api/download';
import { generatePreview, getPreviewType, isSupported } from '#/api/preview';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
const logger = createLogger('nextwiki-file');
const { t } = useI18n();
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
  } catch (error) {
    logger.warn('检查预览支持状态失败: {}', error);
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
    ElMessage.success(t('previewGenerated'));
  } catch (error) {
    logger.warn('生成预览失败: {}', error);
    // 用户提示由请求拦截器统一处理
  } finally {
    generating.value = false;
  }
}

/** 执行下载 */
async function handleDownload(): Promise<void> {
  if (!props.fileNode?.id) return;
  try {
    await download({ nodeId: props.fileNode.id }, {});
    ElMessage.success(t('downloadStarted'));
  } catch (error) {
    logger.warn('下载文件失败: {}', error);
    // 用户提示由请求拦截器统一处理
  }
}

/**
 * 解析文件签名预览 URL（两步流程）。
 *
 * <p>贯通审计 P1（2026-09-08）：后端下载端点仅暴露 POST
 * （{@code POST /api/nextwiki/download/{nodeId}}），而 {@code <img>}/<iframe> 只能
 * 发起 GET，直接拼下载路径会得到 405。统一改走签名 URL 流程：
 * 先 {@code POST /{nodeId}/signed-url} 换取带时效与 IP 绑定的 GET 签名链接，
 * 再由浏览器以 GET 拉取资源。
 *
 * @param nodeId 文件节点 ID
 * @returns 签名下载 URL（相对路径，含 expires 参数）
 */
async function resolveSignedPreviewUrl(nodeId: string): Promise<string> {
  return generateSignedUrl({ nodeId }, {});
}

/** 加载预览内容 */
async function loadPreviewContent(): Promise<void> {
  if (!props.fileNode) return;
  previewContent.value = '';
  previewUrl.value = '';

  if (isImage.value || isPdf.value) {
    // 图片 / PDF：浏览器以 GET 拉取资源，走签名 URL 两步流程
    try {
      previewUrl.value = await resolveSignedPreviewUrl(props.fileNode.id);
    } catch (error) {
      logger.warn('生成签名预览 URL 失败: {}', error);
      // 错误提示由请求拦截器统一处理；预览区保持空白由"不支持预览"兜底
    }
    return;
  }

  if (isText.value) {
    // 文本文件：签名 URL + 原生 fetch（响应为 octet-stream 附件流，
    // 不能走 requestClient 的 JSON 响应解包拦截器）
    try {
      const signedUrl = await resolveSignedPreviewUrl(props.fileNode.id);
      const resp = await fetch(signedUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${String(resp.status)}`);
      }
      previewContent.value = await resp.text();
    } catch (error) {
      logger.warn('加载文本预览内容失败: {}', error);
      previewContent.value = t('textLoadFailed');
    }
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
          <img :src="previewUrl" :alt="fileNode.name" class="max-h-[600px] max-w-full object-contain" loading="lazy" />
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
            :src="`/api/nextwiki/preview/${fileNode.id}`"
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
