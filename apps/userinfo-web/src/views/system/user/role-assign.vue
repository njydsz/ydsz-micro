<!--
 * 用户角色分配弹窗 — 为用户分配或取消分配角色（穿梭框形式）
 *
 * @path apps\userinfo-web\src\views\system\user\role-assign.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 用户角色分配
 * <p>用户角色分配的弹窗组件，消费契约 assignRoles / getUserRoles
 * （src/api/userAccount.ts，auto-generated）：列表页打开前通过
 * modalApi.setData 传入 userId / username / roleList / selectedRoleIds，
 * 确认后调用 assignRoles({ userId }, { roleIds }) 提交，成功 emit('success')。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';

import { ElMessage, ElTransfer } from 'element-plus';
import { ref, watch } from 'vue';

import type { RoleVO } from '#/api/models';
import { assignRoles } from '#/api/userAccount';

const emit = defineEmits<{ success: [] }>();

const userId = ref('');
const username = ref('');
const roleList = ref<RoleVO[]>([]);
const selectedRoleIds = ref<string[]>([]);

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{
      userId?: string;
      username?: string;
      roleList?: RoleVO[];
      selectedRoleIds?: string[];
    }>();
    userId.value = data?.userId ?? '';
    username.value = data?.username ?? '';
    roleList.value = data?.roleList ?? [];
    selectedRoleIds.value = [...(data?.selectedRoleIds ?? [])];
  },
  onConfirm: async () => {
    modalApi.lock();
    try {
      await assignRoles({ userId: userId.value }, { roleIds: selectedRoleIds.value });
      ElMessage.success('角色分配成功');
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

/** 穿梭框可选项（角色列表 => { label, key }） */
const transferData = ref<{ label: string; key: string }[]>([]);

watch(
  roleList,
  (list) => {
    transferData.value = list
      .filter((role) => role.id)
      .map((role) => ({
        label: `${role.roleName ?? ''}${role.roleCode ? ` (${role.roleCode})` : ''}`,
        key: role.id as string,
      }));
  },
  { immediate: true },
);
</script>

<template>
  <Modal :title="`分配角色 - ${username}`" class="w-[600px]">
    <div class="py-4">
      <ElTransfer
        v-model="selectedRoleIds"
        :data="transferData"
        :titles="['可选角色', '已分配角色']"
        filterable
        filter-placeholder="搜索角色"
      />
    </div>
  </Modal>
</template>