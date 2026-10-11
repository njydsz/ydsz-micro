/**
 * QRCode 工具函数：纠错级别定义与伪矩阵生成。
 *
 * 本模块提供快速的 QR 视觉模式生成，采用确定性哈希算法构造 NxN 的二值矩阵，
 * 用于 Canvas 绘制与 API 规范化演示。注意：这不是符合 ISO/IEC 18004 的真实
 * QR 编码算法，如需生产级别解码请使用专业库。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\qr-code\qr-code-utils.ts
 * @author ydsz-ai
 * @since 1.0.0
 */

export type QRLevel = 'L' | 'M' | 'Q' | 'H';

/** 纠错级别对应的矩阵基础尺寸扩展系数（级别越高二维码越大） */
const LEVEL_EXPANSION: Record<QRLevel, number> = {
  L: 0,
  M: 2,
  Q: 4,
  H: 6,
};

/** 最小矩阵阶数 */
const MIN_MODULE_COUNT = 21;

/** 最大矩阵阶数 */
const MAX_MODULE_COUNT = 41;

/**
 * 将输入字符串转为确定性 32 位整数哈希。
 *
 * 使用 djb2 算法，确保同样的 value 在每次调用时得到相同的模式。
 */
export function hashStringToInt(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    // hash * 33 + charCode
    hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * 根据数据长度与纠错级别生成简化版 QR 矩阵。
 *
 * 矩阵阶数（NxN）由 value 长度和 level 共同决定。
 * 图案中会嵌入三个位于角落的定位角（finder pattern）以模拟 QR 外观。
 *
 * @param value - 编码数据文本
 * @param level - 纠错级别，影响矩阵倍率
 * @returns NxN 的布尔矩阵，true 表示前景色方格
 */
export function generateQRMatrix(value: string, level: QRLevel): boolean[][] {
  const text = value || '';
  const expansion = LEVEL_EXPANSION[level];
  const dataLengthFactor = Math.ceil(text.length / 16);
  let n = MIN_MODULE_COUNT + expansion + dataLengthFactor;
  // 确保是奇数（QR 码标准模式以奇数阶为主）
  if (n % 2 === 0) {
    n += 1;
  }
  if (n > MAX_MODULE_COUNT) {
    n = MAX_MODULE_COUNT;
  }

  // 初始化全为 false（背景）
  const matrix: boolean[][] = [];
  for (let row = 0; row < n; row++) {
    matrix[row] = new Array<boolean>(n).fill(false);
  }

  // 使用哈希作为确定性随机种子
  const seed = hashStringToInt(text || 'empty');

  // 填充随机数据区（避开 finder pattern 区域）
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      // 跳过三个 finder pattern 区域
      if (isFinderPattern(row, col, n)) {
        continue;
      }
      // 基于 LCG 的伪随机填充
      const pseudoRandom = pseudoRandomBool(seed, row * n + col);
      matrix[row]![col] = pseudoRandom;
    }
  }

  // 绘制三个 finder pattern（7x7 的正方形 + 白色内框）
  drawFinderPattern(matrix, 0, 0);
  drawFinderPattern(matrix, 0, n - 7);
  drawFinderPattern(matrix, n - 7, 0);

  return matrix;
}

/** 判断坐标是否在三个 finder pattern 区域（含 1 像素隔离带） */
function isFinderPattern(row: number, col: number, n: number): boolean {
  const size = 8; // 7 + 1 隔离带
  // 左上
  if (row < size && col < size) {
    return true;
  }
  // 右上
  if (row < size && col >= n - 7) {
    return true;
  }
  // 左下
  if (row >= n - 7 && col < size) {
    return true;
  }
  return false;
}

/**
 * 在矩阵的指定位置（左上角坐标）绘制 7x7 finder pattern。
 *
 * 图案：外框 7x7 黑色，内框 5x5 白色，中心 3x3 黑色。
 */
function drawFinderPattern(matrix: boolean[][], startRow: number, startCol: number): void {
  for (let dr = 0; dr < 7; dr++) {
    for (let dc = 0; dc < 7; dc++) {
      const row = startRow + dr;
      const col = startCol + dc;
      // 外框
      const isOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      // 内框（不绘制，在白底上）
      const isInner = dr === 1 || dr === 5 || dc === 1 || dc === 5;
      if (isOuter) {
        matrix[row]![col] = true;
      } else if (!isInner) {
        // 中心 3x3 区域
        matrix[row]![col] = true;
      }
      // 其他（内框与外框之间）保持 false
    }
  }
}

/** 简单的确定性伪随机布尔值生成器 */
function pseudoRandomBool(seed: number, index: number): boolean {
  // LCG 参数
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;
  const r = (a * (seed + index) + c) % m;
  return (r & 0x80) === 0x80;
}
