/**
 * 配置审批 Mock 数据 —— 后端 API 未实现时的前端占位数据源
 *
 * <p>TODO: 对接真实 API 后废弃本文件，列表页直接将 gridOptions.proxyConfig 指向真实接口。
 *
 * @path apps\system-web\src\views\config-approval\mock-data.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ConfigApprovalRecord } from '#/api/types/config-approval';

/** 构造一条随机日期（过去 30 天内） */
function randomDateInPast(days = 30): string {
  const d = new Date();
  d.setHours(d.getHours() - Math.floor(Math.random() * days * 24));
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

/** Mock 审批记录池（内存） */
export const MOCK_APPROVAL_RECORDS: ConfigApprovalRecord[] = [
  {
    id: 'apr-001',
    title: '配置变更申请：system.cache.ttl',
    resourceType: 'CONFIG',
    resourceKey: 'system.cache.ttl',
    resourceGroup: 'SYSTEM',
    changeType: 'UPDATE',
    beforeJson: '{\n  "value": 300\n}',
    afterJson: '{\n  "value": 600\n}',
    status: 'PENDING',
    submitterId: 'u-1001',
    submitterName: '张三',
    submittedAt: randomDateInPast(1),
    currentApproverName: '当前用户',
    reason: '缓存 TTL 从 5 分钟调整到 10 分钟，提升命中率',
  },
  {
    id: 'apr-002',
    title: '配置变更申请：ydsz.workflow.sla-default-hours',
    resourceType: 'CONFIG',
    resourceKey: 'ydsz.workflow.sla-default-hours',
    resourceGroup: 'BUSINESS',
    changeType: 'UPDATE',
    beforeJson: '{\n  "hours": 24\n}',
    afterJson: '{\n  "hours": 48\n}',
    status: 'PENDING',
    submitterId: 'u-1002',
    submitterName: '李四',
    submittedAt: randomDateInPast(2),
    currentApproverName: '当前用户',
    reason: 'SLA 默认工时从 24h 调整为 48h',
  },
  {
    id: 'apr-003',
    title: '新增字典类型：order_status',
    resourceType: 'DICT',
    resourceKey: 'order_status',
    changeType: 'CREATE',
    afterJson: '{\n  "typeCode": "order_status",\n  "typeName": "订单状态"\n}',
    status: 'PENDING',
    submitterId: 'u-1001',
    submitterName: '张三',
    submittedAt: randomDateInPast(3),
    currentApproverName: '当前用户',
    reason: '为订单模块新增「订单状态」字典类型',
  },
  {
    id: 'apr-004',
    title: '字典项变更：order_status',
    resourceType: 'DICT',
    resourceKey: 'order_status',
    changeType: 'UPDATE',
    beforeJson: '{\n  "items": ["CREATED", "PAID"]\n}',
    afterJson: '{\n  "items": ["CREATED", "PAID", "SHIPPED"]\n}',
    status: 'APPROVED',
    submitterId: 'u-1003',
    submitterName: '王五',
    submittedAt: randomDateInPast(5),
    closedAt: randomDateInPast(4),
    reason: '订单配送流程新增"SHIPPED"状态值',
  },
  {
    id: 'apr-005',
    title: '删除变量：legacy.feature.flag',
    resourceType: 'VARIABLE',
    resourceKey: 'legacy.feature.flag',
    changeType: 'DELETE',
    beforeJson: '{\n  "value": "false"\n}',
    status: 'REJECTED',
    submitterId: 'u-1002',
    submitterName: '李四',
    submittedAt: randomDateInPast(7),
    closedAt: randomDateInPast(6),
    rejectionReason: '该变量仍有下游服务引用，暂不能删除',
    reason: '清理上线初期遗留的功能开关',
  },
  {
    id: 'apr-006',
    title: '配置变更申请：security.login.max-retries',
    resourceType: 'CONFIG',
    resourceKey: 'security.login.max-retries',
    resourceGroup: 'SECURITY',
    changeType: 'UPDATE',
    beforeJson: '{\n  "value": 3\n}',
    afterJson: '{\n  "value": 5\n}',
    status: 'WITHDRAWN',
    submitterId: 'u-1001',
    submitterName: '张三',
    submittedAt: randomDateInPast(10),
    closedAt: randomDateInPast(9),
    reason: '安全策略调整：允许更多重试次数',
  },
  {
    id: 'apr-007',
    title: '新增变量：notification.batch-size',
    resourceType: 'VARIABLE',
    resourceKey: 'notification.batch-size',
    changeType: 'CREATE',
    afterJson: '{\n  "value": 100\n}',
    status: 'APPROVED',
    submitterId: 'u-1003',
    submitterName: '王五',
    submittedAt: randomDateInPast(12),
    closedAt: randomDateInPast(11),
    reason: '通知 Batch 大小配置化',
  },
];
