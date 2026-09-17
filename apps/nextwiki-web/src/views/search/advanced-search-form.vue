<!--
 * 高级搜索表单组件
 *
 * @path apps\nextwiki-web\src\views\search\advanced-search-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 高级搜索表单组件
 * <p>提供文件类型、上传时间范围、标签等多条件组合搜索，
 * 数据提交到后端契约 API search#advancedSearch（apps/nextwiki-web/src/api/search.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
import { ElDatePicker, ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { advancedSearch } from '#/api/search';
import { listTags } from '#/api/tag';
import type { SearchResultVO, TagVO } from '#/api/models';

const logger = createLogger('nextwiki-search');
const { t } = useI18n();

const emit = defineEmits<{ success: [SearchResultVO] }>();

const formRef = ref();

/** 文件类型选项 */
const typeOptions = [
  { label: t('searchAll'), value: '' },
  { label: t('searchDocument'), value: 'DOCUMENT' },
  { label: t('searchImage'), value: 'IMAGE' },
  { label: t('searchVideo'), value: 'VIDEO' },
  { label: t('searchAudio'), value: 'AUDIO' },
  { label: t('searchOther'), value: 'OTHER' },
];

/** 高级搜索表单数据 */
interface AdvancedSearchFormData {
  rawInput: string;
  scope: string;
  startDate: string;
  endDate: string;
  tags: string[];
}
const formData = reactive<AdvancedSearchFormData>({
  rawInput: '',
  scope: '',
  startDate: '',
  endDate: '',
  tags: [],
});

const rules = {
  rawInput: [{ required: true, message: () => t('searchAdvancedKeywordRequired'), trigger: 'blur' }],
};

/** 标签列表 */
const tagList = ref<TagVO[]>([]);

/** 加载标签列表 */
async function loadTagList(): Promise<void> {
  try {
    tagList.value = await listTags();
  } catch (error) {
    logger.debug('加载标签列表失败: {}', error);
    tagList.value = [];
  }
}

onMounted(() => {
  void loadTagList();
});

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { rawInput: '', scope: '', startDate: '', endDate: '', tags: [] });
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.debug('表单校验未通过: {}', error);
      return;
    }
    modalApi.lock();
    try {
      const result = await advancedSearch({
        rawInput: formData.rawInput,
        scope: formData.scope || undefined,
        page: 1,
        pageSize: 20,
      });
      showToast.success(t('searchAdvancedSuccess'));
      emit('success', result);
      modalApi.close();
    } catch (error) {
      logger.warn('高级搜索失败: {}', error);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>
<template>
  <Modal :title="t('searchAdvancedTitle')">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="120px" label-position="right">
      <ElFormItem :label="t('searchAdvancedKeyword')" prop="rawInput">
        <ElInput v-model="formData.rawInput" :placeholder="t('searchAdvancedKeywordPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('searchAdvancedType')" prop="scope">
        <ElSelect v-model="formData.scope" clearable :placeholder="t('searchAdvancedTypePlaceholder')" class="w-full">
          <ElOption v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('searchAdvancedTimeRange')" prop="startDate">
        <ElDatePicker
          v-model="formData.startDate"
          type="datetime"
          :placeholder="t('searchAdvancedStartDatePlaceholder')"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="t('searchAdvancedEndDate')" prop="endDate">
        <ElDatePicker
          v-model="formData.endDate"
          type="datetime"
          :placeholder="t('searchAdvancedEndDatePlaceholder')"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="t('searchAdvancedTags')" prop="tags">
        <ElSelect v-model="formData.tags" multiple clearable :placeholder="t('searchAdvancedTagsPlaceholder')" class="w-full">
          <ElOption v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
