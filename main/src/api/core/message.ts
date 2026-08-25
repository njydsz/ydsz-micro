/**
 * message API 接口定义 — 消息送达回执 / 模板版本历史（ydsz-message）
 *
 * 对齐后端 ydsz-message 模块的接口：
 * - GET  /api/v1/message/receipt/{logId}                      按日志ID查询送达回执（ReceiptController）
 * - GET  /api/v1/message/template/version/list/{templateCode}  查询模板版本历史（TemplateVersionController）
 *
 * @path main\src\api\core\message.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

export namespace MessageApi {
  /** 消息回执项（对齐后端 MsgReceiptVO）。 */
  export interface ReceiptItem {
    /** 回执记录唯一标识（主键） */
    id: string;
    /** 关联消息日志 ID */
    logId?: string;
    /** 三方服务商回执 ID */
    providerTraceId?: string;
    /** 回执类型（DELIVERED/READ/CLICKED/FAILED） */
    receiptType?: string;
    /** 回执时间 */
    receiptTime?: string;
    /** 供应商编码 */
    providerCode?: string;
    /** 供应商消息 */
    providerMsg?: string;
    /** 原始响应 JSON */
    rawResponse?: string;
    /** 创建时间 */
    createdAt?: string;
  }

  /** 模板版本历史项（对齐后端 MsgTemplateVersionVO）。 */
  export interface TemplateVersionItem {
    /** 版本记录唯一标识（主键） */
    id: string;
    /** 模板编码 */
    templateCode: string;
    /** 版本号 */
    version: number;
    /** 模板内容快照 */
    content?: string;
    /** 模板变量定义快照（JSON） */
    variableDefs?: string;
    /** 审核状态（APPROVED/REJECTED） */
    auditStatus?: string;
    /** 审核人 */
    auditor?: string;
    /** 审核意见 */
    auditRemark?: string;
    /** 创建时间 */
    createdAt?: string;
  }
}

/**
 * 按消息日志 ID 查询送达回执列表。
 *
 * @param logId - 消息日志 ID
 * @returns 该日志关联的回执记录列表，未产生回执时为空数组
 */
export function getReceiptsByLogIdApi(logId: string) {
  return requestClient.get<MessageApi.ReceiptItem[]>(
    `/api/v1/message/receipt/${logId}`,
  );
}

/**
 * 查询消息模板版本历史列表。
 *
 * @param templateCode - 模板编码
 * @returns 该模板的版本历史列表
 */
export function getTemplateVersionListApi(templateCode: string) {
  return requestClient.get<MessageApi.TemplateVersionItem[]>(
    `/api/v1/message/template/version/list/${templateCode}`,
  );
}