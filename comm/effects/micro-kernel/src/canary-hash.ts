/**
 * 灰度分流哈希函数
 *
 * 从 canary-manager.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/canary-hash.ts
 * @author ydsz-team
 * @since 4.0.0
 */

/**
 * 哈希函数：将 userId 映射到 0-100 区间，保证同一用户固定命中。
 * 使用 FNV-1a 32-bit 变体，分布均匀且零依赖。
 */
export function hashToPercentage(input: string): number {
  let h = 0x81_1c_9d_c5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01_00_01_93);
  }
  return Math.abs(h % 100);
}
