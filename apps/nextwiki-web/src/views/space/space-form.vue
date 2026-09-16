<!--
 * 空间（表单组件）
 *
 * @path apps\nextwiki-web\src\views\space\space-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 空间（表单组件）
 * <p>新建空间表单，数据提交到后端契约 API space#createSpace（apps/nextwiki-web/src/api/space.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
import { ElForm, ElFormItem, ElInput, ElOption, ElRadioButton, ElRadioGroup, ElSelect } from 'element-plus';
const logger = createLogger('nextwiki-space');
const { t } = useI18n';
import { computed, onMounted, reactive, ref } from 'vue';
import { createSpace } from '#/api/space';
import { listTemplates, useTemplate } from '#/api/spaceTemplate';
import type { SpaceTemplateDTO } from '#/api/models';

defineOptions({ name: 'SpaceForm' });

const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 新建空间表单数据 */
interface SpaceFormData {
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  /** 是否使用模板创建 */
  useTemplateFlag: boolean;
  /** 选中的模板 ID */
  selectedTemplateId: string;
}

const formData = reactive<SpaceFormData>({
  name: '',
  description: '',
  visibility: 'PRIVATE',
  useTemplateFlag: false,
  selectedTemplateId: '',
});

/** 模板列表 */
const templateList = ref<SpaceTemplateDTO[]>([]);
const templateLoading = ref(false);

/** 提交按钮禁用：选中模板时无需填写名称 */
const canSubmit = computed(() => {
  if (formData.useTemplateFlag) {
    return Boolean(formData.selectedTemplateId);
  }
  return Boolean(formData.name);
});

const rules = {
  name: [{ required: () => !formData.useTemplateFlag, message: () => t('spaceNamePlaceholder'), trigger: 'blur' }],
};

/** 加载模板列表 */
async function loadTemplates(): Promise<void> {
  templateLoading.value = true;
  try {
    templateList.value = await listTemplates({});
  } catch (error) {
    logger.warn('加载空间模板列表失败: {}', error);
    templateList.value = [];
  } finally {
    templateLoading.value = false;
  }
}

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, {
      name: '',
      description: '',
      visibility: 'PRIVATE',
      useTemplateFlag: false,
      selectedTemplateId: '',
    });
    if (templateList.value.length === 0) {
      loadTemplates();
    }
  },
  onConfirm: async () => {
    if (!canSubmit.value) {
      if (formData.useTemplateFlag) {
        showToast.warning('请选择空间模板');
      }
      return;
    }
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.debug('表单校验未通过: {}', error);
      return;
    }
    modalApi.lock();
    try {
      if (formData.useTemplateFlag && formData.selectedTemplateId) {
        await useTemplate(
          { templateId: formData.selectedTemplateId },
          { name: formData.name || undefined, description: formData.description || undefined },
        );
      } else {
        await createSpace({ name: formData.name, description: formData.description, visibility: formData.visibility });
      }
      showToast.success('创建成功');
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="新建空间">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <!-- 创建方式切换 -->
      <ElFormItem label="创建方式">
        <ElRadioGroup v-model="formData.useTemplateFlag">
          <ElRadioButton :value="false">空白空间</ElRadioButton>
          <ElRadioButton :value="true">从模板创建</ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>

      <!-- 模板选择 -->
      <ElFormItem v-if="formData.useTemplateFlag" label="选择模板" prop="selectedTemplateId">
        <ElSelect
          v-model="formData.selectedTemplateId"
          :loading="templateLoading"
          placeholder="请选择空间模板"
          class="w-full"
        >
          <ElOption
            v-for="item in templateList"
            :key="item.id"
            :label="item.name ?? '未命名模板'"
            :value="item.id ?? ''"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem v-if="!formData.useTemplateFlag" label="空间名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入空间名称" />
      </ElFormItem>
      <ElFormItem label="空间描述" prop="description">
        <ElInput v-model="formData.description" placeholder="请输入空间描述（选填）" type="textarea" :rows="3" />
      </ElFormItem>
      <ElFormItem label="可见性" prop="visibility">
        <ElSelect v-model="formData.visibility" placeholder="请选择可见性">
          <ElOption label="私有" value="PRIVATE" />
          <ElOption label="公开" value="PUBLIC" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
