<!--
 * GLUE 在线代码编辑器
 *
 * <p>提供 GLUE 任务的在线代码编辑能力，支持语法高亮、代码模板、版本管理、测试执行。
 *
 * @path apps\cronjob-web\src\views\job\components\GlueCodeEditor.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * GLUE 在线代码编辑器
 * <p>支持 Java/Groovy/Python 等语言的 GLUE 任务代码编辑。
 * <p>消费后端契约 GlueCodeController（apps/cronjob-web/src/api/glueCode.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYdModal } from '@ydsz/common-ui';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@ydsz-core/ui-kit/shadcn-ui';
import { Loader2 } from 'lucide-vue-next';
// TODO: ElForm/ElFormItem 表单组件保留 element-plus（有专门迁移批次）
import { ElForm, ElFormItem } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import { diff, latest, rollback, save, template, test, versions } from '#/api/glueCode';
import type { GlueCodeVO } from '#/api/models';

interface Props {
  /** 任务ID */
  jobId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  jobId: ''});

const emit = defineEmits<{
  success: [];
}>();

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    activeTab.value = 'editor';
    loadLatest();
  },
});

/** 当前激活的标签页 */
const activeTab = ref<'editor' | 'versions' | 'test'>('editor');

/** 代码内容 */
const codeContent = ref('');

/** 代码语言 */
const codeLanguage = ref('java');

/** 加载状态 */
const loading = ref(false);

/** 保存状态 */
const saving = ref(false);

/** 版本列表 */
const versionList = ref<GlueCodeVO[]>([]);

/** 测试参数 */
const testParams = ref('');

/** 测试结果 */
const testResult = ref('');

/** 测试执行中 */
const testing = ref(false);

/** 语言选项 */
const languageOptions = [
  { label: 'Java', value: 'java' },
  { label: 'Groovy', value: 'groovy' },
  { label: 'Python', value: 'python' },
  { label: 'Shell', value: 'shell' },
];

/** 当前版本号 */
const currentVersion = computed(() => {
  if (versionList.value.length === 0) return 0;
  return versionList.value[0]?.version ?? 0;
});

/** 加载最新代码 */
async function loadLatest(): Promise<void> {
  if (!props.jobId) return;
  loading.value = true;
  try {
    const result = await latest({ jobId: props.jobId });
    codeContent.value = (result.codeContent as string) ?? '';
    codeLanguage.value = (result.language as string) ?? 'java';
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 加载代码模板 */
async function loadTemplate(): Promise<void> {
  try {
    const result = await template({ language: codeLanguage.value });
    if (result) {
      codeContent.value = (result as string) ?? '';
    }
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载版本列表 */
async function loadVersions(): Promise<void> {
  if (!props.jobId) return;
  try {
    versionList.value = await versions({ jobId: props.jobId });
  } catch {
    versionList.value = [];
  }
}

/** 保存代码 */
async function handleSave(): Promise<void> {
  if (!props.jobId) return;
  if (!codeContent.value.trim()) {
    showToast.warning('请输入代码内容');
    return;
  }
  saving.value = true;
  try {
    await save({
      jobId: props.jobId,
      codeContent: codeContent.value,
      language: codeLanguage.value,
    });
    showToast.success('保存成功');
    emit('success');
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    saving.value = false;
  }
}

/** 执行测试 */
async function handleTest(): Promise<void> {
  if (!props.jobId || !codeContent.value.trim()) {
    showToast.warning('请先输入代码内容');
    return;
  }
  testing.value = true;
  testResult.value = '';
  try {
    const result = await test({
      jobId: props.jobId,
      codeContent: codeContent.value,
      language: codeLanguage.value,
      params: testParams.value,
    });
    testResult.value = JSON.stringify(result, null, 2);
  } catch {
    testResult.value = '测试执行失败';
  } finally {
    testing.value = false;
  }
}

/** 版本回滚 */
async function handleRollback(version: GlueCodeVO): Promise<void> {
  if (!props.jobId || !version.version) return;
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ydszConfirm(`确定回滚到版本 ${version.version} 吗？`, { title: '回滚确认', type: 'warning' });
  } catch {
    return; // 用户主动取消回滚操作
  }
  // 步骤2：执行回滚 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await rollback({
      jobId: props.jobId,
      version: version.version,
    });
    showToast.success('回滚成功');
    await loadLatest();
    await loadVersions();
  } catch {
    // 错误已由请求拦截器展示，无需重复处理
  }
}

/** 查看版本差异 */
async function handleDiff(versionA: number, versionB: number): Promise<void> {
  if (!props.jobId) return;
  try {
    await diff({ jobId: props.jobId, versionA, versionB });
    showToast.info('差异对比功能开发中');
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

watch(activeTab, (tab) => {
  if (tab === 'versions') {
    loadVersions();
  }
});

onMounted(() => {
  if (props.jobId) {
    loadLatest();
  }
});
</script>

<template>
  <Modal title="GLUE 代码编辑器" width="900px">
    <Tabs v-model="activeTab">
      <TabsList class="mt-2">
        <TabsTrigger value="editor">代码编辑</TabsTrigger>
        <TabsTrigger value="versions">版本管理</TabsTrigger>
        <TabsTrigger value="test">测试执行</TabsTrigger>
      </TabsList>
      <!-- 代码编辑 -->
      <TabsContent value="editor">
        <div class="editor-container mt-3">
          <div class="mb-3 flex items-center gap-3">
            <Select v-model="codeLanguage">
              <SelectTrigger class="w-32" placeholder="语言" />
              <SelectContent>
                <SelectItem v-for="opt in languageOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" @click="loadTemplate">加载模板</Button>
            <span v-if="currentVersion > 0" class="text-xs text-gray-500">当前版本：v{{ currentVersion }}</span>
          </div>
          <div class="code-editor-wrapper">
            <textarea
              v-model="codeContent"
              class="code-editor"
              :placeholder="`请输入 ${codeLanguage.toUpperCase()} 代码...`"
              spellcheck="false"
            />
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <Button variant="outline" @click="modalApi.close()">取消</Button>
            <Button :disabled="saving" @click="handleSave">
              <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
              保存
            </Button>
          </div>
        </div>
      </TabsContent>

      <!-- 版本管理 -->
      <TabsContent value="versions">
        <div class="mt-3">
          <div v-if="versionList.length === 0" class="py-8 text-center text-gray-400">暂无版本记录</div>
          <div
            v-for="version in versionList"
            :key="version.version"
            class="mb-2 flex items-center justify-between rounded border p-3"
          >
            <div>
              <p class="text-sm font-medium">版本 v{{ version.version }}</p>
              <p class="text-xs text-gray-500">{{ version.createdAt }}</p>
              <p v-if="version.remark" class="mt-1 text-xs text-gray-600">{{ version.remark }}</p>
            </div>
            <div class="flex gap-2">
              <Button size="sm" variant="outline" @click="handleDiff(version.version ?? 0, (version.version ?? 0) - 1)">对比</Button>
              <Button size="sm" variant="destructive" @click="handleRollback(version)">回滚</Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- 测试执行 -->
      <TabsContent value="test">
        <div class="mt-3">
          <ElForm label-width="80px">
            <ElFormItem label="测试参数">
              <Textarea v-model="testParams" placeholder="请输入测试参数（JSON格式，选填）" :rows="3" />
            </ElFormItem>
          </ElForm>
          <div class="mb-3 flex justify-end">
            <Button :disabled="testing" @click="handleTest">
              <Loader2 v-if="testing" class="mr-2 h-4 w-4 animate-spin" />
              执行测试
            </Button>
          </div>
          <div v-if="testResult" class="rounded border bg-gray-50 p-3">
            <p class="mb-1 text-xs font-medium text-gray-600">测试结果：</p>
            <pre class="overflow-auto whitespace-pre-wrap text-sm">{{ testResult }}</pre>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </Modal>
</template>

<style scoped>
.editor-container {
  min-height: 400px;
}

.code-editor-wrapper {
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  overflow: hidden;
}

.code-editor {
  width: 100%;
  min-height: 350px;
  padding: 12px;
  font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  border: none;
  outline: none;
  resize: vertical;
  background: #fafafa;
}
</style>
