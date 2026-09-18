<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface RuleStat {
  total: number;
  p0: number;
  p1: number;
  p2: number;
  lastUpdated: string;
}

const stats = ref<RuleStat>({
  total: 64,
  p0: 39,
  p1: 19,
  p2: 3,
  lastUpdated: '2026-09-17',
});

const recentChanges = ref<ReadonlyArray<{ id: string; level: string; summary: string; date: string }>>([
  { id: 'YDIZ-TEST-001', level: 'P0', summary: '测试金字塔模型规则', date: '2026-09-16' },
  { id: 'YDIZ-TX-002', level: 'P0', summary: '全局事务超时 ≤30000ms', date: '2026-09-14' },
  { id: 'YDIZ-IMPORT-005', level: 'P1', summary: '禁止业务模块直接 import Netty', date: '2026-09-12' },
]);

onMounted(() => {
  // 预留：未来可接口实时拉取
});
</script>

<template>
  <div class="stats-dashboard">
    <div class="stats-grid">
      <div class="stat-card stat-total">
        <span class="stat-number">{{ stats.total }}</span>
        <span class="stat-label">规范总条数</span>
      </div>
      <div class="stat-card stat-p0">
        <span class="stat-number">{{ stats.p0 }}</span>
        <span class="stat-label">P0 阻断级</span>
      </div>
      <div class="stat-card stat-p1">
        <span class="stat-number">{{ stats.p1 }}</span>
        <span class="stat-label">P1 严格级</span>
      </div>
      <div class="stat-card stat-p2">
        <span class="stat-number">{{ stats.p2 }}</span>
        <span class="stat-label">P2 建议级</span>
      </div>
    </div>

    <p class="stats-updated">最后更新：{{ stats.lastUpdated }}</p>

    <h3>近期新增规则</h3>
    <ul class="change-list">
      <li v-for="item in recentChanges" :key="item.id">
        <span :class="`badge badge-${item.level.toLowerCase()}`">{{ item.level }}</span>
        <strong>&nbsp;{{ item.id }}</strong>
        <span class="item-summary">— {{ item.summary }}</span>
        <span class="item-date">{{ item.date }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.stats-dashboard {
  margin: 16px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border-radius: 10px;
  border: 1px solid var(--ydsz-border);
  background: var(--ydsz-bg-card);
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--ydsz-brand);
  line-height: 1.2;
}

.stat-p0 .stat-number {
  color: var(--ydsz-danger);
}

.stat-p1 .stat-number {
  color: var(--ydsz-warn);
}

.stat-p2 .stat-number {
  color: #2e7d32;
}

.stat-label {
  font-size: 12px;
  color: var(--ydsz-text-secondary);
  margin-top: 4px;
}

.stats-updated {
  font-size: 12px;
  color: var(--ydsz-text-secondary);
  text-align: right;
  margin: 4px 0 16px;
}

.change-list {
  list-style: none;
  padding: 0;
  margin: 8px 0;
}

.change-list li {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--ydsz-border);
  font-size: 14px;
}

.change-list li:last-child {
  border-bottom: none;
}

.item-summary {
  color: var(--ydsz-text-secondary);
  margin-left: 4px;
}

.item-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--ydsz-text-secondary);
  white-space: nowrap;
}
</style>
