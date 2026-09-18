<script setup lang="ts">
import { ref } from 'vue';

interface EngineApiStat {
  name: string;
  port: number;
  endpointCount: number;
  isOnline: boolean;
}

const engines = ref<ReadonlyArray<EngineApiStat>>([
  { name: '系统引擎', port: 9001, endpointCount: 42, isOnline: true },
  { name: '身份引擎', port: 9002, endpointCount: 38, isOnline: true },
  { name: '消息引擎', port: 9004, endpointCount: 25, isOnline: true },
  { name: '文件引擎', port: 9003, endpointCount: 56, isOnline: true },
  { name: '流程引擎', port: 9005, endpointCount: 47, isOnline: true },
  { name: '任务引擎', port: 9006, endpointCount: 19, isOnline: true },
  { name: '规则引擎', port: 9007, endpointCount: 33, isOnline: true },
  { name: '智能引擎', port: 9008, endpointCount: 71, isOnline: true },
]);

const totalEndpoints = engines.value.reduce((sum, e) => sum + e.endpointCount, 0);
</script>

<template>
  <div class="api-stats-panel">
    <p class="total-line">全平台合计 <strong>{{ totalEndpoints }}</strong> 个 REST 端点</p>
    <div class="api-grid">
      <div
        v-for="engine in engines"
        :key="engine.port"
        class="api-card"
      >
        <span class="engine-name">{{ engine.name }}</span>
        <span class="engine-port">:{{ engine.port }}</span>
        <span class="endpoint-badge">{{ engine.endpointCount }} endpoints</span>
        <span :class="['status-dot', engine.isOnline ? 'status-online' : 'status-offline']" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.api-stats-panel {
  margin: 12px 0;
}

.total-line {
  font-size: 14px;
  color: var(--ydsz-text-secondary);
  margin: 0 0 12px;
}

.api-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.api-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--ydsz-border);
  border-radius: 8px;
  background: var(--ydsz-bg-card);
  font-size: 13px;
}

.engine-name {
  font-weight: 600;
  color: var(--ydsz-text-primary);
}

.engine-port {
  font-family: monospace;
  color: var(--ydsz-accent);
  font-size: 12px;
}

.endpoint-badge {
  margin-left: auto;
  font-size: 12px;
  color: var(--ydsz-text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-online {
  background: #00c9a7;
}

.status-offline {
  background: #e02020;
}
</style>
