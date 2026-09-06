/**
 * 历史回滚 composable —— 提供历史记录的列表查询、版本对比、回滚操作。
 *
 * <p>封装生成历史相关状态和 API 调用，供历史页和 Diff 预览侧栏复用。
 *
 * @path apps/generator-web/src/composables/use-history-rollback.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { ref } from 'vue';

import { ElMessage, ElMessageBox } from 'element-plus';

import { deleteHistory, listHistoryFiles, listRecentHistory, rollbackHistory } from '#/api/history';

import type { GenHistory, GenHistoryFile } from '#/api/models';

// ══════ 类型定义 ══════

/**
 * 历史回滚记录视图模型。
 */
export interface HistoryRecord {
  id: number | string;
  tableName: string;
  generatedAt: string;
  author: string;
  files: number;
  status: 'success' | 'partial' | 'failed';
}

/**
 * Diff 文件对比数据模型。
 */
export interface DiffFileInfo {
  fileName: string;
  oldCode: string;
  newCode: string;
}

// ══════ Composable 主体 ══════

/**
 * 历史回滚 composable。
 *
 * <p>提供历史记录的加载、详情查看、版本对比、回滚等能力。
 */
export function useHistoryRollback() {
  /** 历史记录列表 */
  const histories = ref<GenHistory[]>([]);
  /** 列表加载状态 */
  const loading = ref(false);
  /** 当前选中的历史记录 */
  const selectedHistory = ref<GenHistory | null>(null);
  /** 历史任务文件详情列表 */
  const historyDetail = ref<GenHistoryFile[]>([]);
  /** Diff 预览文件列表 */
  const diffFiles = ref<DiffFileInfo[]>([]);
  /** Diff 预览是否显示 */
  const diffPreviewVisible = ref(false);

  /**
   * 获取历史记录列表。
   *
   * @param limit 查询条数，默认 20
   */
  async function fetchHistories(limit = 20) {
    loading.value = true;
    try {
      histories.value = await listRecentHistory({ limit });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 查看历史任务的文件详情。
   *
   * @param historyId 任务 ID
   */
  async function viewHistoryDetail(historyId: number) {
    const record = histories.value.find((h) => h.id === historyId);
    selectedHistory.value = record ?? null;
    historyDetail.value = [];
    if (!historyId) return;
    historyDetail.value = await listHistoryFiles({ id: historyId });
  }

  /**
   * 执行回滚操作（带二次确认）。
   *
   * @param history 历史记录条目
   */
  async function rollbackHistory(record: GenHistory) {
    if (!record.id) return;
    try {
      await ElMessageBox.confirm(
        `确定回滚任务 #${record.id} 吗？这将恢复或删除该任务生成的所有文件。`,
        '回滚确认',
        { type: 'warning' },
      );
    } catch {
      return;
    }
    try {
      await rollbackHistory({ id: record.id });
      ElMessage.success('回滚成功');
      await fetchHistories();
    } catch {
      // 错误提示由请求拦截器统一处理
    }
  }

  /**
   * 删除历史记录（带二次确认）。
   *
   * @param record 历史记录条目
   */
  async function deleteHistoryRecord(record: GenHistory) {
    if (!record.id) return;
    try {
      await ElMessageBox.confirm(`确定删除任务记录 #${record.id} 吗？`, '删除确认', {
        type: 'warning',
      });
    } catch {
      return;
    }
    try {
      await deleteHistory({ id: record.id });
      ElMessage.success('删除成功');
      await fetchHistories();
    } catch {
      // 错误提示由请求拦截器统一处理
    }
  }

  /**
   * 将历史记录与当前状态进行对比（diff）。
   *
   * <p>模拟对比：使用历史文件路径作为新代码展示，实际场景可加载旧备份内容。
   * 这里返回 DiffFileInfo 数组供 CodeDiffViewer 组件渲染。
   *
   * @param historyId 任务 ID
   * @returns Diff 文件列表
   */
  async function diffWithCurrent(historyId: number): Promise<DiffFileInfo[]> {
    const files = await listHistoryFiles({ id: historyId });
    // 构造 diff 数据：
    // - newCode 为历史文件的备份内容（如果有 originalBackupPath 说明是更新过的，可以展示旧备份）
    // - 当前端暂无文件内容获取接口时，以文件路径和动作信息作为占位展示
    const result: DiffFileInfo[] = files.map((file) => {
      const hasBackup = !!file.originalBackupPath;
      const isCreated = file.action === 'CREATED';
      let oldCode = '';
      let newCode = '';
      if (isCreated) {
        oldCode = '';
        newCode = `// 新建文件: ${file.filePath}\n// 操作: ${file.action}\n// 文件哈希: ${file.fileHash ?? 'N/A'}`;
      } else if (hasBackup) {
        oldCode = `// 备份内容来自: ${file.originalBackupPath}\n// (实际场景下应加载备份文件内容)\n// hash: ${file.fileHash ?? ''}`;
        newCode = `// 当前文件: ${file.filePath}\n// 操作: ${file.action}\n// hash: ${file.fileHash ?? ''}`;
      } else {
        oldCode = `// 文件未变更: ${file.filePath}`;
        newCode = `// 文件未变更: ${file.filePath}`;
      }
      return {
        fileName: file.filePath,
        oldCode,
        newCode,
      };
    });
    diffFiles.value = result;
    return result;
  }

  /**
   * 显示 Diff 预览。
   *
   * @param historyId 任务 ID
   */
  async function showDiffPreview(historyId: number) {
    await diffWithCurrent(historyId);
    diffPreviewVisible.value = true;
  }

  /**
   * 隐藏 Diff 预览。
   */
  function hideDiffPreview() {
    diffPreviewVisible.value = false;
    diffFiles.value = [];
  }

  return {
    histories,
    loading,
    selectedHistory,
    historyDetail,
    diffFiles,
    diffPreviewVisible,
    fetchHistories,
    viewHistoryDetail,
    rollbackHistory,
    deleteHistoryRecord,
    diffWithCurrent,
    showDiffPreview,
    hideDiffPreview,
  };
}
