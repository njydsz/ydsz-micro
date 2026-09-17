<!--
 * Excel 导出按钮 — 声明式导出，绑定列定义与数据源即用
 *
 * 使用自研 YdButtonBase + lucide Download 图标，零 element-plus 依赖。
 *
 * @path comm\effects\shared-business\src\components\excel-export-button.vue
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
/**
 * Excel 导出按钮 — 声明式导出，绑定列定义与数据源即用
 */
import { Download } from 'lucide-vue-next';

import { YdButtonBase } from '@ydsz-core/ydsz-ui';

import {
  useExcelExport,
  type ExcelExportColumn,
} from '../composables/use-excel-export';

defineOptions({ name: 'YdExcelExportButton' });

interface Props<T = unknown> {
  /** 导出列定义 */
  columns: ExcelExportColumn<T>[];
  /** 导出数据 */
  data: T[];
  /** 文件名（不含扩展名） */
  fileName?: string;
  /** 按钮文字 */
  text?: string;
  /** 导出前回调（可返回 false 阻止导出） */
  beforeExport?: () => boolean | Promise<boolean>;
}

const props = withDefaults(defineProps<Props>(), {
  fileName: 'export',
  text: '导出',
  beforeExport: undefined,
});

const { exportExcel } = useExcelExport();

async function handleClick(): Promise<void> {
  if (props.beforeExport) {
    const canProceed = await props.beforeExport();
    if (!canProceed) return;
  }
  exportExcel({
    fileName: props.fileName,
    columns: props.columns,
    data: props.data,
  });
}
</script>

<template>
  <YdButtonBase
    size="sm"
    variant="default"
    @click="handleClick"
  >
    <Download :size="14" class="mr-1" />
    {{ text }}
  </YdButtonBase>
</template>
