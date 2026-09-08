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
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';

const logger = createLogger('workflow-delegate');
const { t } = useI18n();
defineOptions({ name: 'DelegateManagement' });

/** 授权状态是否启用（兼容字符串/数字取值，未知值按启用处理） */
function isEnabled(row: FlowDelegateAuthVO): boolean {
  const status = row.authStatus ?? '';
  return !(status.toUpperCase() === 'DISABLED' || status === 'REVOKED' || status === '0');
}

/** 授权状态标签 */
function statusTag(row: FlowDelegateAuthVO) {
  return isEnabled(row)
    ? h(ElTag, { type: 'success' }, () => t('delegate.enabled'))
    : h(ElTag, { type: 'info' }, () => t('delegate.disabled'));
}

const myGridOptions: VxeGridProps<FlowDelegateAuthVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'delegateUserName', title: t('delegate.targetUser'), width: 110 },
    { field: 'scopeType', title: t('delegate.scopeType'), width: 100 },
    { field: 'flowCode', title: t('wf.flowCode'), width: 120 },
    { field: 'nodeCode', title: t('delegate.nodeCode'), width: 110 },
    { field: 'startTime', title: t('delegate.startTime'), width: 160 },
    { field: 'endTime', title: t('delegate.endTime'), width: 160 },
    {
      field: 'authStatus',
      title: t('common.status'),
      width: 90,
      slots: { default: ({ row }) => statusTag(row) },
    },
    { field: 'reason', title: t('delegate.reason'), width: 140, showOverflow: 'title' },
    {
      field: 'action',
      title: t('common.action'),
      width: 150,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              {
                size: 'small',
                link: true,
                type: isEnabled(row) ? 'warning' : 'success',
                onClick: () => handleToggle(row),
              },
              () => (isEnabled(row) ? t('common.disable') : t('common.enable')),
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleRevoke(row) },
              () => t('common.revoke'),
            ),
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
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'ownerUserName', title: t('delegate.ownerUser'), width: 110 },
    { field: 'scopeType', title: t('delegate.scopeType'), width: 100 },
    { field: 'flowCode', title: t('wf.flowCode'), width: 120 },
    { field: 'nodeCode', title: t('delegate.nodeCode'), width: 110 },
    { field: 'startTime', title: t('delegate.startTime'), width: 160 },
    { field: 'endTime', title: t('delegate.endTime'), width: 160 },
    {
      field: 'authStatus',
      title: t('common.status'),
      width: 90,
      slots: { default: ({ row }) => statusTag(row) },
    },
    { field: 'reason', title: t('delegate.reason'), width: 140, showOverflow: 'title' },
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
  delegateUserId: [{ required: true, message: t('delegate.targetUserId.required'), trigger: 'blur' }],
  delegateUserName: [{ required: true, message: t('delegate.targetUserName.required'), trigger: 'blur' }],
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
  } catch (error) {
    logger.warn('委托授权表单验证失败', error);
    return;
  }
  creating.value = true;
  try {
    await createDelegateAuth(createForm);
    ElMessage.success(t('delegate.create.success'));
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
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ElMessageBox.confirm(
      t('delegate.toggle.confirm', { action: next === 'DISABLED' ? t('common.disable') : t('common.enable') }),
      t('common.confirmTitle'),
      { type: 'warning' },
    );
  } catch (error) {
    logger.warn('用户取消切换委托授权状态操作', error);
    return; // 用户主动取消操作
  }
  // 步骤2：执行状态切换 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await updateDelegateAuthStatus({ id: row.id }, { status: next });
    ElMessage.success(t('common.operationSuccess'));
    myGridApi.query();
  } catch (error) {
    logger.warn('切换委托授权状态失败，详见拦截器提示', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}

/** 撤销委托授权 */
async function handleRevoke(row: FlowDelegateAuthVO) {
  if (!row.id) return;
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ElMessageBox.confirm(t('delegate.revoke.confirm', { userName: row.delegateUserName }), t('common.revoke.confirmTitle'), {
      type: 'warning',
    });
  } catch (error) {
    logger.warn('用户取消撤销委托授权操作', error);
    return; // 用户主动取消撤销操作
  }
  // 步骤2：执行撤销 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await revokeDelegateAuth({ id: row.id });
    ElMessage.success(t('delegate.revoke.success'));
    myGridApi.query();
  } catch (error) {
    logger.warn('撤销委托授权失败，详见拦截器提示', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}
</script>
<template>
  <Page auto-content-height>
    <ElTabs class="px-4 pt-2">
      <ElTabPane :label="t('delegate.myAuths')" name="mine">
        <MyGrid :table-title="t('delegate.myAuths')">
          <template #toolbar-tools>
            <ElButton type="primary" @click="handleAdd">{{ t('delegate.add') }}</ElButton>
          </template>
        </MyGrid>
      </ElTabPane>
      <ElTabPane :label="t('delegate.asDelegate')" name="as-delegate">
        <AsDelegateGrid :table-title="t('delegate.asDelegate')" />
      </ElTabPane>
    </ElTabs>
    <ElDialog v-model="createVisible" :title="t('delegate.add.title')" width="520px">
      <ElForm
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="110px"
        label-position="right"
      >
        <ElFormItem :label="t('delegate.targetUserId.label')" prop="delegateUserId">
          <ElInput v-model="createForm.delegateUserId" :placeholder="t('delegate.targetUserId.placeholder')" />
        </ElFormItem>
        <ElFormItem :label="t('delegate.targetUserName.label')" prop="delegateUserName">
          <ElInput v-model="createForm.delegateUserName" :placeholder="t('delegate.targetUserName.placeholder')" />
        </ElFormItem>
        <ElFormItem :label="t('delegate.scopeType.label')">
          <ElSelect v-model="createForm.scopeType" :placeholder="t('delegate.scopeType.placeholder')">
            <ElOption :label="t('delegate.scopeType.all')" value="ALL" />
            <ElOption :label="t('delegate.scopeType.flow')" value="FLOW" />
            <ElOption :label="t('delegate.scopeType.node')" value="NODE" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="t('wf.flowCode')">
          <ElInput
            v-model="createForm.flowCode"
            :placeholder="t('delegate.flowCode.placeholder')"
          />
        </ElFormItem>
        <ElFormItem :label="t('delegate.startTime.label')">
          <ElDatePicker
            v-model="createForm.startTime"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="t('delegate.startTime.placeholder')"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem :label="t('delegate.endTime.label')">
          <ElDatePicker
            v-model="createForm.endTime"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="t('delegate.endTime.placeholder')"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem :label="t('delegate.reason.label')">
          <ElInput
            v-model="createForm.reason"
            type="textarea"
            :rows="2"
            :placeholder="t('delegate.reason.placeholder')"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="creating" @click="handleCreate">{{ t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
