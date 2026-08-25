<!--
 * 文件评论（表单组件）
 *
 * @path apps\nextwiki-web\src\views\comment\comment-form.vue
 * @author ydsz-team
 * @since 1.0.0
 * @modified 4.2.0 接入 @提及：新增「提及用户」远程搜索多选，提交时写入 addComment 的 mentions（List&lt;String&gt;）。
-->
<script lang="ts" setup>
/**
 * 文件评论（表单组件）
 * <p>新增评论表单，数据提交到后端契约 API fileComment#addComment（apps/nextwiki-web/src/api/fileComment.ts）。
 * 提及用户（mentions）通过 userinfo 搜索接口（userSearch.ts）远程检索后以用户 ID 数组提交。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';
import { reactive, ref } from 'vue';
import { addComment } from '#/api/fileComment';
import { searchUsers } from '#/api/userSearch';
import type { UserSearchHit } from '#/api/userSearch';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();
/** 新增评论表单数据 */
interface CommentFormData {
  fileNodeId: string;
  content: string;
  /** 提及用户 ID 列表（提交时映射为 mentions: List&lt;String&gt;） */
  mentionIds: string[];
}
const formData = reactive<CommentFormData>({ fileNodeId: '', content: '', mentionIds: [] });

/** @提及远程搜索状态 */
const mentionOptions = ref<UserSearchHit[]>([]);
const mentionLoading = ref(false);

/** 展示用户选项：优先「名称（登录名）」，无标题时退回 ID */
function formatUserLabel(user: UserSearchHit): string {
  if (user.title && user.subtitle) return `${user.title}（${user.subtitle}）`;
  return user.title ?? user.id ?? '';
}

/** ElSelect remote 远程搜索用户 */
async function remoteSearchMention(keyword: string): Promise<void> {
  mentionLoading.value = true;
  try {
    const res = await searchUsers({ keyword, page: 1, pageSize: 50 });
    mentionOptions.value = res.hits ?? [];
  } catch {
    mentionOptions.value = [];
  } finally {
    mentionLoading.value = false;
  }
}

const rules = {
  fileNodeId: [{ required: true, message: '请输入文件节点ID', trigger: 'blur' }],
  content: [{ required: true, message: '请输入评论内容', trigger: 'blur' }],
};
const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { fileNodeId: '', content: '', mentionIds: [] });
    mentionOptions.value = [];
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      await addComment({
        ...formData,
        mentions: formData.mentionIds.length ? formData.mentionIds : undefined,
      });
      ElMessage.success('评论成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
</script>
<template>
  <Modal title="新增评论">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="文件节点ID" prop="fileNodeId">
        <ElInput v-model="formData.fileNodeId" placeholder="请输入文件节点ID" />
      </ElFormItem>
      <ElFormItem label="评论内容" prop="content">
        <ElInput v-model="formData.content" type="textarea" :rows="2" placeholder="请输入评论内容" />
      </ElFormItem>
      <ElFormItem label="提及用户" prop="mentionIds">
        <ElSelect
          v-model="formData.mentionIds"
          multiple
          filterable
          remote
          :remote-method="remoteSearchMention"
          :loading="mentionLoading"
          clearable
          placeholder="输入关键字搜索用户，选中即为 @提及（可为空）"
          class="w-full"
        >
          <ElOption
            v-for="user in mentionOptions"
            :key="user.id ?? user.title ?? ''"
            :label="formatUserLabel(user)"
            :value="user.id ?? ''"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>