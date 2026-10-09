# YDSZ UI — Composables 组合式函数参考

> 27+ 业务逻辑可复用函数的完整签名与类型定义

---

## useTableData\<T\>

表格数据分页、排序、筛选、选择、展开全功能封装。

```typescript
function useTableData<T>(options: UseTableDataOptions<T>): UseTableDataReturn<T>
```

**UseTableDataOptions:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `MaybeRefOrGetter<T[]>` | 表格数据源 |
| `columns` | `MaybeRefOrGetter<TableColumnDef<T>[]>` | 列定义 |
| `isRemote` | `boolean` | 是否远程数据（false = 前端分页） |
| `rowSelection` | `RowSelectionConfig<T>` | 行选择配置 |
| `defaultExpandAllRows` | `boolean` | 默认展开所有行 |

**TableColumnDef:**

```typescript
interface TableColumnDef<T> {
  key: string;
  isSortable?: boolean;
  isFilterable?: boolean;
  sorter?: (a: T, b: T) => number;
  filters?: Array<{ text: string; value: string }>;
  filterMethod?: (value: string, row: T) => boolean;
}
```

**UseTableDataReturn:**

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `viewRows` | `ComputedRef<T[]>` | 当前视图数据（排序/筛选/分页后） |
| `sortState` | `Ref<SortState>` | 当前排序状态 |
| `toggleSort` | `(prop: string) => void` | 切换排序字段方向 |
| `filterState` | `Ref<Map<string, Set<string>>>` | 列筛选状态 |
| `setFilter` | `(columnKey, values) => void` | 设置列筛选项 |
| `clearFilters` | `() => void` | 清空全部筛选 |
| `selection` | `Ref<Set<string>>` | 已选行 key 集合 |
| `setSelected` | `(keys: string[]) => void` | 设置选中行 |
| `toggleSelectAll` | `() => void` | 全选/取消全选 |
| `expandedKeys` | `Ref<Set<string>>` | 已展开行 key 集合 |
| `toggleExpand` | `(key: string) => void` | 切换行展开状态 |
| `rawRows` | `ComputedRef<T[]>` | 原始数据 |

---

## useTableColumnStorage

表格列配置持久化到 localStorage。

```typescript
function useTableColumnStorage(tableKey: string): {
  loadColumnConfig: () => StoredColumnConfig[];
  saveColumnConfig: (columns: StoredColumnConfig[]) => void;
  clearColumnConfig: () => void;
}
```

**StoredColumnConfig:**

```typescript
interface StoredColumnConfig {
  key: string;
  isHidden?: boolean;
  width?: string;
  sort?: number;
  fixed?: 'left' | 'right';
}
```

---

## useColumnDrag\<T\>

表格列拖拽排序。

```typescript
function useColumnDrag<T>(
  columns: MaybeRef<T[]> | (() => T[]),
  onReorder: (fromIndex: number, toIndex: number) => void,
  options?: UseColumnDragOptions
): {
  dragState: Ref<ColumnDragState>;
  draggingFromIndex: ComputedRef<number>;
  draggingToIndex: ComputedRef<number>;
  onPointerDown: (event: PointerEvent, index: number) => void;
}
```

**UseColumnDragOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `threshold` | `number` | `4` |
| `canDrag` | `(fromIndex: number) => boolean` | — |

**ColumnDragState:**

```typescript
interface ColumnDragState { isDragging: boolean; fromIndex: number; toIndex: number; }
```

---

## useVirtualList\<T\>

虚拟滚动列表，大数据量流畅渲染。

```typescript
function useVirtualList<T>(
  items: MaybeRef<T[]> | (() => T[]),
  options?: UseVirtualListOptions
): VirtualListHandle<T>
```

**UseVirtualListOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `itemHeight` | `number` | `32` |
| `viewportHeight` | `number` | `256` |
| `overscan` | `number` | `5` |
| `getKey` | `(item, index) => string \| number` | — |
| `measuredHeights` | `Ref<Map<number, number>>` | — |

**VirtualListHandle:**

| 字段/方法 | 类型 |
|-----------|------|
| `visibleItems` | `Ref<VisibleItem<T>[]>` |
| `totalHeight` | `Ref<number>` |
| `offsetY` | `Ref<number>` |
| `onScroll` | `(event: Event) => void` |
| `scrollTop` | `Ref<number>` |
| `containerProps` | `Ref<{ style, onScroll }>` |
| `spacerProps` | `Ref<{ style }>` |

**VisibleItem:**

```typescript
interface VisibleItem<T> {
  data: T;
  index: number;
  offsetY: number;
  height: number;
  key: string | number;
}
```

---

## useTreeVirtual

树形虚拟滚动（扁平化 + 懒加载）。

```typescript
function useTreeVirtual(options: UseTreeVirtualOptions): TreeVirtualHandle
```

**UseTreeVirtualOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `flattenedNodes` | `MaybeRef<FlatTreeNode[]>` | — |
| `expandedKeys` | `Ref<Set<string \| number>>` | — |
| `viewportHeight` | `number` | `300` |
| `itemHeight` | `number` | `28` |
| `overscan` | `number` | `5` |
| `onLazyLoad` | `(ctx) => void \| Promise<void>` | — |

**TreeVirtualHandle:**

| 字段/方法 | 类型 |
|-----------|------|
| `expandedVisibleNodes` | `Ref<FlatTreeNode[]>` |
| `visibleSlice` | `Ref<VirtualTreeNode[]>` |
| `totalHeight` | `Ref<number>` |
| `containerStyle` | `Ref<Record<string, string>>` |
| `spacerStyle` | `Ref<Record<string, string>>` |
| `offsetY` | `Ref<number>` |
| `onScroll` | `(event: Event) => void` |
| `loadLazyNode` | `(value) => Promise<void>` |

---

## useNotificationHub

通知中心枢纽（WebSocket 长连接管理）。

```typescript
function useNotificationHub(
  options?: UseNotificationHubOptions
): UseNotificationHubReturn
```

**UseNotificationHubOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `initialItems` | `NotificationItem[]` | — |
| `preferences` | `Partial<NotificationPreferences>` | — |
| `streamUrl` | `string` | — |

**NotificationItem:**

```typescript
interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  level: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: number;
  link?: string;
}
```

**NotificationPreferences:**

```typescript
interface NotificationPreferences {
  placement: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';  // default 'top-right'
  maxVisible: number;        // default 5
  duration: number;          // default 4500ms
  isSoundEnabled: boolean;   // default false
  muteRange: [number, number] | null;  // 免打扰时段
}
```

**UseNotificationHubReturn:**

| 字段/方法 | 类型 |
|-----------|------|
| `items` | `Ref<NotificationItem[]>` |
| `unreadCount` | `Ref<number>` |
| `visibleItems` | `Ref<NotificationItem[]>` |
| `preferences` | `Ref<NotificationPreferences>` |
| `push` | `(item) => void` |
| `markAsRead` | `(id) => void` |
| `markAllAsRead` | `() => void` |
| `remove` | `(id) => void` |
| `clearAll` | `() => void` |
| `setPreferences` | `(prefs) => void` |
| `isMuted` | `Ref<boolean>` |
| `streamStatus` | `Ref<'connecting' \| 'open' \| 'closed' \| 'error'>` |
| `reconnect` | `() => void` |

---

## useOverlayStack

弹窗堆叠管理（z-index 自动递增）。

```typescript
function useOverlayStack(options?: {
  baseZIndex?: number;  // 默认 1000
  step?: number;        // 默认 20
}): OverlayStackHandle
```

**OverlayStackHandle:**

| 字段/方法 | 类型 |
|-----------|------|
| `depth` | `number` |
| `zIndex` | `number` |
| `register` | `() => void` |
| `unregister` | `() => void` |

---

## useDragSort

通用拖拽排序逻辑。

```typescript
function useDragSort(options: UseDragSortOptions): {
  dragState: Ref<DragSortState>;
  getListProps: () => Record<string, unknown>;
  getItemProps: (index: number) => Record<string, unknown>;
}
```

**UseDragSortOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `items` | `MaybeRef<unknown[]>` | — |
| `direction` | `'horizontal' \| 'vertical'` | `'vertical'` |
| `threshold` | `number` | `3` |
| `canDrag` | `(index) => boolean` | — |
| `containerSelector` | `string` | — |
| `onReorder` | `(payload: { from, to }) => void` | **必填** |

---

## useGridLayout

响应式网格布局（支持 xs/sm/md/lg/xl/xxl 断点）。

```typescript
type GridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

function useGridProvider(options?: {
  columns?: number | Partial<Record<GridBreakpoint, number>>;  // 默认 12
  rowGap?: number | string;       // 默认 16
  columnGap?: number | string;    // 默认 16
  breakpoints?: Partial<GridBreakpoints>;
}): GridContext

function useGridItem(config?: {
  span?: number | Partial<Record<GridBreakpoint, number>>;
  offset?: number;
  order?: number;
}): { gridColumn: string; order: number; }
```

---

## useIdleHydrate

空闲预注册（非可视区域延迟激活），优化首屏性能。

```typescript
function useIdleHydrate(options?: UseIdleHydrateOptions): IdleHydrateHandle
```

**UseIdleHydrateOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `intersection` | `boolean` | `false` |
| `rootMargin` | `string` | `"200px"` |
| `idle` | `boolean` | `true` |
| `immediate` | `boolean` | `import.meta.env.DEV` |

**IdleHydrateHandle:**

| 字段 | 类型 |
|------|------|
| `isHydrated` | `Ref<boolean>` |
| `forceMount` | `() => void` |
| `containerRef` | `Ref<HTMLElement \| undefined>` |

---

## useChunkUpload

大文件分片上传（断点续传 + 秒传 + 重试 + 超时）。

<p>当传入 <code>multipart.baseURL</code> 时走三步式分片上传，对接后端
<code>FileMultipartController</code>：

<pre>
1. POST {baseURL}/init?key={storageKey}&contentType={mime}      → { uploadId, recommendedPartSize }
2. POST {baseURL}/{uploadId}/part/{partNumber}  (binary body)   → Void（可并行、可重试最多 3 次）
3. POST {baseURL}/{uploadId}/complete                             → { uploadId }
</pre>

<p>未配置 <code>multipart</code> 时退化到旧版单 endpoint + /merge 模式。

```typescript
function useChunkUpload(options?: ChunkUploadOptions): ChunkUploadHandle
```

**ChunkUploadOptions:**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `chunkSize` | `number` | `5MB` | 触发分片的文件大小阈值 |
| `maxConcurrency` | `number` | `3` | 最大并发分片数 |
| `data` | `Record<string, string>` | — | 整文件直传时的附加表单字段 |
| `headers` | `Record<string, string>` | — | 自定义请求头（直传模式下使用） |
| `hashAlgorithm` | `'simple' \| 'sha256'` | — | hash 算法（预留） |
| `onHashCalculated` | `(hash) => Promise<boolean>` | — | 秒传判定回调 |
| `onChunkProgress` | `(percent, chunkIndex) => void` | — | 分片进度回调 |
| `withCredentials` | `boolean` | `false` | 是否携带 cookie |
| `multipart` | `MultipartApiConfig` | — | 分片上传 REST API 配置 |
| `maxRetries` | `number` | `3` | 单分片最大重试次数 |
| `chunkTimeout` | `number` | `30000` | 单次分片上传超时(ms) |

**MultipartApiConfig:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `baseURL` | `string` | 分片上传控制器 URL（如 <code>/api/v1/system/file/multipart</code>） |
| `headers` | `Record<string, string>` | 注入到每个请求的额外头部 |
| `withCredentials` | `boolean` | 覆盖全局 withCredentials 设置 |

**ChunkHttpRequestOptions.storageKey：**

三步式分片上传模式下必填，对应后端 <code>init</code> 接口的 <code>key</code> 参数
（对象存储路径，如 <code>nextwiki/2026/attachment.bin</code>）。

**ChunkUploadHandle:**

| 字段/方法 | 类型 |
|-----------|------|
| `enabled` | `(file: File) => boolean` |
| `httpRequest` | `(options: ChunkHttpRequestOptions) => Promise<unknown>` |
| `abort` | `() => void` |
| `overallProgress` | `Ref<number>` |

**常量导出：**

| 常量 | 默认值 |
|------|--------|
| `DEFAULT_CHUNK_SIZE` | `5 * 1024 * 1024` |
| `DEFAULT_MULTIPART_BASE` | `/api/v1/system/file/multipart` |
| `DEFAULT_MAX_RETRIES` | `3` |
| `DEFAULT_CHUNK_TIMEOUT` | `30000` |

---

## useA11yChecker

无障碍检查器（开发期 WAI-ARIA 验证，基于 axe-core）。

```typescript
function useA11yChecker(
  containerRef: Ref<HTMLElement | undefined>,
  options?: RunOptions
): {
  check: () => Promise<A11yCheckResult>;
  isComplete: Ref<boolean>;
  lastResult: Ref<A11yCheckResult | null>;
}
```

**A11yCheckResult:**

```typescript
interface A11yCheckResult {
  isClean: boolean;
  violationCount: number;
  violations: Array<{ description: string; id: string; impact: string }>;
}
```

---

## useA11yAssertions

Vitest 无障碍断言工具。

```typescript
function toBeAccessible<T extends HTMLElement>(container: T, options?: RunOptions): Promise<void>;
function toBeFormAccessible<T extends HTMLElement>(container: T, options?: RunOptions): Promise<AxeResults>;
function toBeTableAccessible<T extends HTMLElement>(container: T, options?: RunOptions): Promise<AxeResults>;
function formatViolations(results: AxeResults): string;
```

---

## useRenderPerformance

渲染性能监控（FPS / 渲染耗时），开发期警告慢组件。

```typescript
function useRenderPerformance(
  componentName: string,
  options?: {
    label?: string;
    threshold?: number;     // 默认 30
    enableTiming?: boolean; // 默认 true
  }
): void;

function getRenderPerfSnapshot(): ReadonlyMap<string, { count; lastWarnAt; totalMs }>;
function resetRenderPerf(componentName?: string): void;
```

---

## useComponentI18n

组件级国际化。

```typescript
function useComponentI18n(options: {
  defaultLocale?: string;   // 默认 'zh'
  messages: Record<string, Record<string, string>>;
}): {
  setLocale: (locale: string) => void;
  locale: () => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}
```

---

## useLocale

全局 locale 读写（内置 zh-CN / en-US、支持 RTL）。

```typescript
function useLocale(options?: {
  messages?: Partial<Record<LocaleLang, Partial<LocaleMessages>>>;
}): {
  t: (key: string, fallback?: string) => string;
  lang: Readonly<Ref<LocaleLang>>;
  isRTL: Readonly<Ref<boolean>>;
}
```

**命名空间**: `common` / `table` / `form` / `dialog` / `upload` / `pagination` / `datepicker` / `select` / `tree` / `message` / `notification` / `empty`

支持 `{placeholder}` 插值语法（如 `'共 {count} 条'`）。

---

## useBacktop

回到顶部。

```typescript
function useBacktop(): void
```

自动监听滚动位置，配合 `YdBackTop` 组件使用。
