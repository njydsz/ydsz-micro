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

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ydsz-core/ui-kit/shadcn-ui';
// TODO: ElForm/ElFormItem 为复杂迁移，暂保留 element-plus 导入
// TODO: ElSwitch 暂无对应 shadcn-ui 组件，保留 element-plus 导入
import { ElForm, ElFormItem, ElSwitch } from 'element-plus';

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
  <Dialog :open="dialogVisible" @update:open="handleClose">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
      </DialogHeader>
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="名称" prop="name">
          <Input v-model="form.name" placeholder="如 ydsz-cloud-dev" />
        </ElFormItem>
        <ElFormItem label="JDBC URL" prop="jdbcUrl">
          <Input
            v-model="form.jdbcUrl"
            placeholder="jdbc:mysql://localhost:3306/ydsz_cloud"
          />
        </ElFormItem>
        <ElFormItem label="用户名" prop="username">
          <Input v-model="form.username" placeholder="数据库用户名" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <Input
            v-model="form.password"
            type="password"
            placeholder="数据库密码"
          />
        </ElFormItem>
        <ElFormItem label="方言">
          <Select v-model="form.dialect">
            <SelectTrigger>
              <SelectValue placeholder="请选择数据库方言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in dialectOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </ElFormItem>
        <ElFormItem label="默认数据源">
          <ElSwitch v-model="form.defaultFlag" />
        </ElFormItem>
        <ElFormItem label="描述">
          <Input v-model="form.description" placeholder="可选描述信息" />
        </ElFormItem>
      </ElForm>
      <DialogFooter>
        <Button variant="secondary" @click="handleClose">取消</Button>
        <Button @click="handleSubmit">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
