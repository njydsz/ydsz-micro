<!--
 * 文件上传组件（支持分片上传）
 *
 * @path apps\nextwiki-web\src\views\file\file-upload.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件上传组件
 * <p>支持普通上传和分片上传（大文件自动切换），消费后端契约 FileChunkController（initChunkUpload/uploadChunk/completeChunkUpload）。
 * <p>分片阈值：100MB，分片大小：5MB。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage, ElProgress, ElUpload } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { initChunkUpload, uploadChunk, completeChunkUpload, abortChunkUpload, getUploadedChunks } from '#/api/fileChunk';
import { upload } from '#/api/file';
import type { FileNodeVO } from '#/api/models';

defineOptions({ name: 'FileUpload' });

const emit = defineEmits<{ success: [file: FileNodeVO] }>();

/** 分片上传阈值：100MB */
const CHUNK_THRESHOLD = 100 * 1024 * 1024;
/** 分片大小：5MB */
const CHUNK_SIZE = 5 * 1024 * 1024;

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { parentId: '', versionRemark: '' });
    resetUploadState();
  },
  onConfirm: async () => {
    if (!selectedFile.value) {
      ElMessage.warning('请选择要上传的文件');
      return;
    }
    modalApi.lock();
    try {
      const result = await performUpload(selectedFile.value);
      ElMessage.success('上传成功');
      emit('success', result);
      modalApi.close();
    } catch {
      // 错误提示由请求拦截器统一处理
    } finally {
      modalApi.unlock();
    }
  },
});

interface UploadFormData {
  parentId: string;
  versionRemark: string;
}

const formData = reactive<UploadFormData>({
  parentId: '',
  versionRemark: '',
});

const formRef = ref();
const rules = {
  versionRemark: [{ max: 200, message: '版本备注不超过200字符', trigger: 'blur' }],
};

const selectedFile = ref<File | null>(null);
const uploadProgress = ref(0);
const uploadStatus = ref<'idle' | 'uploading' | 'success' | 'error'>('idle');
const uploadSpeed = ref('');
let currentUploadId = '';

/** 是否使用分片上传 */
const useChunkUpload = computed(() => (selectedFile.value?.size ?? 0) >= CHUNK_THRESHOLD);

/** 格式化上传速度 */
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

/** 重置上传状态 */
function resetUploadState(): void {
  selectedFile.value = null;
  uploadProgress.value = 0;
  uploadStatus.value = 'idle';
  uploadSpeed.value = '';
  currentUploadId = '';
}

/** 处理文件选择 */
function handleFileChange(uploadFile: { raw?: File }): void {
  const file = uploadFile.raw;
  if (!file) return;
  selectedFile.value = file;
  uploadStatus.value = 'idle';
  uploadProgress.value = 0;
}

/** 执行上传 */
async function performUpload(file: File): Promise<FileNodeVO> {
  if (useChunkUpload.value) {
    return performChunkUpload(file);
  }
  return performNormalUpload(file);
}

/** 普通上传 */
async function performNormalUpload(file: File): Promise<FileNodeVO> {
  uploadStatus.value = 'uploading';
  const result = await upload({
    file: file as unknown as Record<string, unknown>,
    parentId: formData.parentId || undefined,
    versionRemark: formData.versionRemark || undefined,
  });
  uploadStatus.value = 'success';
  uploadProgress.value = 100;
  return result;
}

/** 分片上传 */
async function performChunkUpload(file: File): Promise<FileNodeVO> {
  uploadStatus.value = 'uploading';
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // 1. 初始化分片上传
  const initResult = await initChunkUpload({
    fileName: file.name,
    fileSize: file.size,
    totalChunks,
    parentId: formData.parentId || undefined,
  });

  // 从初始化结果获取 uploadId
  currentUploadId = (initResult as Record<string, unknown>)?.uploadId as string;
  if (!currentUploadId) {
    throw new Error('初始化分片上传失败');
  }

  // 2. 查询已上传的分片（断点续传）
  let uploadedChunks: number[] = [];
  try {
    uploadedChunks = await getUploadedChunks({ uploadId: currentUploadId });
  } catch {
    uploadedChunks = [];
  }

  // 3. 逐片上传
  const startTime = Date.now();
  let uploadedBytes = uploadedChunks.length * CHUNK_SIZE;

  for (let i = 0; i < totalChunks; i++) {
    if (uploadedChunks.includes(i)) continue;

    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    await uploadChunk(
      { uploadId: currentUploadId, chunkNumber: i },
      { chunk: chunk as unknown as Record<string, unknown> },
    );

    uploadedBytes += chunk.size;
    uploadProgress.value = Math.round((uploadedBytes / file.size) * 100);

    // 计算上传速度
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > 0) {
      uploadSpeed.value = formatSpeed(uploadedBytes / elapsed);
    }
  }

  // 4. 完成分片上传
  const result = await completeChunkUpload({ uploadId: currentUploadId });
  uploadStatus.value = 'success';
  uploadProgress.value = 100;
  return result;
}

/** 取消上传 */
async function handleCancel(): Promise<void> {
  if (currentUploadId && useChunkUpload.value) {
    try {
      await abortChunkUpload({ uploadId: currentUploadId });
    } catch {
      // 忽略取消时的错误
    }
  }
  resetUploadState();
}
</script>

<template>
  <Modal title="上传文件">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="父目录ID" prop="parentId">
        <ElInput v-model="formData.parentId" placeholder="请输入父目录ID（留空表示根目录）" />
      </ElFormItem>
      <ElFormItem label="版本备注" prop="versionRemark">
        <ElInput v-model="formData.versionRemark" placeholder="请输入版本备注（选填）" type="textarea" :rows="2" />
      </ElFormItem>
      <ElFormItem label="选择文件">
        <ElUpload
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          :on-change="handleFileChange"
          :on-exceed="() => ElMessage.warning('一次只能上传一个文件')"
          drag
        >
          <div class="py-6">
            <p class="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
            <p class="mt-1 text-xs text-gray-400">
              文件大小 ≥ 100MB 时自动使用分片上传（支持断点续传）
            </p>
          </div>
        </ElUpload>
      </ElFormItem>
      <ElFormItem v-if="selectedFile" label="文件信息">
        <div class="text-sm text-gray-600">
          <p>名称：{{ selectedFile.name }}</p>
          <p>大小：{{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB</p>
          <p>类型：{{ selectedFile.type || '未知' }}</p>
          <p v-if="useChunkUpload" class="text-orange-500">将使用分片上传</p>
        </div>
      </ElFormItem>
      <ElFormItem v-if="uploadStatus === 'uploading'" label="上传进度">
        <div>
          <ElProgress :percentage="uploadProgress" :status="uploadProgress === 100 ? 'success' : ''" />
          <p v-if="uploadSpeed" class="mt-1 text-xs text-gray-500">{{ uploadSpeed }}</p>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="uploadStatus === 'uploading'">上传</ElButton>
    </template>
  </Modal>
</template>
