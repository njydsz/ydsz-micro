/**
 * LockAdminController API 封装
 *
 * <p>对应后端 {@code LockAdminController}，共 3 个端点。
 * <p>路径规范: /api/v1/system/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @path apps\system-web\src\api\lock-admin.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { PageResponse } from './models';
import type { PageQuery } from './models';

/**
 * 分布式锁视图对象
 *
 * <p>展示锁的完整元信息，包括持有者、TTL、过期时间等关键运维数据。
 */
export interface LockVO {
  /** 锁 Key */
  lockKey?: string;
  /** 应用实例标识（持有者） */
  owner?: string;
  /** 获取时间（ISO 字符串） */
  acquiredAt?: string;
  /** 过期时间（ISO 字符串） */
  expiresAt?: string;
  /** 剩余 TTL（毫秒） */
  remainingTtlMs?: number;
  /** 可重入次数 */
  reentrantCount?: number;
}

/**
 * 锁分页查询参数
 */
export interface LockPageQuery extends PageQuery {
  /** lockKey 模糊搜索（可选） */
  lockKey?: string;
  /** 持有者筛选（可选） */
  owner?: string;
}

/**
 * 锁统计数据
 */
export interface LockStatsVO {
  /** 活跃锁数量 */
  activeLockCount?: number;
  /** 已超时锁数量（即将释放） */
  expiredCount?: number;
  /** 持有者分布（实例 → 锁数量） */
  ownerDistribution?: Record<string, number>;
}

/**
 * listLocks: GET /system/lock/page
 */
export function listLocks(params: {
  query?: LockPageQuery;
}): Promise<PageResponse<LockVO[]>> {
  return requestClient.get<PageResponse<LockVO[]>>(`/system/lock/page`, { params });
}

/**
 * releaseLock: DELETE /system/lock/{lockKey}
 */
export function releaseLock({ lockKey }: { lockKey: string }): Promise<boolean> {
  return requestClient.delete<boolean>(`/system/lock/${lockKey}`);
}

/**
 * getLockStats: GET /system/lock/stats
 */
export function getLockStats(): Promise<LockStatsVO> {
  return requestClient.get<LockStatsVO>(`/system/lock/stats`);
}
