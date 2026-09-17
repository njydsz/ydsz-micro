<!--
 * Excel 导入按钮 — 隐藏 file input + 解析回调
 *
 * 使用自研 YdButtonBase + lucide YdUpload 图标，零 element-plus 依赖。
 * 提示信息使用 @ydsz/notification 的 showToast（全局轻提示）。
 *
 * @path comm\effects\shared-business\src\components\excel-import-button.vue
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
/**
 * Excel 导入按钮 — 隐藏 file input + 解析回调
 */
import { ref } from 'vue';

import { YdUpload } from 'lucide-vue-next';

import { showToast } from '@ydsz/notification';
import { YdButtonBase } from '@ydsz-core/ydsz-ui';

import { createLogger } from '@ydsz-core/shared/utils';
import {
  useExcelImport,
  type ExcelImportColumn,
  type ExcelImportResult,
} from '../composables/use-excel-import';

defineOptions({ name: 'YdExcelImportButton' });

const logger = createLogger('excel-import-button');

interface Props<T = Record<string, unknown>> {
  /** 列映射配置 */
  columns: ExcelImportColumn[];
  /** 解析成功回调 */
  onSuccess: (result: ExcelImportResult<T>) => void | Promise<void>;
  /** 支持的文件类型 */
  accept?: string;
  /** 按钮文字 */
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.xlsx,.xls,.csv',
  text: '导入',
});

const inputRef = ref<HTMLInputElement>();
const loading = ref(false);

const { parseExcel } = useExcelImport();

function handleChoose(): void {
  inputRef.value?.click();
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  loading.value = true;
  try {
    const result = await parseExcel(file, { columns: props.columns });
    if (result.errors.length > 0) {
      showToast.warning(
        `共 ${result.total} 行，${result.errors.length} 行有误：${result.errors[0].message}`,
      );
    }
    await props.onSuccess(result);
  } catch (error) {
    showToast.error('文件解析失败，请检查格式');
    logger.error('[excel-import]', error);
  } finally {
    loading.value = false;
    // 重置 input 以便再次选择相同文件
    input.value = '';
  }
}
</script>

<template>
  <YdButtonBase
    :disabled="loading"
    size="sm"
    variant="outline"
    @click="handleChoose"
  >
    <YdUpload :size="14" class="mr-1" />
    {{ text }}
  </YdButtonBase>
  <input
    ref="inputRef"
    type="file"
    class="excel-import-input"
    :accept="accept"
    @change="handleFileChange"
  >
</template>

<style scoped>
.excel-import-input {
  display: none;
}
</style>
