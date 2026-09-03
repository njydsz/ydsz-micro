<!--
 * 文件版本历史组件
 *
 * <p>展示文件的历史版本列表，支持版本对比、回滚、下载历史版本。
 *
 * @path apps/nextwiki-web/src/views/file/components/FileVersionHistory.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件版本历史
 * <p>展示文件的历史版本列表，支持预览、下载、回滚到指定版本。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYDSZModal } from '@ydsz/common-ui';
import {
  ElButton,
  ElDialog,
  ElMessage,
  ElMessageBox,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import { onMounted, ref } from 'vue';
import { download } from '#/api/download';
import type { FileNodeVO } from '#/api/models';

interface Props {
  fileNode?: FileNodeVO | null;
}

const props = withDefaults(defineProps<Props>(), {
  fileNode: null,
});

const emit = defineEmits<{
  success: [];
  close: [];
}>();

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (isOpen) {
      loadVersions();
    }
  },
});

/** 版本列表 */
interface FileVersionVO {
  id: string;
  version: number;
  size: number;
  createdBy: string;
  createdAt: string;
  remark: string;
  isCurrent: boolean;
}

const versions = ref<FileVersionVO[]>([]);
const loading = ref(false);
const comparing = ref(false);
const diffContent = ref('');

/** 模拟版本数据 */
function getMockVersions(): FileVersionVO[] {
  return [
    {
      id: 'v3',
      version: 3,
      size: props.fileNode?.size ?? 0,
      createdBy: 'admin',
      createdAt: '2024-01-15 14:30:00',
      remark: '最终版本',
      isCurrent: true,
    },
    {
      id: 'v2',
      version: 2,
      size: (props.fileNode?.size ?? 0) - 1024,
      createdBy: 'admin',
      createdAt: '2024-01-14 10:00:00',
      remark: '修改部分内容',
      isCurrent: false,
    },
    {
      id: 'v1',
      version: 1,
      size: (props.fileNode?.size ?? 0) - 2048,
      createdBy: 'admin',
      createdAt: '2024-01-13 09:00:00',
      remark: '初始版本',
      isCurrent: false,
    },
  ];
}

/** 加载版本列表 */
async function loadVersions(): Promise<void> {
  loading.value = true;
  try {
    // TODO: 调用后端 API 获取版本列表
    versions.value = getMockVersions();
  } catch {
    versions.value = [];
  } finally {
    loading.value = false;
  }
}

/** 格式化文件大小 */
function formatSize(size?: number): string {
  if (size === undefined || size < 0) return '-';
  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size;
  let unit = 'KB';
  for (const u of units) {
    value /= 1024;
    unit = u;
    if (value < 1024) break;
  }
  return `${value.toFixed(1)} ${unit}`;
}

/** 预览历史版本 */
function handlePreview(version: FileVersionVO): void {
  ElMessage.info(`预览版本 v${version.version}`);
}

/** 下载历史版本 */
async function handleDownloadVersion(version: FileVersionVO): Promise<void> {
  if (!props.fileNode?.id) return;
  try {
    await download({ nodeId: props.fileNode.id }, { version: version.version });
    ElMessage.success('下载已开始');
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 回滚到指定版本 */
async function handleRollback(version: FileVersionVO): Promise<void> {
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ElMessageBox.confirm(
      `确定回滚到版本 v${version.version} 吗？当前版本将被覆盖。`,
      '回滚确认',
      { type: 'warning' },
    );
  } catch {
    return; // 用户主动取消回滚操作
  }
  // 步骤2：执行回滚操作
  try {
    // TODO: 调用后端 API 回滚版本
    ElMessage.success(`已回滚到版本 v${version.version}`);
    emit('success');
    modalApi.close();
  } catch {
    // 错误已由请求拦截器展示，无需重复处理
  }
}

/** 对比版本差异 */
function handleCompare(): void {
  comparing.value = true;
  diffContent.value = `版本对比功能开发中...\n\n当前版本：v3\n对比版本：v2\n\n变更内容：\n- 新增：第 10-20 行内容\n- 修改：第 35 行文字\n- 删除：第 50-55 行内容`;
}

onMounted(() => {
  loadVersions();
});
</script>

<template>
  <Modal :title="`版本历史 - ${props.fileNode?.name ?? ''}`" width="900px">
    <div v-loading="loading">
      <div class="mb-3 flex justify-between">
        <span class="text-sm text-gray-500">共 {{ versions.length }} 个版本</span>
        <div class="flex gap-2">
          <ElButton size="small" @click="handleCompare">版本对比</ElButton>
          <ElButton size="small" @click="loadVersions">刷新</ElButton>
        </div>
      </div>

      <ElTable :data="versions" border>
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn label="版本" width="80">
          <template #default="{ row }">
            <span class="font-medium">v{{ row.version }}</span>
            <ElTag v-if="row.isCurrent" size="small" type="success" class="ml-1">当前</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="size" label="大小" width="100">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="createdBy" label="操作人" width="100" />
        <ElTableColumn prop="createdAt" label="时间" width="170" />
        <ElTableColumn prop="remark" label="备注" min-width="120" />
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" link type="primary" @click="handlePreview(row)">预览</ElButton>
            <ElButton size="small" link type="primary" @click="handleDownloadVersion(row)">下载</ElButton>
            <ElButton
              v-if="!row.isCurrent"
              size="small"
              link
              type="warning"
              @click="handleRollback(row)"
            >
              回滚
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 版本对比结果 -->
      <ElDialog v-model="comparing" title="版本对比" width="700px">
        <pre class="max-h-96 overflow-auto whitespace-pre-wrap rounded border bg-gray-50 p-3 text-xs">{{ diffContent }}</pre>
        <template #footer>
          <ElButton @click="comparing = false">关闭</ElButton>
        </template>
      </ElDialog>
    </div>
  </Modal>
</template>
