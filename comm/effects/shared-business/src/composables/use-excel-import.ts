/**
 * use-excel-import 组合式函数 — 统一 Excel 导入
 *
 * @path comm\effects\shared-business\src\composables\use-excel-import.ts
 * @author ydsz-team
 * @since 1.2.0
 *
 * @remarks
 * 基于 SheetJS(xlsx) 解析 .xlsx / .xls / .csv 文件，统一能力：
 * - `selectFile`：隐藏 input[type=file] 触发文件选择，返回 Promise<File>
 * - `parseWorkbook`：按列 schema 将 Sheet 行映射为结构化数据
 * - 行级校验（必填 / 自定义 validator）+ 行级错误收集
 * - 行数上限检查（maxRows）
 * - 响应式状态：importing / progress / result / error
 * - 大文件场景使用 Web Worker（> 5000 行自动启用）
 * - 内置 i18n 错误码支持
 */

import { ref } from 'vue';

import { useI18n } from 'vue-i18n';

/** xlsx 库待安装时保留 import 路径，编译即运行时报错提醒 */
import * as XLSX from 'xlsx';

// ============================================================
// 类型定义
// ============================================================

/** 重新导出 ExcelColumn，保证导入侧与导出侧使用同一类型 */
export type { ExcelColumn } from './use-excel-export';

/**
 * 导入行错误描述
 *
 * @since 1.2.0
 */
export interface ImportError {
  /** Excel 行号（从 1 开始，含表头则表头为第 1 行） */
  row: number;
  /** 出错字段名（对应 ExcelColumn.key 或 label） */
  field: string;
  /** 错误描述（可直接展示给用户） */
  message: string;
}

/**
 * Excel 导入结果
 *
 * @typeParam T - 映射后的数据行类型
 * @since 1.2.0
 */
export interface ExcelImportResult<T = unknown> {
  /** 解析成功并校验通过的数据行 */
  data: T[];
  /** 总行数（不含表头） */
  total: number;
  /** 校验失败的错误列表 */
  errors: ImportError[];
}

/**
 * 导入配置项
 *
 * @typeParam T - 映射后的数据行类型
 * @since 1.2.0
 */
export interface ExcelImportOptions<T = unknown> {
  /** 列定义（与导出侧共用 ExcelColumn，label 作为表头匹配依据） */
  columns: ExcelColumn[];
  /** 自定义行校验函数：返回错误消息字符串，undefined 表示通过 */
  validator?: (row: T, index: number) => string | undefined;
  /** 最大允许行数（超出抛错），默认不限制 */
  maxRows?: number;
  /** 是否强制使用 Worker（默认按行数自动决策：> 5000 行启用） */
  useWorker?: boolean;
  /** 自定义 Worker 路径（默认使用内置 worker） */
  workerPath?: string;
}

// ============================================================
// 常量
// /** 启用 Worker 的行数阈值 */
const WORKER_THRESHOLD = 5000;

// ============================================================
// composable
// ============================================================

/**
 * 统一 Excel 导入 composable
 *
 * 封装文件选择、SheetJS 解析、行级校验、Worker 解析与响应式状态管理。
 *
 * @typeParam T - 映射后的数据行类型
 * @returns 导入工具方法与响应式状态
 * @returns selectFile - 弹出文件选择框并返回 Promise<File>
 * @returns parseWorkbook - 解析 File 为 ExcelImportResult
 * @returns importing - 导入进行中
 * @returns progress - 当前进度（0-100）
 * @returns result - 最近一次解析结果
 * @returns error - 最近一次导入错误
 * @returns reset - 清空 result / error / progress
 *
 * @example
 * ```ts
 * const { selectFile, parseWorkbook, importing, result, error } = useExcelImport<ProjectItem>();
 *
 * async function handleImport() {
 *   const file = await selectFile();
 *   const res = await parseWorkbook(file, {
 *     columns: [
 *       { key: 'name', label: '项目名称' },
 *       { key: 'amount', label: '金额', dataType: 'number' },
 *     ],
 *     validator: (row, idx) => !row.name ? `第 ${idx} 行项目名称为空` : undefined,
 *   });
 *   if (res.errors.length > 0) {
 *     ElMessage.warning(`${res.errors.length} 行校验失败`);
 *   }
 *   importData(res.data);
 * }
 * ```
 *
 * @since 1.2.0
 */
export function useExcelImport<T = unknown>() {
  const { t } = useI18n();

  /** 导入进行中 */
  const importing = ref(false);
  /** 当前导入进度（0-100） */
  const progress = ref(0);
  /** 最近一次解析结果 */
  const result = ref<ExcelImportResult<T> | null>(null);
  /** 最近一次导入错误 */
  const error = ref<Error | null>(null);

  /**
   * 弹出文件选择框
   *
   * 动态创建并触发隐藏 `<input type="file">`，选择后自动清理 DOM。
   *
   * @param accept - 允许的文件扩展名，默认 '.xlsx,.xls,.csv'
   * @returns 用户选中的 File 对象
   *
   * @example
   * ```ts
   * const file = await selectFile('.xlsx,.xls');
   * const workbook = await parseWorkbook(file, { columns });
   * ```
   */
  function selectFile(accept = '.xlsx,.xls,.csv'): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.style.display = 'none';

      function cleanup() {
        input.remove();
        window.removeEventListener('focus', onFocus);
      }

      function onFocus() {
        // 用户取消选择时 input.value 为空，通过 focus 事件延时判定
        setTimeout(() => {
          if (!input.value) {
            cleanup();
            reject(new Error(t('excel.importCancelled')));
          }
        }, 300);
      }

      input.addEventListener('change', () => {
        const file = input.files?.[0];
        cleanup();
        if (!file) {
          reject(new Error(t('excel.importCancelled')));
          return;
        }
        resolve(file);
      });

      window.addEventListener('focus', onFocus);
      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * 主线程解析 workbook（小文件场景）
   *
   * @param arrayBuffer - 已读取的文件二进制内容
   * @param options - 导入配置项
   * @returns 解析结果
   */
  function parseInMainThread(
    arrayBuffer: ArrayBuffer,
    options: ExcelImportOptions<T>,
  ): ExcelImportResult<T> {
    const { columns, validator, maxRows } = options;

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error(t('excel.emptyWorkbook'));
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });

    if (maxRows != null && rawRows.length > maxRows) {
      throw new Error(t('excel.exceedMaxRows', { max: String(maxRows) }));
    }

    const data: T[] = [];
    const errors: ImportError[] = [];

    rawRows.forEach((rawRow, idx) => {
      // Excel 行号：表头占 1 行，数据从第 2 行开始
      const rowNum = idx + 2;
      const mapped: Record<string, unknown> = {};

      for (const col of columns) {
        // 优先以 label 匹配表头，回退到 key
        const rawVal = rawRow[col.label] ?? rawRow[col.key] ?? '';
        mapped[col.key] = rawVal;
      }

      // 空值校验（空字符串视为空）
      let hasEmpty = false;
      for (const col of columns) {
        const val = mapped[col.key];
        if (val === '' || val == null) {
          errors.push({
            row: rowNum,
            field: col.key,
            message: t('excel.fieldRequired', { field: col.label }),
          });
          hasEmpty = true;
          break;
        }
      }
      if (hasEmpty) return;

      const mappedRow = mapped as T;

      const customError = validator?.(mappedRow, rowNum);
      if (customError) {
        errors.push({
          row: rowNum,
          field: '__custom__',
          message: customError,
        });
        return;
      }

      data.push(mappedRow);
    });

    return { data, total: rawRows.length, errors };
  }

  /**
   * 通过 Worker 解析 workbook（大文件场景）
   *
   * @param arrayBuffer - 已读取的文件二进制内容
   * @param options - 导入配置项
   * @returns 解析结果
   */
  function parseWithWorker(
    arrayBuffer: ArrayBuffer,
    options: ExcelImportOptions<T>,
  ): Promise<ExcelImportResult<T>> {
    const { workerPath, validator, maxRows } = options;

    return new Promise<ExcelImportResult<T>>((resolveResult, rejectResult) => {
      let worker: Worker;
      try {
        const workerUrl = workerPath ?? new URL('./workers/excel-import.worker.ts', import.meta.url).href;
        worker = new Worker(workerUrl, { type: 'module' });
      } catch (err) {
        rejectResult(err instanceof Error ? err : new Error(String(err)));
        return;
      }

      worker.onmessage = (event: MessageEvent) => {
        const data = event.data as {
          type: string;
          progress?: number;
          result?: ExcelImportResult<T>;
          error?: string;
        };
        if (data.type === 'progress' && data.progress != null) {
          progress.value = data.progress;
        } else if (data.type === 'done' && data.result != null) {
          // Worker 无法传 validator，主线程补充校验
          validateAndFinalize(data.result, validator, maxRows)
            .then(resolveResult)
            .catch(rejectResult)
            .finally(() => worker.terminate());
        } else if (data.type === 'error') {
          worker.terminate();
          rejectResult(new Error(data.error ?? t('excel.parseFailed')));
        }
      };

      worker.onerror = (event) => {
        worker.terminate();
        rejectResult(new Error(event.message || t('excel.parseFailed')));
      };

      worker.postMessage(
        { type: 'parse', payload: { arrayBuffer, columns: options.columns } },
        [arrayBuffer],
      );
    });
  }

  /**
   * 主线程补充 Worker 返回结果的校验
   *
   * @param raw - Worker 返回的初步解析结果
   * @param validator - 行校验器
   * @param maxRows - 行数上限
   * @returns 完整导入结果
   */
  async function validateAndFinalize(
    raw: ExcelImportResult<T>,
    validator: ExcelImportOptions<T>['validator'],
    maxRows: ExcelImportOptions<T>['maxRows'],
  ): Promise<ExcelImportResult<T>> {
    if (maxRows != null && raw.total > maxRows) {
      throw new Error(t('excel.exceedMaxRows', { max: String(maxRows) }));
    }
    if (!validator) return raw;

    const data: T[] = [];
    const errors: ImportError[] = [...raw.errors];

    for (const row of raw.data) {
      const customError = validator(row, 0);
      if (customError) {
        errors.push({ row: 0, field: '__custom__', message: customError });
        continue;
      }
      data.push(row);
    }
    return { data, total: raw.total, errors };
  }

  /**
   * 解析 Excel File 为结构化数据
   *
   * 内部自动决策是否启用 Web Worker（> 5000 行启用）。
   *
   * @param file - 要解析的 File 对象（由 selectFile 获取或用户直接传入）
   * @param options - 导入配置项
   * @returns 解析结果（解析通过的行 / 总行数 / 错误明细）
   *
   * @example
   * ```ts
   * const file = await selectFile();
   * const res = await parseWorkbook(file, {
   *   columns: [{ key: 'name', label: '项目名称' }],
   *   validator: (row, idx) => !row.name ? `第 ${idx} 行项目名称为空` : undefined,
   *   maxRows: 10000,
   * });
   * ```
   */
  async function parseWorkbook(
    file: File,
    options: ExcelImportOptions<T>,
  ): Promise<ExcelImportResult<T>> {
    error.value = null;
    importing.value = true;
    progress.value = 0;
    result.value = null;

    try {
      const arrayBuffer = await readerAsBuffer(file);
      // 解析首 sheet 行数以决策是否启用 Worker
      const rowCount = peekRowCount(arrayBuffer);
      const shouldUseWorker = options.useWorker ?? (rowCount > WORKER_THRESHOLD);

      const parsed = shouldUseWorker
        ? await parseWithWorker(arrayBuffer, options)
        : parseInMainThread(arrayBuffer, options);

      progress.value = 100;
      result.value = parsed;
      return parsed;
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      error.value = wrapped;
      throw wrapped;
    } finally {
      importing.value = false;
    }
  }

  /**
   * 重置响应式状态
   */
  function reset() {
    importing.value = false;
    progress.value = 0;
    result.value = null;
    error.value = null;
  }

  return {
    error,
    importing,
    parseWorkbook,
    progress,
    reset,
    result,
    selectFile,
  };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 将 File 读取为 ArrayBuffer
 *
 * @param file - 目标文件
 * @returns ArrayBuffer
 */
function readerAsBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result;
      if (buf instanceof ArrayBuffer) {
        resolve(buf);
      } else {
        reject(new Error('Unsupported file buffer type'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 预读 workbook 行数（以 ArrayBuffer 入参，避免重复读取文件）
 *
 * @param arrayBuffer - 文件 ArrayBuffer
 * @returns 数据行数（不含表头）
 */
function peekRowCount(arrayBuffer: ArrayBuffer): number {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return 0;
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    return rows.length;
  } catch {
    return 0;
  }
}
