<!--
 * 偏好设置页面
 *
 * <p>提供当前登录用户的偏好设置：语言、主题、布局、通知偏好等。
 *
 * @path apps/userinfo-web/src/views/system/user-preference/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 偏好设置
 * <p>消费后端 UserPreferenceController（apps/userinfo-web/src/api/userPreference.ts）：
 * get() 获取偏好，save() 保存，reset() 重置。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import { ElButton, ElCard, ElCol, ElForm, ElFormItem, ElInput, ElOption, ElRadio, ElRadioGroup, ElRow, ElSelect, ElSwitch, type FormInstance } from 'element-plus';
import { reactive, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import { get, reset, save } from '#/api/userPreference';

defineOptions({ name: 'UserPreferenceManagement' });

const logger = createLogger('userinfo-preference');

const formRef = ref<FormInstance>();
const isLoading = ref(false);

// 表单数据（字段对应 UserPreferenceVO）
const formData = reactive({
  defaultIndex: '/dashboard',
  language: 'zh-CN',
  theme: 'light',
  themeColor: '#1890ff',
  menuLayout: 'vertical',
  accordionMenu: true,
  tableSize: 'medium',
  fontSize: 'medium',
});

const rules = {};

/** 语言选项 */
const LANGUAGE_OPTIONS = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

/** 主题选项 */
const THEME_OPTIONS = [
  { label: '浅色模式', value: 'light' },
  { label: '深色模式', value: 'dark' },
  { label: '跟随系统', value: 'auto' },
];

/** 菜单布局选项 */
const MENU_LAYOUT_OPTIONS = [
  { label: '垂直布局', value: 'vertical' },
  { label: '水平布局', value: 'horizontal' },
  { label: '混合布局', value: 'mix' },
];

/** 表格密度选项 */
const TABLE_SIZE_OPTIONS = [
  { label: '紧凑', value: 'small' },
  { label: '中等', value: 'medium' },
  { label: '宽松', value: 'large' },
];

/** 字体大小选项 */
const FONT_SIZE_OPTIONS = [
  { label: '较小', value: 'small' },
  { label: '默认', value: 'medium' },
  { label: '较大', value: 'large' },
];

/**
 * 加载偏好设置。
 */
async function loadPreferences(): Promise<void> {
  try {
    const data = await get();
    formData.defaultIndex = data.defaultIndex ?? '/dashboard';
    formData.language = data.language ?? 'zh-CN';
    formData.theme = data.theme ?? 'light';
    formData.themeColor = data.themeColor ?? '#1890ff';
    formData.menuLayout = data.menuLayout ?? 'vertical';
    formData.accordionMenu = data.accordionMenu ?? true;
    formData.tableSize = data.tableSize ?? 'medium';
    formData.fontSize = data.fontSize ?? 'medium';
  } catch (error) {
    logger.warn('加载偏好设置失败:', error);
  }
}

/**
 * 提交保存。
 */
async function handleSave(): Promise<void> {
  if (!formRef.value) {
    return;
  }
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  isLoading.value = true;
  try {
    await save({
      defaultIndex: formData.defaultIndex,
      language: formData.language,
      theme: formData.theme,
      themeColor: formData.themeColor,
      menuLayout: formData.menuLayout,
      accordionMenu: formData.accordionMenu,
      tableSize: formData.tableSize,
      fontSize: formData.fontSize,
    });
    showToast.success('偏好设置已保存');
  } catch {
    /* 错误由拦截器处理 */
  } finally {
    isLoading.value = false;
  }
}

/**
 * 重置为默认偏好。
 */
async function handleReset(): Promise<void> {
  try {
    await ydszConfirm('确定重置为默认偏好设置吗？当前自定义设置将被清除。', { title: '重置偏好', type: 'warning' });
  } catch {
    return;
  }
  try {
    const data = await reset();
    formData.defaultIndex = data.defaultIndex ?? '/dashboard';
    formData.language = data.language ?? 'zh-CN';
    formData.theme = data.theme ?? 'light';
    formData.themeColor = data.themeColor ?? '#1890ff';
    formData.menuLayout = data.menuLayout ?? 'vertical';
    formData.accordionMenu = data.accordionMenu ?? true;
    formData.tableSize = data.tableSize ?? 'medium';
    formData.fontSize = data.fontSize ?? 'medium';
    showToast.success('偏好设置已重置');
  } catch {
    /* 错误由拦截器处理 */
  }
}

// 初始化加载
loadPreferences();
</script>

<template>
  <Page auto-content-height>
    <ElCard shadow="never" class="mx-4 my-3">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium">偏好设置</span>
          <div class="flex gap-2">
            <ElButton @click="handleReset">重置默认</ElButton>
            <ElButton type="primary" :loading="isLoading" @click="handleSave">保存设置</ElButton>
          </div>
        </div>
      </template>

      <ElForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        label-position="right"
      >
        <ElRow :gutter="24">
          <ElCol :xs="24" :md="12">
            <ElFormItem label="默认首页" prop="defaultIndex">
              <ElInput v-model="formData.defaultIndex" placeholder="如 /dashboard" maxlength="128" />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :md="12">
            <ElFormItem label="语言设置" prop="language">
              <ElSelect v-model="formData.language" placeholder="选择语言" class="w-full">
                <ElOption
                  v-for="opt in LANGUAGE_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :md="12">
            <ElFormItem label="主题模式" prop="theme">
              <ElRadioGroup v-model="formData.theme">
                <ElRadio v-for="opt in THEME_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :md="12">
            <ElFormItem label="主题色" prop="themeColor">
              <ElInput v-model="formData.themeColor" placeholder="如 #1890ff" maxlength="16" />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :md="12">
            <ElFormItem label="菜单布局" prop="menuLayout">
              <ElSelect v-model="formData.menuLayout" placeholder="选择布局" class="w-full">
                <ElOption
                  v-for="opt in MENU_LAYOUT_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :md="12">
            <ElFormItem label="手风琴菜单" prop="accordionMenu">
              <ElSwitch
                v-model="formData.accordionMenu"
                active-text="开启"
                inactive-text="关闭"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :md="12">
            <ElFormItem label="表格密度" prop="tableSize">
              <ElSelect v-model="formData.tableSize" placeholder="选择密度" class="w-full">
                <ElOption
                  v-for="opt in TABLE_SIZE_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :md="12">
            <ElFormItem label="字体大小" prop="fontSize">
              <ElSelect v-model="formData.fontSize" placeholder="选择字体大小" class="w-full">
                <ElOption
                  v-for="opt in FONT_SIZE_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </ElCard>
  </Page>
</template>

<style lang="scss" scoped>
.mx-4 {
  margin-left: 16px;
  margin-right: 16px;
}

.my-3 {
  margin-top: 12px;
  margin-bottom: 12px;
}

.text-base {
  font-size: 16px;
}

.font-medium {
  font-weight: 500;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 8px;
}

.w-full {
  width: 100%;
}
</style>
