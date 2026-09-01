/**
 * 全局搜索面板的类型契约。
 *
 * <p>与后端 {@code com.njydsz.common.search.api.SearchResponse} / {@code SearchHit} / {@code SearchSuggestion}
 * 一一对应，通过 gen:api 或手工同步保持两端一致。
 *
 * @path comm/@core/ui-kit/shadcn-ui/src/components/search/search-types.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-13)
 */

/** 单条搜索结果（与后端 SearchHit 对齐） */
export interface SearchHit {
  /** 结果唯一 ID（由 indexer 生成） */
  id: string;
  /** 标题（支持高亮 HTML） */
  title: string;
  /** 描述/摘要文本 */
  description?: string;
  /** 模块标识（用于 tab 分组与定位图标） */
  moduleKey?: string;
  /** 源业务 ID（如 userId、workflowId） */
  sourceId?: string | number;
  /** 跳转路径（前端路由） */
  link?: string;
  /** 分类标签（用于右侧 meta 区） */
  tags?: string[];
  /** 命中时间（排序依据） */
  timestamp?: string;
  /** 高亮片段（highlight.title > title，优先渲染） */
  highlight?: {
    title?: string;
    description?: string;
  };
  /** 排序得分（debug 模式展示） */
  score?: number;
  /** 原始文档 JSON（供 debug 面板查看） */
  raw?: Record<string, unknown>;
}

/** 搜索建议（自动补全项） */
export interface SearchSuggestion {
  /** 建议文本（展示给用户） */
  text: string;
  /** 类型：'history' | 'trending' | 'result' */
  type?: 'history' | 'trending' | 'result';
}

/** 跨模块聚合搜索结果 */
export interface GlobalSearchResponse {
  /** 跨模块聚合结果（hits 已按 score 降序） */
  hits: SearchHit[];
  /** 各模块命中数分布（module → hits[]） */
  moduleHits?: Record<string, SearchHit[]>;
  /** 总命中数 */
  total: number;
  /** 耗时（ms） */
  tookMs: number;
}

/** 模块标识到展示名称的映射（后端不维护 label 约定，由前端枚举中心维护） */
export const MODULE_LABELS: Record<string, string> = {
  userinfo: '用户',
  system: '系统',
  message: '消息',
  workflow: '流程',
  cronjob: '调度',
  nextwiki: '知识库',
  literule: '规则',
  agent: 'Agent',
  file: '文件',
};

/** 模块标识到图标名的映射 */
export const MODULE_ICONS: Record<string, string> = {
  userinfo: 'lucide:users',
  system: 'lucide:settings',
  message: 'lucide:message-circle',
  workflow: 'lucide:workflow',
  cronjob: 'lucide:clock',
  nextwiki: 'lucide:book-open',
  literule: 'lucide:shield-check',
  agent: 'lucide:bot',
  file: 'lucide:file-text',
};
