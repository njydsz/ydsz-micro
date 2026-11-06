import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/Code/open/ydsz-micro';
const unique = JSON.parse(fs.readFileSync(path.join(ROOT, 'bash/__toast-unique.json'), 'utf8'));

/**
 * 生成通用 toast 词条。
 *
 * 策略：
 * - 「X成功」→ operation.success（通用）或 op.<action>.success（按动作细分）
 * - 「X失败」→ operation.failed
 * - 「请输入X」→ validation.required.<field>
 * - 「已X」→ 逐条保留
 * - 含插值 → 带占位符的词条
 */

/** 动作 → 英文 key 片段 */
const ACTION_MAP = {
  创建: 'create',
  新增: 'create',
  更新: 'update',
  保存: 'save',
  删除: 'delete',
  导入: 'import',
  导出: 'export',
  发布: 'publish',
  提交: 'submit',
  审核: 'audit',
  通过: 'approve',
  驳回: 'reject',
  复制: 'copy',
  粘贴: 'paste',
  加载: 'load',
  查询: 'query',
  搜索: 'search',
  刷新: 'refresh',
  重置: 'reset',
  上传: 'upload',
  下载: 'download',
  同步: 'sync',
  重试: 'retry',
  重放: 'replay',
  触发: 'trigger',
  启动: 'start',
  停止: 'stop',
  暂停: 'pause',
  恢复: 'resume',
  取消: 'cancel',
  清空: 'clear',
  绑定: 'bind',
  解绑: 'unbind',
  分配: 'assign',
  启用: 'enable',
  禁用: 'disable',
  连接: 'connect',
  断开: 'disconnect',
  测试: 'test',
  校验: 'validate',
  验证: 'verify',
  评估: 'evaluate',
  整合: 'integrate',
  生成: 'generate',
  解析: 'parse',
  部署: 'deploy',
  回滚: 'rollback',
  迁移: 'migrate',
  备份: 'backup',
  还原: 'restore',
  切换: 'switch',
  选择: 'select',
};

/** 字段 → 英文 key 片段 */
const FIELD_MAP = {
  名称: 'name',
  编码: 'code',
  类型: 'type',
  描述: 'description',
  标题: 'title',
  内容: 'content',
  参数: 'params',
  配置: 'config',
  地址: 'address',
  端口: 'port',
  账号: 'account',
  密码: 'password',
  关键词: 'keyword',
  时间: 'time',
  日期: 'date',
  状态: 'status',
  备注: 'remark',
  模型: 'model',
  提供商: 'provider',
  提示词: 'prompt',
  分享标题: 'shareTitle',
  对话ID: 'conversationId',
  对话id: 'conversationId',
  DSL内容: 'dslContent',
  记忆内容: 'memoryContent',
  ExecutionId: 'executionId',
  Trace: 'trace',
  Agent编码: 'agentCode',
  工作流名称: 'workflowName',
  模板编码: 'templateCode',
  模板名称: 'templateName',
};

/** 生成 key 映射：中文 → i18n key */
const keyMap = new Map();
const reverseMap = new Map(); // key → 中文

function pascalToCamel(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

for (const text of unique) {
  let key = null;

  // 1. 「请输入X」
  const mInput = text.match(/^请输入(.+)$/);
  if (mInput) {
    const field = mInput[1];
    const fk = FIELD_MAP[field] ?? FIELD_MAP[field.replace(/[（(].*$/, '')];
    if (fk) key = `validation.required.${fk}`;
  }

  // 2. 「X成功」/「X失败」
  if (!key) {
    const mSucc = text.match(/^(.+)成功$/);
    const mFail = text.match(/^(.+)失败$/);
    if (mSucc || mFail) {
      const action = (mSucc || mFail)[1];
      const ak = ACTION_MAP[action];
      const suffix = mSucc ? 'success' : 'failed';
      if (ak) key = `operation.${ak}.${suffix}`;
      else key = `operation.${suffix}`; // 兜底：通用
    }
  }

  // 3. 含插值的保留原文（不生成 key）
  if (!key && /\$\{/.test(text)) continue;

  if (key) {
    if (!reverseMap.has(key)) {
      reverseMap.set(key, text);
      keyMap.set(text, key);
    } else {
      // key 已存在但原文不同 → 跳过（避免一词多义冲突）
    }
  }
}

console.log('generated keys:', keyMap.size);
console.log('\n--- 示例 ---');
[...keyMap.entries()].slice(0, 15).forEach(([t, k]) => console.log(`${k}  <=  ${t}`));

fs.writeFileSync(
  path.join(ROOT, 'bash/__toast-key-map.json'),
  JSON.stringify([...keyMap.entries()], null, 0),
  'utf8',
);
fs.writeFileSync(
  path.join(ROOT, 'bash/__toast-keys-zh.json'),
  JSON.stringify([...reverseMap.entries()], null, 0),
  'utf8',
);
console.log('wrote key maps');
