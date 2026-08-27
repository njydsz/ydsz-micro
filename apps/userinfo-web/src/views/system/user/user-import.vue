<!--
 * 用户导入组件
 *
 * @path apps\userinfo-web\src\views\system\user\user-import.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 用户导入组件
 * <p>支持 Excel/CSV 文件导入用户，消费后端契约 UserAccountController#importUsers。
 * <p>支持导入结果展示（成功/失败数量、失败原因）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElMessage, ElProgress, ElUpload, type UploadRequestOptions } from 'element-plus';
import { ref } from 'vue';
import { importUsers } from '#/api/userAccount';
import type { UserImportResultDTO } from '#/api/models';

defineOptions({ name: 'UserImport' });

const emit = defineEmits<{ success: [] }>();

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
  },
  onConfirm: async () => {
    if (!selectedFile.value) {
      ElMessage.warning('请选择要导入的文件');
      return;
    }
    modalApi.lock();
    try {
      await performImport(selectedFile.value);
    } catch {
      // 错误提示由请求拦截器统一处理
    } finally {
      modalApi.unlock();
    }
  },
});

const selectedFile = ref<File | null>(null);
const importing = ref(false);
const importProgress = ref(0);
const importResult = ref<UserImportResultDTO | null>(null);

/** 重置状态 */
function resetState(): void {
  selectedFile.value = null;
  importing.value = false;
  importProgress.value = 0;
  importResult.value = null;
}

/** 处理文件选择 */
function handleFileChange(uploadFile: { raw?: File }): void {
  const file = uploadFile.raw;
  if (!file) return;
  selectedFile.value = file;
  importResult.value = null;
}

/** 执行导入 */
async function performImport(file: File): Promise<void> {
  importing.value = true;
  importProgress.value = 0;

  // 模拟进度
  const progressTimer = setInterval(() => {
    if (importProgress.value < 90) {
      importProgress.value += 10;
    }
  }, 200);

  try {
    const result = await importUsers({
      file: file as unknown as Record<string, unknown>,
    });
    importResult.value = result;
    importProgress.value = 100;
    ElMessage.success(`导入完成：成功 ${result.successCount ?? 0} 条，失败 ${result.failureCount ?? 0} 条`);
    emit('success');
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    clearInterval(progressTimer);
    importing.value = false;
  }
}

/** 关闭弹窗 */
function handleClose(): void {
  resetState();
  modalApi.close();
}
</script>

<template>
  <Modal title="导入用户">
    <div class="space-y-4">
      <!-- 上传区域 -->
      <ElUpload
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        accept=".xlsx,.xls,.csv"
        :on-change="handleFileChange"
        :on-exceed="() => ElMessage.warning('一次只能导入一个文件')"
        drag
      >
        <div class="py-6">
          <p class="text-sm text-gray-500">点击或拖拽 Excel/CSV 文件到此处</p>
          <p class="mt-1 text-xs text-gray-400">支持 .xlsx / .xls / .csv 格式</p>
        </div>
      </ElUpload>

      <!-- 导入进度 -->
      <div v-if="importing">
        <ElProgress :percentage="importProgress" :status="importProgress === 100 ? 'success' : ''" />
        <p class="mt-1 text-xs text-gray-500">正在导入中，请稍候...</p>
      </div>

      <!-- 导入结果 -->
      <div v-if="importResult" class="rounded border bg-gray-50 p-4">
        <h4 class="mb-2 text-sm font-medium">导入结果</h4>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-blue-600">{{ importResult.total ?? 0 }}</p>
            <p class="text-xs text-gray-500">总计</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600">{{ importResult.successCount ?? 0 }}</p>
            <p class="text-xs text-gray-500">成功</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ importResult.failureCount ?? 0 }}</p>
            <p class="text-xs text-gray-500">失败</p>
          </div>
        </div>
        <!-- 失败详情 -->
        <div v-if="importResult.details && importResult.details.length > 0" class="mt-3">
          <p class="mb-1 text-xs font-medium text-gray-600">失败详情：</p>
          <div class="max-h-32 overflow-auto rounded bg-white p-2">
            <p v-for="(detail, index) in importResult.details" :key="index" class="text-xs text-red-500">
              {{ detail.error || '导入失败' }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
      <ElButton type="primary" :loading="importing" :disabled="!selectedFile">导入</ElButton>
    </template>
  </Modal>
</template>
