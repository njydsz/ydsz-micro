<!--
 * 数据源表单对话框
 *
 * <p>新建/编辑数据源配置。
 *
 * @path apps/generator-web/src/views/datasource/datasource-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 数据源表单组件。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, reactive, ref } from 'vue';

import { YdButtonBase, YdDialog, YdDialogContent, YdDialogFooter, YdDialogHeader, YdDialogTitle, YdInput, YdSelectBase, YdSelectContentBase, YdSelectItemBase, YdSelectTriggerBase, YdSelectValueBase, YdSwitch, YdForm, YdFormItem } from '@ydsz-core/ydsz-ui';

import type { GenDatasource } from '#/api/models';

defineOptions({ name: 'DatasourceForm' });

const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();

const form = reactive<GenDatasource>({
  id: undefined,
  name: '',
  jdbcUrl: '',
  username: '',
  password: '',
  dialect: 'MYSQL',
  defaultFlag: false,
  description: '',
});

const dialectOptions = [
  { label: 'MySQL', value: 'MYSQL' },
  { label: 'PostgreSQL', value: 'POSTGRESQL' },
  { label: 'Oracle', value: 'ORACLE' },
  { label: 'SQL Server', value: 'SQLSERVER' },
];

const rules = {
  name: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  jdbcUrl: [{ required: true, message: '请输入 JDBC URL', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

function open(data?: { record: GenDatasource | null }) {
  dialogVisible.value = true;
  if (data?.record) {
    dialogTitle.value = '编辑数据源';
    Object.assign(form, data.record);
  } else {
    dialogTitle.value = '新建数据源';
    Object.assign(form, {
      id: undefined,
      name: '',
      jdbcUrl: '',
      username: '',
      password: '',
      dialect: 'MYSQL',
      defaultFlag: false,
      description: '',
    });
  }
}

defineExpose({ open });

const emit = defineEmits<{
  submit: [data: GenDatasource];
  success: [];
}>();

function handleClose() {
  dialogVisible.value = false;
}

async function handleSubmit() {
  await formRef.value?.validate();
  emit('submit', { ...form });
  emit('success');
  handleClose();
}

onMounted(() => {});
</script>

<template>
  <YdDialog :open="dialogVisible" @update:open="handleClose">
    <YdDialogContent>
      <YdDialogHeader>
        <YdDialogTitle>{{ dialogTitle }}</YdDialogTitle>
      </YdDialogHeader>
      <YdForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <YdFormItem label="名称" prop="name">
          <YdInput v-model="form.name" placeholder="如 ydsz-cloud-dev" />
        </YdFormItem>
        <YdFormItem label="JDBC URL" prop="jdbcUrl">
          <YdInput
            v-model="form.jdbcUrl"
            placeholder="jdbc:mysql://localhost:3306/ydsz_cloud"
          />
        </YdFormItem>
        <YdFormItem label="用户名" prop="username">
          <YdInput v-model="form.username" placeholder="数据库用户名" />
        </YdFormItem>
        <YdFormItem label="密码" prop="password">
          <YdInput
            v-model="form.password"
            type="password"
            placeholder="数据库密码"
          />
        </YdFormItem>
        <YdFormItem label="方言">
          <YdSelectBase v-model="form.dialect">
            <YdSelectTriggerBase>
              <YdSelectValueBase placeholder="请选择数据库方言" />
            </YdSelectTriggerBase>
            <YdSelectContentBase>
              <YdSelectItemBase
                v-for="opt in dialectOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </YdSelectItemBase>
            </YdSelectContentBase>
          </YdSelectBase>
        </YdFormItem>
        <YdFormItem label="默认数据源">
          <YdSwitch :checked="form.defaultFlag" @update:checked="form.defaultFlag = $event" />
        </YdFormItem>
        <YdFormItem label="描述">
          <YdInput v-model="form.description" placeholder="可选描述信息" />
        </YdFormItem>
      </YdForm>
      <YdDialogFooter>
        <YdButtonBase variant="secondary" @click="handleClose">取消</YdButtonBase>
        <YdButtonBase @click="handleSubmit">确定</YdButtonBase>
      </YdDialogFooter>
    </YdDialogContent>
  </YdDialog>
</template>
