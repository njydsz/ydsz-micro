<!--
 * WOPI 在线编辑器组件
 *
 * <p>基于 WOPI 协议实现在线文档编辑，支持 Office 文档的在线查看与编辑。
 *
 * @path apps/nextwiki-web/src/views/file/components/WopiEditor.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * WOPI 在线编辑器
 * <p>消费后端契约 WopiController（apps/nextwiki-web/src/api/wopi.ts）：
 * checkFileInfo() 获取文件信息，getFileContents() 获取文件内容，
 * putFileContents() 保存文件内容，lockFile() 锁定文件，unlockFile() 解锁文件。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElTag } from 'element-plus';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { checkFileInfo, lockFile, unlockFile } from '#/api/wopi';
import type { FileNodeVO } from '#/api/models';

interface Props {
  fileNode?: FileNodeVO | null;
}

const props = withDefaults(defineProps<Props>(), {
  fileNode: null,
});

const emit = defineEmits<{
  success: [];
  close: [];
}>();

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (isOpen) {
      openEditor();
    } else {
      handleUnlock();
    }
  },
});

/** iframe 引用 */
const iframeRef = ref<HTMLIFrameElement | null>(null);

/** 文件信息 */
const fileInfo = ref<Record<string, unknown>>({});

/** 编辑器 URL */
const editorUrl = ref('');

/** 加载状态 */
const loading = ref(false);

/** 是否已锁定 */
const isLocked = ref(false);

/** 支持在线编辑的文件类型 */
const SUPPORTED_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'];

/** 当前文件扩展名 */
const fileExtension = ref('');

/** 是否支持在线编辑 */
const isEditable = ref(false);

/** 打开编辑器 */
async function openEditor(): Promise<void> {
  if (!props.fileNode?.id) return;

  // 获取文件扩展名
  const name = props.fileNode.name ?? '';
  const lastDot = name.lastIndexOf('.');
  fileExtension.value = lastDot >= 0 ? name.substring(lastDot + 1).toLowerCase() : '';
  isEditable.value = SUPPORTED_EXTENSIONS.includes(fileExtension.value);

  loading.value = true;
  try {
    // 获取文件信息
    fileInfo.value = (await checkFileInfo({ fileId: props.fileNode.id })) as Record<string, unknown>;

    // 锁定文件
    try {
      await lockFile({ fileId: props.fileNode.id });
      isLocked.value = true;
    } catch {
      ElMessage.warning('文件可能已被其他用户锁定');
    }

    // 构建 WOPI 编辑器 URL
    // TODO: 根据实际 WOPI 服务地址配置
    const wopiHost = window.location.origin;
    editorUrl.value = `${wopiHost}/wopi/files/${props.fileNode.id}?access_token=token`;
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 解锁文件 */
async function handleUnlock(): Promise<void> {
  if (isLocked.value && props.fileNode?.id) {
    try {
      await unlockFile({ fileId: props.fileNode.id });
      isLocked.value = false;
    } catch {
      // 忽略解锁失败
    }
  }
}

/** 保存文件 */
function handleSave(): void {
  ElMessage.success('文档已自动保存');
  emit('success');
}

/** 关闭编辑器 */
function handleClose(): void {
  modalApi.close();
}

onMounted(() => {
  // 监听 iframe 消息
  window.addEventListener('message', handleIframeMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleIframeMessage);
  handleUnlock();
});

/** 处理 iframe 消息 */
function handleIframeMessage(event: MessageEvent): void {
  if (event.data === 'Document_Changed') {
    handleSave();
  }
}
</script>

<template>
  <Modal :title="`在线编辑 - ${props.fileNode?.name ?? ''}`" width="1200px">
    <div v-loading="loading" class="wopi-editor">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ElTag v-if="isEditable" type="success">可编辑</ElTag>
          <ElTag v-else type="info">只读预览</ElTag>
          <span class="text-sm text-gray-500">
            {{ fileInfo.AuthorCreatedDate ? `创建时间：${fileInfo.AuthorCreatedDate}` : '' }}
          </span>
          <span v-if="isLocked" class="text-sm text-green-600">🔒 已锁定编辑</span>
        </div>
        <div class="flex gap-2">
          <ElButton size="small" @click="handleClose">关闭</ElButton>
        </div>
      </div>

      <!-- WOPI iframe 容器 -->
      <div class="editor-container">
        <iframe
          v-if="editorUrl"
          ref="iframeRef"
          :src="editorUrl"
          class="wopi-iframe"
          frameborder="0"
          allowfullscreen
        />
        <div v-else class="editor-placeholder">
          <p class="text-gray-400">正在加载在线编辑器...</p>
          <p class="mt-2 text-xs text-gray-300">
            支持格式：{{ SUPPORTED_EXTENSIONS.join('、').toUpperCase() }}
          </p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.wopi-editor {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.editor-container {
  flex: 1;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  background: #f5f7fa;
}

.wopi-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.editor-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
