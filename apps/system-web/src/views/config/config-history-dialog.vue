<!--
 * 配置版本历史抽屉 — 展示指定配置的版本快照列表，支持查看快照、版本对比和回滚
 *
 * @path apps\system-web\src\views\config\config-history-dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 配置版本历史抽屉
 * <p>消费后端契约 ConfigVersionController（src/api/configVersion.ts，auto-generated）：
 * listByResourceKey() 查询版本历史，rollback() 回滚到指定版本。
 *
 * @author ydsz-team
 * @since 1.0.0
</script>