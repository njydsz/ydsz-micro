/**
 * 洞察报告 API 封装（前端）
 *
 * <p>对应后端 {@code InsightReportController}，提供 BI 洞察报告的生成、查询、列表、导出、删除能力。
 * <p>路径规范: /api/agent/insight/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @author ydsz-team
 * @path apps/agent-web/src/api/insightReport.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** 洞察报告状态枚举（对齐后端 {@code InsightReportStatus}） */
export type InsightReportStatus = 'draft' | 'completed' | 'failed' | 'exported';

/** 洞察报告生成请求 DTO */
export interface InsightReportRequestDTO {
  /** 触发用户 ID */
  userId?: string;
  /** 关联对话 ID（可选） */
  conversationId?: string;
  /** 报告标题 */
  reportTitle?: string;
  /** 原始分析查询（可选） */
  query?: string;
  /** 数据源类型（sql / python / mixed，默认 mixed） */
  dataSourceType?: string;
  /** 原始数据分析结果的 JSON 字符串 */
  dataJson?: string;
  /** 报告格式（html / pdf / markdown，默认 html） */
  reportFormat?: string;
  /** 额外参数（可选） */
  extraParams?: Record<string, string>;
}

/** 洞察报告章节值对象 */
export interface InsightSectionVO {
  /** 章节类型（summary / data / chart / insight / trend / prediction） */
  sectionType?: string;
  /** 章节标题 */
  title?: string;
  /** 章节内容（Markdown 或纯文本） */
  content?: string;
  /** 结构化数据 JSON（可选，图表等可视化数据） */
  dataJson?: string;
  /** 排序序号 */
  sortOrder?: number;
}

/** 洞察报告结果值对象 */
export interface InsightReportResultVO {
  /** 报告唯一 ID */
  reportId?: string;
  /** 报告标题 */
  title?: string;
  /** 生成的报告全文 */
  content?: string;
  /** 报告章节列表 */
  sections?: InsightSectionVO[];
  /** 报告状态（draft / completed / failed / exported） */
  status?: InsightReportStatus;
  /** 存储路径/URL（可选） */
  reportPath?: string;
  /** 创建时间（ISO 8601） */
  createdAt?: string;
  /** 生成耗时（毫秒） */
  durationMs?: number;
}

/** 洞察报告列表查询参数 */
export interface InsightReportListQuery {
  /** 用户 ID（必填） */
  userId?: string;
  /** 返回条数上限（默认 10） */
  limit?: number;
}

/**
 * 生成洞察报告。
 *
 * <p>POST /api/agent/insight/report
 *
 * @param data - 报告生成请求
 * @returns 报告结果
 */
export function generateReport(data: InsightReportRequestDTO): Promise<InsightReportResultVO> {
  return requestClient.post<InsightReportResultVO>('/api/agent/insight/report', data);
}

/**
 * 查询报告元数据。
 *
 * <p>GET /api/agent/insight/report/{reportId}
 *
 * @param reportId - 报告 ID
 * @returns 报告结果（404 当不存在时）
 */
export function getReport(reportId: string): Promise<InsightReportResultVO> {
  return requestClient.get<InsightReportResultVO>(`/api/agent/insight/report/${reportId}`);
}

/**
 * 导出报告 HTML 渲染结果。
 *
 * <p>GET /api/agent/insight/report/{reportId}/html
 * <p>返回 text/html 内容，可在浏览器中直接打开查看。
 *
 * @param reportId - 报告 ID
 * @returns HTML 字节流
 */
export function exportHtml(reportId: string): Promise<unknown> {
  return requestClient.get<unknown>(`/api/agent/insight/report/${reportId}/html`);
}

/**
 * 列出用户近期报告。
 *
 * <p>GET /api/agent/insight/reports?userId=xxx&limit=10
 *
 * @param query - 列表查询参数
 * @returns 报告列表
 */
export function listRecentReports(query: InsightReportListQuery): Promise<InsightReportResultVO[]> {
  const params = new URLSearchParams();
  if (query.userId) {
    params.append('userId', query.userId);
  }
  if (query.limit !== undefined) {
    params.append('limit', String(query.limit));
  }
  return requestClient.get<InsightReportResultVO[]>(`/api/agent/insight/reports?${params.toString()}`);
}

/**
 * 删除报告。
 *
 * <p>DELETE /api/agent/insight/report/{reportId}
 *
 * @param reportId - 报告 ID
 * @returns 操作结果
 */
export function deleteReport(reportId: string): Promise<{ status?: string; reportId?: string }> {
  return requestClient.delete<{ status?: string; reportId?: string }>(`/api/agent/insight/report/${reportId}`);
}
