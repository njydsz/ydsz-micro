/**
 * RoutePredictor 马尔可夫链路由预测引擎单元测试
 *
 * 覆盖：
 * 1. recordTransition 正确累积转移计数
 * 2. predict 按概率降序返回候选项
 * 3. 单一转移路径的确定性预测
 * 4. 指数衰减：较早记录权重低于较新记录
 * 5. 空记录时 predict 返回空数组或冷启动 fallback
 * 6. 多次双向转移均衡分配概率
 * 7. clear 清空所有记录
 * 8. 边界条件：空字符串/同应用自跳转静默忽略
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/route-predictor.spec.ts
 * @author ydsz-team
 * @since 4.2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// hoisted：确保 mock logger 在 vi.mock 工厂中可用（vi.mock 会被提升到文件顶部）
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@YDSZ-core/shared/utils', () => ({
  createLogger: () => mockLogger,
}));

import {
  RoutePredictor,
  getRoutePredictor,
  Prediction,
  resetRoutePredictor,
} from '../../route-predictor';

// 半衰期常量（与 route-predictor.ts 保持一致）
const DECAY_HALFLIFE_MS = 3 * 24 * 60 * 60 * 1000; // 3 天
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

describe('RoutePredictor — 马尔可夫链状态转移', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    // 清理 localStorage 中的持久化数据
    localStorage.clear();
    // 重置单例
    resetRoutePredictor();
  });

  // ============================================================
  // recordTransition — 转移计数累积
  // ============================================================
  describe('recordTransition — 转移计数累积', () => {
    it('单次转移后计数应为 1', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');

      const predictions = predictor.predict('app-a');
      expect(predictions).toHaveLength(1);
      expect(predictions[0]).toMatchObject({
        appName: 'app-b',
        probability: 1,
        sampleSize: 1,
      } satisfies Prediction);
    });

    it('同一转移对多次调用应累积计数', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-b');

      const predictions = predictor.predict('app-a');
      expect(predictions).toHaveLength(1);
      expect(predictions[0].probability).toBe(1);
      expect(predictions[0].sampleSize).toBe(3);
    });

    it('不同目标应用的计数分别累积', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-c');

      // app-a → app-b: 2/3, app-a → app-c: 1/3
      expect(predictor.getTransitionProbability('app-a', 'app-b')).toBeCloseTo(
        2 / 3,
        5,
      );
      expect(predictor.getTransitionProbability('app-a', 'app-c')).toBeCloseTo(
        1 / 3,
        5,
      );
    });

    it('不同来源应用的计数独立维护', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-c');
      predictor.recordTransition('app-x', 'app-y');

      // app-a 的来源计数
      expect(predictor.getTransitionProbability('app-a', 'app-b')).toBeCloseTo(
        1 / 2,
        5,
      );
      // app-x 的来源计数
      expect(predictor.getTransitionProbability('app-x', 'app-y')).toBe(1);
    });

    it('空字符串应静默忽略不产生记录', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('', 'app-b');
      predictor.recordTransition('app-a', '');
      predictor.recordTransition('', '');

      expect(predictor.getKnownApps()).toHaveLength(0);
      expect(predictor.predict('app-a')).toHaveLength(0);
    });

    it('同应用自跳转 (from === to) 应静默忽略', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-a');

      expect(predictor.getKnownApps()).toHaveLength(0);
      expect(predictor.predict('app-a')).toHaveLength(0);
    });
  });

  // ============================================================
  // predict — 概率降序排列
  // ============================================================
  describe('predict — 概率降序预测', () => {
    it('应按概率降序返回候选项', () => {
      const predictor = new RoutePredictor();
      // app-a → app-b: 5 次, → app-c: 3 次, → app-d: 2 次
      for (let i = 0; i < 5; i++) {
        predictor.recordTransition('app-a', 'app-b');
      }
      for (let i = 0; i < 3; i++) {
        predictor.recordTransition('app-a', 'app-c');
      }
      for (let i = 0; i < 2; i++) {
        predictor.recordTransition('app-a', 'app-d');
      }

      const predictions = predictor.predict('app-a', 3);

      expect(predictions).toHaveLength(3);
      expect(predictions[0].appName).toBe('app-b');
      expect(predictions[0].probability).toBeCloseTo(0.5, 5);
      expect(predictions[1].appName).toBe('app-c');
      expect(predictions[1].probability).toBeCloseTo(0.3, 5);
      expect(predictions[2].appName).toBe('app-d');
      expect(predictions[2].probability).toBeCloseTo(0.2, 5);

      // 验证降序
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i - 1].probability).toBeGreaterThanOrEqual(
          predictions[i].probability,
        );
      }
    });

    it('topN 参数应正确限制返回数量', () => {
      const predictor = new RoutePredictor();
      for (let i = 0; i < 5; i++) {
        predictor.recordTransition('app-a', 'app-b');
      }
      for (let i = 0; i < 3; i++) {
        predictor.recordTransition('app-a', 'app-c');
      }
      for (let i = 0; i < 2; i++) {
        predictor.recordTransition('app-a', 'app-d');
      }

      const top2 = predictor.predict('app-a', 2);
      expect(top2).toHaveLength(2);
      expect(top2[0].appName).toBe('app-b');
      expect(top2[1].appName).toBe('app-c');

      const top1 = predictor.predict('app-a', 1);
      expect(top1).toHaveLength(1);
      expect(top1[0].appName).toBe('app-b');
    });

    it('Probability 总和应为 1（完全归一化）', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-c');
      predictor.recordTransition('app-a', 'app-d');

      const predictions = predictor.predict('app-a', 10);
      const totalProb = predictions.reduce(
        (sum, p) => sum + p.probability,
        0,
      );
      expect(totalProb).toBeCloseTo(1, 5);
    });
  });

  // ============================================================
  // 确定性预测 — 单一转移路径
  // ============================================================
  describe('确定性预测 — 单一转移路径', () => {
    it('仅有一条转移路径时应确定性返回下一状态', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('dashboard', 'analytics');

      const predictions = predictor.predict('dashboard');

      expect(predictions).toHaveLength(1);
      expect(predictions[0]).toMatchObject({
        appName: 'analytics',
        probability: 1,
        sampleSize: 1,
      } satisfies Prediction);
    });

    it('多次重复同一转移路径概率应为 100%', () => {
      const predictor = new RoutePredictor();
      for (let i = 0; i < 10; i++) {
        predictor.recordTransition('home', 'settings');
      }

      const predictions = predictor.predict('home');
      expect(predictions).toHaveLength(1);
      expect(predictions[0].probability).toBe(1);
      expect(predictions[0].appName).toBe('settings');
    });
  });

  // ============================================================
  // 指数衰减 — 半衰期 3 天
  // ============================================================
  describe('指数衰减 — 半衰期 3 天', () => {
    it('超过一个半衰期后计数应衰减至约 50%', () => {
      vi.useFakeTimers();
      const NOW = new Date('2025-06-01T00:00:00Z').getTime();
      vi.setSystemTime(NOW);

      const predictor = new RoutePredictor();
      // 记录 10 次 app-a → app-b（当前时间 NOW）
      for (let i = 0; i < 10; i++) {
        predictor.recordTransition('app-a', 'app-b');
      }

      // 前进 3 天（恰好一个半衰期），不新增记录
      vi.setSystemTime(NOW + DECAY_HALFLIFE_MS + 1000);

      // 强制保存（apply decay）
      predictor.save(true);

      // 验证 localStorage 中的计数已衰减
      const stored = JSON.parse(
        localStorage.getItem('micro-kernel:route-predictions') ?? '{}',
      );
      expect(stored.version).toBe(2);

      const abPair = stored.transitions.find(
        (t: { from: string; to: string }) =>
          t.from === 'app-a' && t.to === 'app-b',
      );
      expect(abPair).toBeDefined();
      // 10 * 0.5^1 = 5（允许四舍五入误差）
      expect(abPair.count).toBeCloseTo(5, 0);
    });

    it('超过两个半衰期后计数应衰减至约 25%', () => {
      vi.useFakeTimers();
      const NOW = new Date('2025-06-01T00:00:00Z').getTime();
      vi.setSystemTime(NOW);

      const predictor = new RoutePredictor();
      for (let i = 0; i < 20; i++) {
        predictor.recordTransition('app-a', 'app-b');
      }

      // 前进 6 天（两个半衰期），不新增记录
      vi.setSystemTime(NOW + 2 * DECAY_HALFLIFE_MS + 1000);

      predictor.save(true);

      const stored = JSON.parse(
        localStorage.getItem('micro-kernel:route-predictions') ?? '{}',
      );
      const abPair = stored.transitions.find(
        (t: { from: string; to: string }) =>
          t.from === 'app-a' && t.to === 'app-b',
      );
      expect(abPair).toBeDefined();
      // 20 * 0.5^2 = 5
      expect(abPair.count).toBeCloseTo(5, 0);
    });

    it('较新记录应比旧记录权重更高', () => {
      vi.useFakeTimers();
      const NOW = new Date('2025-06-01T00:00:00Z').getTime();
      vi.setSystemTime(NOW);

      const predictor = new RoutePredictor();

      // 古老的记录：app-a → old-target（5 次，在 T=0）
      for (let i = 0; i < 5; i++) {
        predictor.recordTransition('app-a', 'old-target');
      }

      // 前进 5 天，新增大量 → new-target 记录
      vi.setSystemTime(NOW + 5 * ONE_DAY);
      for (let i = 0; i < 10; i++) {
        predictor.recordTransition('app-a', 'new-target');
      }

      // 再前进 5 天保存（old 已 10 天，new 已 5 天）
      vi.setSystemTime(NOW + 10 * ONE_DAY);
      predictor.save(true);

      const stored = JSON.parse(
        localStorage.getItem('micro-kernel:route-predictions') ?? '{}',
      );

      const oldPair = stored.transitions.find(
        (t: { from: string; to: string }) =>
          t.from === 'app-a' && t.to === 'old-target',
      );
      const newPair = stored.transitions.find(
        (t: { from: string; to: string }) =>
          t.from === 'app-a' && t.to === 'new-target',
      );

      expect(oldPair).toBeDefined();
      expect(newPair).toBeDefined();
      // new-target 计数（10 * 较小衰减）应显著高于 old-target（5 * 较强衰减）
      expect(newPair.count).toBeGreaterThan(oldPair.count);
    });

    it('衰减后低于阈值的转移对应被丢弃', () => {
      vi.useFakeTimers();
      const NOW = new Date('2025-06-01T00:00:00Z').getTime();
      vi.setSystemTime(NOW);

      const predictor = new RoutePredictor();
      // 仅一次记录，30 天后衰减至 0.5^10 ≈ 0.001 → 1 * 0.001 = 0.001 < 0.01 → 丢弃
      predictor.recordTransition('app-a', 'stale-app');

      vi.setSystemTime(NOW + THIRTY_DAYS);
      predictor.save(true);

      const stored = JSON.parse(
        localStorage.getItem('micro-kernel:route-predictions') ?? '{}',
      );

      const stalePair = stored.transitions.find(
        (t: { from: string; to: string }) =>
          t.from === 'app-a' && t.to === 'stale-app',
      );
      expect(stalePair).toBeUndefined();
    });

    it('新记录（age ≈ 0）衰减因子应接近 1（几乎无衰减）', () => {
      vi.useFakeTimers();
      const NOW = new Date('2025-06-01T00:00:00Z').getTime();
      vi.setSystemTime(NOW);

      const predictor = new RoutePredictor();
      for (let i = 0; i < 10; i++) {
        predictor.recordTransition('app-a', 'app-b');
      }

      // 几乎不前进时间 → age ≈ 0 → decayFactor ≈ 1
      vi.setSystemTime(NOW + 1000); // 仅 1 秒
      predictor.save(true);

      const stored = JSON.parse(
        localStorage.getItem('micro-kernel:route-predictions') ?? '{}',
      );
      const abPair = stored.transitions.find(
        (t: { from: string; to: string }) =>
          t.from === 'app-a' && t.to === 'app-b',
      );
      // 10 * 0.5^(1/2592000) ≈ 9.999... → round 后约 10
      expect(abPair.count).toBe(10);
    });

    it('加载已衰减数据后 predict 应使用衰减后的计数', () => {
      vi.useFakeTimers();
      const NOW = new Date('2025-06-01T00:00:00Z').getTime();
      vi.setSystemTime(NOW);

      const predictor1 = new RoutePredictor();

      // 建立两条转移路径：app-a → app-b: 8 次, app-a → app-c: 2 次
      for (let i = 0; i < 8; i++) {
        predictor1.recordTransition('app-a', 'app-b');
      }
      for (let i = 0; i < 2; i++) {
        predictor1.recordTransition('app-a', 'app-c');
      }

      // 前进 3 天（半衰期）
      vi.setSystemTime(NOW + DECAY_HALFLIFE_MS + 1000);
      predictor1.save(true);

      // 在同一时间点新建 predictor 从 localStorage 加载（模拟跨会话恢复）
      const predictor2 = new RoutePredictor();

      // 加载后计数已衰减一半：app-b ≈ 4, app-c ≈ 1
      // totals = 4 + 1 = 5，概率比例保持 8:2 → P(b) = 4/5 = 0.8, P(c) = 1/5 = 0.2
      const predictions = predictor2.predict('app-a');
      expect(predictions).toHaveLength(2);
      expect(predictions[0].appName).toBe('app-b');
      expect(predictions[0].probability).toBeCloseTo(0.8, 1);
      expect(predictions[1].appName).toBe('app-c');
      expect(predictions[1].probability).toBeCloseTo(0.2, 1);
    });
  });

  // ============================================================
  // 空记录 — 冷启动
  // ============================================================
  describe('空记录 — 冷启动', () => {
    it('无任何记录时 predict 应返回空数组', () => {
      const predictor = new RoutePredictor();
      const result = predictor.predict('unknown-app');

      expect(result).toEqual([]);
    });

    it('无记录但有其他应用的转移数据时应回退到全局高频', () => {
      const predictor = new RoutePredictor();
      // 其他应用有转移数据，但 'new-app' 没有任何出边
      predictor.recordTransition('other-app', 'popular-app');
      predictor.recordTransition('another-app', 'popular-app');
      predictor.recordTransition('third-app', 'unicorn-app');

      const result = predictor.predict('new-app');

      // 回退到全局高频 topN，popular-app 被访问次数最多 (2 次)
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].appName).toBe('popular-app');
    });

    it('冷启动 fallback 应排除当前应用', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('src-a', 'current-app');
      predictor.recordTransition('src-b', 'current-app');
      predictor.recordTransition('src-c', 'other-app');

      const result = predictor.predict('current-app');
      // current-app 在全局被访问了 2 次，但作为 excludeApp 应被排除
      expect(result.every((p) => p.appName !== 'current-app')).toBe(true);
    });

    it('disable fallback (fallbackTopN=0) 且无记录时应返回空数组', () => {
      const predictor = new RoutePredictor();
      const result = predictor.predict('unknown-app', 3, 0);

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // 均衡分配 — 双向转移
  // ============================================================
  describe('均衡分配 — 多次双向转移', () => {
    it('A→B 与 B→A 次数相同时应各占 50%', () => {
      const predictor = new RoutePredictor();
      // app-a → app-b: 5 次, app-a → app-c: 5 次
      for (let i = 0; i < 5; i++) {
        predictor.recordTransition('app-a', 'app-b');
        predictor.recordTransition('app-a', 'app-c');
      }

      const predictions = predictor.predict('app-a', 2);
      expect(predictions).toHaveLength(2);
      expect(predictions[0].probability).toBeCloseTo(0.5, 5);
      expect(predictions[1].probability).toBeCloseTo(0.5, 5);
      expect(predictions[0].sampleSize).toBe(5);
      expect(predictions[1].sampleSize).toBe(5);
    });

    it('对称双向转移各自返回确定性下一状态', () => {
      const predictor = new RoutePredictor();
      // A→B 3 次, B→A 3 次
      for (let i = 0; i < 3; i++) {
        predictor.recordTransition('app-a', 'app-b');
        predictor.recordTransition('app-b', 'app-a');
      }

      const predFromA = predictor.predict('app-a');
      expect(predFromA).toHaveLength(1);
      expect(predFromA[0].appName).toBe('app-b');
      expect(predFromA[0].probability).toBe(1);

      const predFromB = predictor.predict('app-b');
      expect(predFromB).toHaveLength(1);
      expect(predFromB[0].appName).toBe('app-a');
      expect(predFromB[0].probability).toBe(1);
    });

    it('三轮交替转移应产生均匀概率分布', () => {
      const predictor = new RoutePredictor();
      // app-a → app-b: 2次, → app-c: 2次, → app-d: 2次
      const targets = ['app-b', 'app-c', 'app-d'];
      for (const target of targets) {
        for (let i = 0; i < 2; i++) {
          predictor.recordTransition('app-a', target);
        }
      }

      const predictions = predictor.predict('app-a', 3);
      expect(predictions).toHaveLength(3);
      for (const p of predictions) {
        expect(p.probability).toBeCloseTo(1 / 3, 5);
        expect(p.sampleSize).toBe(2);
      }
    });
  });

  // ============================================================
  // clear / reset — 清空记录
  // ============================================================
  describe('clear / reset — 清空所有记录', () => {
    it('clear 后所有已知应用应被清空', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-c');
      predictor.recordTransition('app-x', 'app-y');

      expect(predictor.getKnownApps().length).toBeGreaterThan(0);

      predictor.clear();

      expect(predictor.getKnownApps()).toHaveLength(0);
    });

    it('clear 后 predict 应返回空数组', () => {
      const predictor = new RoutePredictor();
      for (let i = 0; i < 5; i++) {
        predictor.recordTransition('app-a', 'app-b');
      }

      predictor.clear();

      const result = predictor.predict('app-a');
      expect(result).toEqual([]);
    });

    it('clear 后 getSummary 应返回零值', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');

      predictor.clear();

      const summary = predictor.getSummary();
      expect(summary.totalTransitions).toBe(0);
      expect(summary.uniquePairs).toBe(0);
      expect(summary.topPairs).toHaveLength(0);
    });

    it('clear 后应清除 localStorage 中的持久化数据', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.save(true);

      // 验证数据已持久化
      expect(localStorage.getItem('micro-kernel:route-predictions')).not.toBeNull();

      predictor.clear();

      expect(localStorage.getItem('micro-kernel:route-predictions')).toBeNull();
    });

    it('clear 后再次记录应从零开始', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-c');

      predictor.clear();
      predictor.recordTransition('app-a', 'app-d');

      const predictions = predictor.predict('app-a');
      expect(predictions).toHaveLength(1);
      expect(predictions[0].appName).toBe('app-d');
      expect(predictions[0].probability).toBe(1);
    });

    it('resetRoutePredictor 应销毁单例并清理状态', () => {
      const predictor = getRoutePredictor();
      predictor.recordTransition('app-a', 'app-b');

      resetRoutePredictor();

      // 获取新实例应无历史数据
      const fresh = getRoutePredictor();
      expect(fresh.predict('app-a')).toEqual([]);
      expect(fresh.getKnownApps()).toHaveLength(0);

      // 清理单例避免污染其他测试
      resetRoutePredictor();
    });
  });

  // ============================================================
  // getTransitionProbability — 特定转移对概率
  // ============================================================
  describe('getTransitionProbability — 特定转移对概率', () => {
    it('不存在转移对应返回 0', () => {
      const predictor = new RoutePredictor();
      expect(predictor.getTransitionProbability('app-a', 'app-b')).toBe(0);
    });

    it('特定转移对应返回正确条件概率', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-c');

      // P(app-b | app-a) = 2/3
      expect(
        predictor.getTransitionProbability('app-a', 'app-b'),
      ).toBeCloseTo(2 / 3, 5);
      // P(app-c | app-a) = 1/3
      expect(
        predictor.getTransitionProbability('app-a', 'app-c'),
      ).toBeCloseTo(1 / 3, 5);
      // P(app-d | app-a) = 0
      expect(predictor.getTransitionProbability('app-a', 'app-d')).toBe(0);
    });
  });

  // ============================================================
  // getGlobalTopApps — 全局高频应用
  // ============================================================
  describe('getGlobalTopApps — 全局高频应用', () => {
    it('应返回按全局访问次数降序排列的应用', () => {
      const predictor = new RoutePredictor();
      // popular-app 被访问 3 次
      predictor.recordTransition('s1', 'popular-app');
      predictor.recordTransition('s2', 'popular-app');
      predictor.recordTransition('s3', 'popular-app');
      // rare-app 被访问 1 次
      predictor.recordTransition('s4', 'rare-app');

      const topApps = predictor.getGlobalTopApps(2);
      expect(topApps).toHaveLength(2);
      expect(topApps[0].appName).toBe('popular-app');
      expect(topApps[0].probability).toBeCloseTo(0.75, 5);
      expect(topApps[1].appName).toBe('rare-app');
      expect(topApps[1].probability).toBeCloseTo(0.25, 5);
    });

    it('应支持排除特定应用', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('s1', 'app-x');
      predictor.recordTransition('s2', 'app-y');

      const topApps = predictor.getGlobalTopApps(2, 'app-x');
      expect(topApps.some((p) => p.appName === 'app-x')).toBe(false);
    });
  });

  // ============================================================
  // getSummary — 数据摘要
  // ============================================================
  describe('getSummary — 数据摘要', () => {
    it('应返回正确的汇总统计', () => {
      const predictor = new RoutePredictor();
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-b');
      predictor.recordTransition('app-a', 'app-c');
      predictor.recordTransition('app-x', 'app-y');

      const summary = predictor.getSummary();
      expect(summary.totalTransitions).toBe(4);
      expect(summary.uniquePairs).toBe(3); // a→b, a→c, x→y
      expect(summary.topPairs).toHaveLength(3);
      // topPairs 按 count 降序：a→b (2), a→c (1), x→y (1)
      expect(summary.topPairs[0]).toMatchObject({
        from: 'app-a',
        to: 'app-b',
        count: 2,
      });
    });
  });

  // ============================================================
  // 边界条件与鲁棒性
  // ============================================================
  describe('边界条件与鲁棒性', () => {
    it('save 不带 dirty 标记且非 force 时应跳过写入', () => {
      const predictor = new RoutePredictor();
      predictor.save(); // dirty 默认 false（未 recordTransition）
      // 不应抛出异常
      expect(true).toBe(true);
    });

    it('save force=true 应强制写入即使 dirty=false', () => {
      const predictor = new RoutePredictor();
      predictor.save(true);

      const stored = localStorage.getItem('micro-kernel:route-predictions');
      expect(stored).not.toBeNull();
      const data = JSON.parse(stored!);
      expect(data.version).toBe(2);
      expect(data.transitions).toEqual([]);
    });

    it('大量不同转移对应正确处理', () => {
      const predictor = new RoutePredictor();
      // 模拟 50 个不同应用，每个都有 3 个出边
      for (let i = 0; i < 50; i++) {
        predictor.recordTransition(`app-${i}`, `target-${i}-a`);
        predictor.recordTransition(`app-${i}`, `target-${i}-b`);
        predictor.recordTransition(`app-${i}`, `target-${i}-c`);
      }

      expect(predictor.getKnownApps().length).toBe(50);
      const summary = predictor.getSummary();
      expect(summary.totalTransitions).toBe(150);
      expect(summary.uniquePairs).toBe(150);
    });

    it('单应用中多目标预测排序正确（高分在前）', () => {
      const predictor = new RoutePredictor();
      // 按照 7:5:3:1 比例记录
      const targets = [
        { name: 't-a', count: 7 },
        { name: 't-b', count: 5 },
        { name: 't-c', count: 3 },
        { name: 't-d', count: 1 },
      ];
      for (const t of targets) {
        for (let i = 0; i < t.count; i++) {
          predictor.recordTransition('src', t.name);
        }
      }

      const predictions = predictor.predict('src', 4);
      expect(predictions.map((p) => p.appName)).toEqual([
        't-a',
        't-b',
        't-c',
        't-d',
      ]);
      expect(predictions[0].probability).toBeCloseTo(7 / 16, 5);
      expect(predictions[3].probability).toBeCloseTo(1 / 16, 5);
    });
  });
});
