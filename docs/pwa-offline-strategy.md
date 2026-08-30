# PWA 离线能力增强方案

> **版本**：v1.0.0  
> **适用范围**：ydsz-micro 前端项目  
> **日期**：2026-08-30  
> **状态**：草案

---

## 1. 背景与目标

### 1.1 当前问题

1. 网络断开时页面无法加载，用户体验差
2. 静态资源无缓存，每次打开需重新下载
3. GET 请求无离线缓存，弱网环境下体验差

### 1.2 目标

1. 静态资源离线缓存，二次打开秒开
2. GET 请求离线缓存，网络恢复后自动刷新
3. 网络断开时友好提示，避免静默失败

---

## 2. 技术方案

### 2.1 Service Worker 策略

```
┌─────────────────────────────────────────────────────────────┐
│                      Service Worker                          │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ App Shell   │  │ Static      │  │ API         │        │
│   │ Cache       │  │ Assets      │  │ Cache       │        │
│   │ (CacheFirst)│  │ (CacheFirst)│  │ (StaleWhile │        │
│   │             │  │             │  │  Revalidate)│        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 缓存策略

| 资源类型      | 策略                   | 说明                                    |
| ------------- | ---------------------- | --------------------------------------- |
| **App Shell** | Cache First            | HTML 入口优先使用缓存                   |
| **静态资源**  | Cache First            | JS/CSS/图片优先使用缓存，版本更新后失效 |
| **API 请求**  | Stale While Revalidate | 先返回缓存，后台更新                    |
| **字体文件**  | Cache First            | 字体文件长期缓存                        |

---

## 3. 实现方案

### 3.1 vite-plugin-pwa 配置

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'YDSZ Cloud',
        short_name: 'YDSZ',
        description: 'YDSZ 云平台',
        theme_color: '#1890ff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // App Shell 缓存
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 缓存策略
        runtimeCaching: [
          {
            // API 请求缓存
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 分钟
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 图片缓存
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
```

### 3.2 网络状态检测

```typescript
// composables/useNetworkStatus.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine);
  const wasOffline = ref(false);

  function handleOnline() {
    isOnline.value = true;
    // 网络恢复时触发刷新
    if (wasOffline.value) {
      window.dispatchEvent(new CustomEvent('network:restored'));
      wasOffline.value = false;
    }
  }

  function handleOffline() {
    isOnline.value = false;
    wasOffline.value = true;
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  });

  return {
    isOnline,
    wasOffline,
  };
}
```

### 3.3 离线提示组件

```vue
<!-- components/offline-indicator.vue -->
<template>
  <Transition name="slide-down">
    <div
      v-if="!isOnline"
      class="offline-indicator"
      role="alert"
      aria-live="assertive"
    >
      <WifiOffIcon class="offline-icon" />
      <span class="offline-text">网络已断开，部分功能可能受限</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useNetworkStatus } from '#/composables/useNetworkStatus';

const { isOnline } = useNetworkStatus();
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: #ff4d4f;
  color: white;
  font-size: 14px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
```

---

## 4. 离线数据同步

### 4.1 离线操作队列

```typescript
// utils/offline-queue.ts
interface QueuedOperation {
  id: string;
  url: string;
  method: string;
  body?: unknown;
  timestamp: number;
}

const QUEUE_NAME = 'offline-operation-queue';

export function addToOfflineQueue(
  operation: Omit<QueuedOperation, 'id' | 'timestamp'>,
): void {
  const queue = getOfflineQueue();
  queue.push({
    ...operation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_NAME, JSON.stringify(queue));
}

export function getOfflineQueue(): QueuedOperation[] {
  const raw = localStorage.getItem(QUEUE_NAME);
  return raw ? JSON.parse(raw) : [];
}

export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue().filter((op) => op.id !== id);
  localStorage.setItem(QUEUE_NAME, JSON.stringify(queue));
}

export async function processOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  for (const operation of queue) {
    try {
      await fetch(operation.url, {
        method: operation.method,
        headers: { 'Content-Type': 'application/json' },
        body: operation.body ? JSON.stringify(operation.body) : undefined,
      });
      removeFromOfflineQueue(operation.id);
    } catch {
      // 继续处理下一个
    }
  }
}
```

### 4.2 网络恢复自动同步

```typescript
// main.ts
import { processOfflineQueue } from '#/utils/offline-queue';

window.addEventListener('online', () => {
  processOfflineQueue();
});
```

---

## 5. 缓存管理

### 5.1 缓存清理策略

```typescript
// utils/cache-manager.ts
export async function clearOldCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const validCaches = ['api-cache', 'image-cache', 'app-shell'];

  await Promise.all(
    cacheNames
      .filter((name) => !validCaches.includes(name))
      .map((name) => caches.delete(name)),
  );
}

export async function getCacheSize(): Promise<number> {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}
```

### 5.2 缓存大小限制

| 缓存名称    | 最大条目 | 最大年龄       |
| ----------- | -------- | -------------- |
| api-cache   | 100      | 5 分钟         |
| image-cache | 60       | 30 天          |
| app-shell   | 20       | 版本更新时失效 |

---

## 6. 监控与告警

### 6.1 关键指标

| 指标         | 说明                      | 目标      |
| ------------ | ------------------------- | --------- |
| 缓存命中率   | 缓存命中次数 / 总请求次数 | > 80%     |
| 离线可用时间 | 离线状态下可使用的时间    | > 30 分钟 |
| 二次打开时间 | 二次打开页面加载时间      | < 1 秒    |
| 缓存大小     | 缓存占用存储空间          | < 50MB    |

### 6.2 日志格式

```json
{
  "timestamp": "2026-08-30T10:00:00.000Z",
  "level": "info",
  "message": "Cache hit",
  "url": "/api/v1/config",
  "cacheName": "api-cache",
  "size": 2048
}
```

---

## 7. 实施计划

### 7.1 第一阶段（1 周）

1. 配置 vite-plugin-pwa
2. 实现 App Shell 缓存
3. 实现静态资源缓存
4. 添加网络状态检测

### 7.2 第二阶段（1 周）

1. 实现 API 请求缓存
2. 实现离线操作队列
3. 实现网络恢复自动同步
4. 添加离线提示组件

### 7.3 第三阶段（1 周）

1. 缓存清理策略
2. 缓存大小限制
3. 监控与告警
4. 性能测试与优化

---

## 8. 安全规范

### 8.1 缓存数据安全

1. 敏感数据不缓存到 localStorage
2. API 缓存仅缓存 GET 请求
3. 用户登出时清除所有缓存

### 8.2 缓存失效策略

```typescript
// 用户登出时清除缓存
export async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  localStorage.removeItem('offline-operation-queue');
}
```

---

## 9. 总结

PWA 离线能力是提升用户体验的重要手段，通过合理的缓存策略和离线机制，确保用户在弱网或离线环境下也能正常使用应用。

---

> **文档维护**：本方案由 ydsz-team 负责，如有疑问请提交 Issue。
