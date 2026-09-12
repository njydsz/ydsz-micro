/**
 * use-excel-export 组合式函数 — 统一 Excel 导出
 *
 * @path comm\effects\shared-business\src\composables\use-excel-export.ts
 * @author ydsz-team
 * @since 1.2.0
 *
 * @remarks
 * 基于 SheetJS(xlsx) 实现的客户端 Excel 导出，特性：
 * - 统一的列 schema（key/label/width/formatter/dataType）
 * - 大数据量（> 5000 行）自动切分并使用 Web Worker 生成，避免阻塞主线程
 * - 导出进度通过 ElNotification 提示（大文件场景）
 * - 内置 i18n 错误码支持
 *
 * 超过 10 万行的大批量数据由调用方决定是否使用 Worker，后端导出是更优方案。
 */

import { ref } from 'vue';

import { ElNotification } from 'element-plus';
import { useI18n } from 'vue-i18n';

/** xlsx 库待安装时保留 import 路径，编译即运行时报错提醒 */
import * as XLSX from 'xlsx';

// ============================================================
// 类型定义
// ============================================================

/**
 * Excel 列数据类型枚举
 *
 * @since 1.2.0
 */
export type ExcelColumnDataType = 'string' | 'number' | 'date';

/**
 * Excel 列定义
 *
 * 同时用于导出 schema 与导入列映射，一处定义两端复用。
 *
 * @since 1.2.0
 */
export interface ExcelColumn {
  /** 数据字段 key（对应数据行的属性名） */
  key: string;
  /** 列标题（Excel 表头文字） */
  label: string;
  /** 列宽（字符数），默认 12 */
  width?: number;
  /** 自定义取值/格式化函数，接收原始值返回单元格展示值 */
  formatter?: (value: unknown, row: unknown) => string | number;
  /** 列数据类型（影响单元格格式），默认 'string' */
  dataType?: ExcelColumnDataType;
}

/**
 * 导出函数入参
 *
 * @since 1.2.0
 */
export interface ExcelExportParams {
  /** 列定义 */
  columns: ExcelColumn[];
  /** 要导出的数据行 */
  data: unknown[];
  /** 文件名（不含扩展名） */
  filename: string;
  /** sheet 名称，默认 'Sheet1' */
  sheetName?: string;
  /** 是否强制使用 Worker（默认按行数自动决策：> 5000 行启用） */
  useWorker?: boolean;
  /** 自定义 Worker 路径（默认使用内置 worker） */
  workerPath?: string;
}

/**
 * 导出进度回调（0-100）
 *
 * @since 1.2.0
 */
export type ExcelExportProgressCallback = (progress: number) => void;

/**
 * 导出完成回调
 *
 * @since 1.2.0
 */
export type ExcelExportCompleteCallback = () => void;

/**
 * 导出失败回调
 *
 * @since 1.2.0
 */
export type ExcelExportErrorCallback = (error: Error) => void;

/**
 * 导出完整配置（schema + params + callbacks）
 *
 * @since 1.2.0
 */
export interface ExcelExportOptions extends ExcelExportParams {
  /** 导出进度回调（0-100），仅在 Worker 模式下有效 */
  onProgress?: ExcelExportProgressCallback;
  /** 导出完成回调 */
  onComplete?: ExcelExportCompleteCallback;
  /** 导出失败回调 */
  onError?: ExcelExportErrorCallback;
}

// ============================================================
// 常量
// /** 默认列宽（字符数） */
const DEFAULT_COL_WIDTH = 12;

/** 启用 Worker 的行数阈值 */
const WORKER_THRESHOLD = 5000;

// ============================================================
// composable
// ============================================================

/**
 * 统一 Excel 导出 composable
 *
 * 封装 SheetJS 生成、分片、Worker、进度事件与 ElNotification 提示。
 *
 * @returns 导出工具方法与响应式状态
 * @returns exportExcel - 执行导出
 * @returns exporting - 导出进行中
 * @returns progress - 当前进度（0-100）
 * @returns error - 最近一次导出错误
 *
 * @example
 * ```ts
 * const { exportExcel, exporting, progress, error } = useExcelExport();
 *
 * await exportExcel({
 *   filename: '项目列表',
 *   sheetName: '项目数据',
 *   columns: [
 *     { key: 'name', label: '项目名称', width: 20 },
 *     { key: 'amount', label: '金额', dataType: 'number' },
 *   ],
 *   data: rows,
 *   onProgress: (p) => console.log(`${p}%`),
 * });
 * ```
 *
 * @since 1.2.0
 */
export function useExcelExport() {
  const { t } = useI18n();

  /** 导出进行中 */
  const exporting = ref(false);
  /** 当前导出进度（0-100） */
  const progress = ref(0);
  /** 最近一次导出错误 */
  const error = ref<Error | null>(null);

  /** ElNotification 实例引用，用于手动关闭 */
  const notificationRef = ref<ReturnType<typeof ElNotification> | null>(null);

  /**
   * 根据 dataType 转换单元格值
   *
   * @param value - 原始值
   * @param dataType - 目标数据类型
   * @returns 转换后的值
   */
  function coerceValue(value: unknown, dataType: ExcelColumnDataType | undefined): string | number {
    if (value == null) return '';
    switch (dataType) {
      case 'number': {
        const num = Number(value);
        return Number.isNaN(num) ? String(value) : num;
      }
      case 'date': {
        return value instanceof Date ? value.toISOString() : String(value);
      }
      default:
        return String(value);
    }
  }

  /**
   * 生成 worksheet 所用的 aoa 数据（含表头行）
   *
   * @param params - 导出参数
   * @returns 二维数组，第一行为表头
   */
  function buildAoa(params: ExcelExportParams): unknown[][] {
    const { columns, data } = params;
    const header = columns.map((col) => col.label);
    const rows = data.map((row) =>
      columns.map((col) => {
        const raw = (row as Record<string, unknown>)?.[col.key];
        if (col.formatter) {
          return col.formatter(raw, row);
        }
        return coerceValue(raw, col.dataType);
      }),
    );
    return [header, ...rows];
  }

  /**
   * 默认的主线程导出（小文件场景）
   *
   * @param params - 导出参数
   */
  function exportInMainThread(params: ExcelExportParams): void {
    const { filename, sheetName = 'Sheet1', columns } = params;
    const aoa = buildAoa(params);

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!cols'] = columns.map((col) => ({
      wch: (col.width ?? DEFAULT_COL_WIDTH),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  /**
   * 通过 Worker 导出（大文件场景）
   *
   * @param options - 完整导出配置
   */
  function exportWithWorker(options: ExcelExportOptions): Promise<void> {
    const {
      onProgress,
      onComplete,
      onError,
      workerPath,
      ...params
    } = options;

    return new Promise<void>((resolve, reject) => {
      let worker: Worker;
      try {
        const workerUrl = workerPath ?? new URL('./workers/excel-export.worker.ts', import.meta.url).href;
        worker = new Worker(workerUrl, { type: 'module' });
      } catch (err) {
        const fallbackErr = err instanceof Error ? err : new Error(String(err));
        reject(fallbackErr);
        return;
      }

      worker.onmessage = (event: MessageEvent) => {
        const data = event.data as { type: string; progress?: number; result?: Blob; error?: string };
        if (data.type === 'progress' && data.progress != null) {
          progress.value = data.progress;
          onProgress?.(data.progress);
        } else if (data.type === 'done' && data.result != null) {
          const url = URL.createObjectURL(data.result);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${params.filename}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
          worker.terminate();
          onComplete?.();
          resolve();
        } else if (data.type === 'error') {
          const err = new Error(data.error ?? t('excel.exportFailed'));
          worker.terminate();
          onError?.(err);
          reject(err);
        }
      };

      worker.onerror = (event) => {
        const err = new Error(event.message || t('excel.exportFailed'));
        worker.terminate();
        onError?.(err);
        reject(err);
      };

      worker.postMessage({
        type: 'export',
        payload: {
          columns: params.columns,
          data: params.data,
          filename: params.filename,
          sheetName: params.sheetName ?? 'Sheet1',
        },
      });
    });
  }

  /**
   * 执行 Excel 导出
   *
   * 根据数据量自动决策是否启用 Web Worker：
   * - <= 5000 行：主线程同步导出
   * - > 5000 行：异步 Worker 导出（可通过 `useWorker` 参数覆盖）
   *
   * 大文件导出期间会显示 ElNotification 进度提示，完成或失败时自动关闭。
   *
   * @param options - 导出完整配置（schema + params + callbacks）
   *
   * @example
   * ```ts
   * const { exportExcel } = useExcelExport();
   * await exportExcel({
   *   filename: '项目列表',
   *   columns: [{ key: 'name', label: '名称', width: 20 }],
   *   data: rows,
   * });
   * ```
   */
  async function exportExcel(options: ExcelExportOptions): Promise<void> {
    error.value = null;
    exporting.value = true;
    progress.value = 0;

    const { useWorker, data } = options;
    const shouldUseWorker = useWorker ?? (data.length > WORKER_THRESHOLD);

    // 大文件场景显示通知
    if (shouldUseWorker) {
      notificationRef.value = ElNotification({
        title: t('excel.exporting'),
        message: `${t('excel.preparing')}…`,
        type: 'info',
        duration: 0,
        position: 'bottom-right',
      });
    }

    try {
      if (shouldUseWorker) {
        await exportWithWorker({
          ...options,
          onProgress: (p) => {
            progress.value = p;
            options.onProgress?.(p);
            notificationRef.value?.update({
              message: `${t('excel.exporting')}… ${p}%`,
            });
          },
          onComplete: () => {
            options.onComplete?.();
            notificationRef.value?.close();
            notificationRef.value = null;
          },
          onError: (err) => {
            options.onError?.(err);
            notificationRef.value?.close();
            notificationRef.value = null;
            ElNotification.error({
              title: t('excel.exportFailed'),
              message: err.message,
            });
          },
        });
      } else {
        exportInMainThread(options);
        progress.value = 100;
        options.onProgress?.(100);
        options.onComplete?.();
      }
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      error.value = wrapped;
      options.onError?.(wrapped);
      throw wrapped;
    } finally {
      exporting.value = false;
    }
  }

  return {
    error,
    exportExcel,
    exporting,
    progress,
  };
}

// 向后兼容类型别名（v1.1.0 旧接口迁移辅助）
/** @deprecated 请改用 {@link ExcelColumn} */
export type ExcelExportColumn = ExcelColumn;
