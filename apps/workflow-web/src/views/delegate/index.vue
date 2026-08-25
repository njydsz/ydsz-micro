<!--
 * 流程委托（列表页）
 *
 * @path apps\workflow-web\src\views\delegate\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程委托（列表页）
 * <p>消费后端契约 FlowTaskController 的委托授权接口（src/api/flowTask.ts，auto-generated）：
 * 「我的委托授权」listMyDelegateAuths()（撤销 revokeDelegateAuth、启停 updateDelegateAuthStatus、
 * 内联弹窗新增 createDelegateAuth）；「作为被委托人」listAsDelegate() 只读展示。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTabs,
  ElTabPane,
  ElTag,
} from 'element-plus';
import { h, reactive, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  createDelegateAuth,
  listAsDelegate,
  listMyDelegateAuths,
  revokeDelegateAuth,
  updateDelegateAuthStatus,
} from '#/api/flowTask';
import type { FlowDelegateAuthPostDTO, FlowDelegateAuthVO } from '#/api/models';

defineOptions({ name: 'DelegateManagement' });

/** 授权状态是否启用（兼容字符串/数字取值，未知值按启用处理） */
function isEnabled(row: FlowDelegateAuthVO): boolean {
  const status = row.authStatus ?? '';
  return !(status.toUpperCase() === 'DISABLED' || status === 'REVOKED' || status === '0');
}

/** 授权状态标签 */
function statusTag(row: FlowDelegateAuthVO) {
  return isEnabled(row) ? h(ElTag, { type: 'success' }, () => '启用中') : h(ElTag, { type: 'info' }, () => '已停用');
}

const myGridOptions: VxeGridProps<FlowDelegateAuthVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'delegateUserName', title: '被委托人', width: 110 },
    { field: 'scopeType', title: '范围类型', width: 100 },
    { field: 'flowCode', title: '流程编码', width: 120 },
    { field: 'nodeCode', title: '节点编码', width: 110 },
    { field: 'startTime', title: '开始时间', width: 160 },
    { field: 'endTime', title: '结束时间', width: 160 },
    {
      field: 'authStatus', title: '状态', width: 90,
      slots: { default: ({ row }) => statusTag(row) },
    },
    { field: 'reason', title: '委托原因', width: 140, showOverflow: 'title' },
    {
      field: 'action', title: '操作', width: 150, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: isEnabled(row) ? 'warning' : 'success', onClick: () => handleToggle(row) }, () => (isEnabled(row) ? '停用' : '启用')),
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleRevoke(row) }, () => '撤销'),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      // listMyDelegateAuths() 为全量非分页接口
      query: async () => {
        const items = (await listMyDelegateAuths({})) ?? [];
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const asDelegateGridOptions: VxeGridProps<FlowDelegateAuthVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'ownerUserName', title: '委托人', width: 110 },
    { field: 'scopeType', title: '范围类型', width: 100 },
    { field: 'flowCode', title: '流程编码', width: 120 },
    { field: 'nodeCode', title: '节点编码', width: 110 },
    { field: 'startTime', title: '开始时间', width: 160 },
    { field: 'endTime', title: '结束时间', width: 160 },
    {
      field: 'authStatus', title: '状态', width: 90,
      slots: { default: ({ row }) => statusTag(row) },
    },
    { field: 'reason', title: '委托原因', width: 140, showOverflow: 'title' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      // listAsDelegate() 为全量非分页接口
      query: async () => {
        const items = (await listAsDelegate({})) ?? [];
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [MyGrid, myGridApi] = useYDSZVxeGrid({ gridOptions: myGridOptions });
const [AsDelegateGrid] = useYDSZVxeGrid({ gridOptions: asDelegateGridOptions });

/** 新增委托弹窗状态 */
const createVisible = ref(false);
const createFormRef = ref();
const creating = ref(false);
const createForm = reactive<FlowDelegateAuthPostDTO>({
  delegateUserId: '',
  delegateUserName: '',
  scopeType: 'ALL',
  flowCode: '',
  startTime: '',
  endTime: '',
  reason: '',
});

const createRules = {
  delegateUserId: [{ required: true, message: '请输入被委托人ID', trigger: 'blur' }],
  delegateUserName: [{ required: true, message: '请输入被委托人姓名', trigger: 'blur' }],
};

/** 打开新增委托弹窗 */
function handleAdd() {
  Object.assign(createForm, {
    delegateUserId: '',
    delegateUserName: '',
    scopeType: 'ALL',
    flowCode: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  createVisible.value = true;
}

/** 新增委托授权 */
async function handleCreate() {
  try {
    await createFormRef.value?.validate();
  } catch {
    return;
  }
  creating.value = true;
  try {
    await createDelegateAuth(createForm);
    ElMessage.success('委托授权创建成功');
    createVisible.value = false;
    myGridApi.query();
  } finally {
    creating.value = false;
  }
}

/** 启用/停用委托授权 */
async function handleToggle(row: FlowDelegateAuthVO) {
  if (!row.id) return;
  const next = isEnabled(row) ? 'DISABLED' : 'ENABLED';
  try {
    await ElMessageBox.confirm(`确定${next === 'DISABLED' ? '停用' : '启用'}该委托授权吗？`, '确认', { type: 'warning' });
    await updateDelegateAuthStatus({ id: row.id }, { status: next });
    ElMessage.success('操作成功');
    myGridApi.query();
  } catch {
    // 用户取消或请求失败
  }
}

/** 撤销委托授权 */
async function handleRevoke(row: FlowDelegateAuthVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定撤销给「${row.delegateUserName}」的委托授权吗？`, '撤销确认', { type: 'warning' });
    await revokeDelegateAuth({ id: row.id });
    ElMessage.success('已撤销');
    myGridApi.query();
  } catch {
    // 用户取消或请求失败
  }
}
</script>
<template>
  <Page auto-content-height>
    <ElTabs class="px-4 pt-2">
      <ElTabPane label="我的委托授权" name="mine">
        <MyGrid table-title="我的委托授权">
          <template #toolbar-tools>
            <ElButton type="primary" @click="handleAdd">新增委托</ElButton>
          </template>
        </MyGrid>
      </ElTabPane>
      <ElTabPane label="作为被委托人" name="as-delegate">
        <AsDelegateGrid table-title="作为被委托人" />
      </ElTabPane>
    </ElTabs>
    <ElDialog v-model="createVisible" title="新增委托授权" width="520px">
      <ElForm ref="createFormRef" :model="createForm" :rules="createRules" label-width="110px" label-position="right">
        <ElFormItem label="被委托人ID" prop="delegateUserId">
          <ElInput v-model="createForm.delegateUserId" placeholder="请输入被委托人用户 ID" />
        </ElFormItem>
        <ElFormItem label="被委托人姓名" prop="delegateUserName">
          <ElInput v-model="createForm.delegateUserName" placeholder="请输入被委托人姓名" />
        </ElFormItem>
        <ElFormItem label="范围类型">
          <ElSelect v-model="createForm.scopeType" placeholder="请选择授权范围">
            <ElOption label="全部流程" value="ALL" />
            <ElOption label="指定流程" value="FLOW" />
            <ElOption label="指定节点" value="NODE" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="流程编码">
          <ElInput v-model="createForm.flowCode" placeholder="范围类型为 FLOW/NODE 时填写（可选）" />
        </ElFormItem>
        <ElFormItem label="开始时间">
          <ElDatePicker v-model="createForm.startTime" type="date" value-format="YYYY-MM-DD" placeholder="委托开始日期（可选）" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="结束时间">
          <ElDatePicker v-model="createForm.endTime" type="date" value-format="YYYY-MM-DD" placeholder="委托结束日期（可选）" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="委托原因">
          <ElInput v-model="createForm.reason" type="textarea" :rows="2" placeholder="请输入委托原因（可选）" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="creating" @click="handleCreate">确定</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>