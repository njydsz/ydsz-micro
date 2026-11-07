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
import {
  YdButton,
  YdCard,
  YdCardContent,
  YdCardHeader,
  YdCardTitle,
  YdForm,
  YdFormItem,
  YdInput,
  YdSelectItem,
  YdRadioGroupItem,
  YdRadioGroup,
  YdSelect,
  YdSwitch,
  type FormInstance,
} from '@ydsz-core/ydsz-ui';
import { Loader2 } from '@ydsz/icons';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { createLogger } from '@ydsz/utils';
import { showToast } from '@ydsz/notification';
import { YdConfirm } from '@ydsz-core/popup-ui';
import { get, reset, save } from '#/api/userPreference';

defineOptions({ name: 'UserPreferenceManagement' });

const logger = createLogger('userinfo-preference');
const { t } = useI18n();

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
  { label: t('preference.languageZhCn'), value: 'zh-CN' },
  { label: t('preference.languageEnUs'), value: 'en-US' },
];

/** 主题选项 */
const THEME_OPTIONS = [
  { label: t('preference.themeLight'), value: 'light' },
  { label: t('preference.themeDark'), value: 'dark' },
  { label: t('preference.themeAuto'), value: 'auto' },
];

/** 菜单布局选项 */
const MENU_LAYOUT_OPTIONS = [
  { label: t('preference.menuLayoutVertical'), value: 'vertical' },
  { label: t('preference.menuLayoutHorizontal'), value: 'horizontal' },
  { label: t('preference.menuLayoutMix'), value: 'mix' },
];

/** 表格密度选项 */
const TABLE_SIZE_OPTIONS = [
  { label: t('preference.tableSizeCompact'), value: 'small' },
  { label: t('preference.tableSizeMedium'), value: 'medium' },
  { label: t('preference.tableSizeLoose'), value: 'large' },
];

/** 字体大小选项 */
const FONT_SIZE_OPTIONS = [
  { label: t('preference.fontSizeSmall'), value: 'small' },
  { label: t('preference.fontSizeDefault'), value: 'medium' },
  { label: t('preference.fontSizeLarge'), value: 'large' },
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
    showToast.success(t('preference.saveSuccess'));
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
    await YdConfirm(t('preference.resetConfirm'), {
      title: t('preference.resetTitle'),
      type: 'warning',
    });
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
    showToast.success(t('preference.resetSuccess'));
  } catch {
    /* 错误由拦截器处理 */
  }
}

// 初始化加载
loadPreferences();
</script>

<template>
  <Page auto-content-height>
    <YdCard shadow="never" class="mx-4 my-3">
      <YdCardHeader class="flex flex-row items-center justify-between">
        <YdCardTitle class="text-base">{{ t('preference.title') }}</YdCardTitle>
        <div class="flex gap-2">
          <YdButton variant="ghost" @click="handleReset">
            {{ t('preference.resetDefault') }}
          </YdButton>
          <YdButton variant="default" :disabled="isLoading" @click="handleSave">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t('preference.save') }}
          </YdButton>
        </div>
      </YdCardHeader>
      <YdCardContent>
        <YdForm
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="120px"
          label-position="right"
        >
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <YdFormItem :label="t('preference.defaultIndex')" prop="defaultIndex">
                <YdInput
                  v-model="formData.defaultIndex"
                  :placeholder="t('preference.defaultIndexPlaceholder')"
                  maxlength="128"
                />
              </YdFormItem>
            </div>
            <div>
              <YdFormItem :label="t('preference.language')" prop="language">
                <YdSelect
                  v-model="formData.language"
                  :placeholder="t('preference.languagePlaceholder')"
                  class="w-full"
                >
                  <YdSelectItem
                    v-for="opt in LANGUAGE_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </YdSelect>
              </YdFormItem>
            </div>
            <div>
              <YdFormItem :label="t('preference.theme')" prop="theme">
                <YdRadioGroup v-model="formData.theme">
                  <YdRadioGroupItem
                    v-for="opt in THEME_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </YdRadioGroupItem>
                </YdRadioGroup>
              </YdFormItem>
            </div>
            <div>
              <YdFormItem :label="t('preference.themeColor')" prop="themeColor">
                <YdInput
                  v-model="formData.themeColor"
                  :placeholder="t('preference.themeColorPlaceholder')"
                  maxlength="16"
                />
              </YdFormItem>
            </div>
            <div>
              <YdFormItem :label="t('preference.menuLayout')" prop="menuLayout">
                <YdSelect
                  v-model="formData.menuLayout"
                  :placeholder="t('preference.menuLayoutPlaceholder')"
                  class="w-full"
                >
                  <YdSelectItem
                    v-for="opt in MENU_LAYOUT_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </YdSelect>
              </YdFormItem>
            </div>
            <div>
              <YdFormItem :label="t('preference.accordionMenu')" prop="accordionMenu">
                <YdSwitch
                  v-model="formData.accordionMenu"
                  :active-text="t('preference.enabled')"
                  :inactive-text="t('preference.disabled')"
                />
              </YdFormItem>
            </div>
            <div>
              <YdFormItem :label="t('preference.tableSize')" prop="tableSize">
                <YdSelect
                  v-model="formData.tableSize"
                  :placeholder="t('preference.tableSizePlaceholder')"
                  class="w-full"
                >
                  <YdSelectItem
                    v-for="opt in TABLE_SIZE_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </YdSelect>
              </YdFormItem>
            </div>
            <div>
              <YdFormItem :label="t('preference.fontSize')" prop="fontSize">
                <YdSelect
                  v-model="formData.fontSize"
                  :placeholder="t('preference.fontSizePlaceholder')"
                  class="w-full"
                >
                  <YdSelectItem
                    v-for="opt in FONT_SIZE_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </YdSelect>
              </YdFormItem>
            </div>
          </div>
        </YdForm>
      </YdCardContent>
    </YdCard>
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
