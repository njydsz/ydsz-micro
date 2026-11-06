/**
 * require-script-setup 规则 — SFC 必须使用 `<script lang="ts" setup>`。
 *
 * <p>对应《云顶编码规范》SFC-001：必须 `<script lang="ts" setup>`；
 * 仅在确实需要普通 `<script>` 块（如声明 name / 继承属性）时允许并存，
 * 但不允许**单独**使用普通 `<script>` 块承载全部逻辑。
 *
 * <p>豁免：测试文件、story 文件、以及仅含类型声明的 `.d.ts.vue`。
 *
 * @path conf/lint-configs/eslint-plugin-ydsz-ui/rules/require-script-setup.mjs
 * @author ydsz-team
 * @since 26.11.06
 */

const SKIP_FILES = ['.test.', '.spec.', '.stories.', '.story.'];

export default {
  meta: {
    docs: {
      category: 'ydsz-ui',
      description: 'SFC 必须使用 script setup（SFC-001）',
    },
    messages: {
      missingSetup: 'SFC 缺少 `<script setup>` 块，请改为 `<script lang="ts" setup>`（SFC-001）。',
      missingLangTs: '`<script setup>` 缺少 `lang="ts"`，请补上（SFC-001）。',
    },
    schema: [],
    type: 'problem',
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? '';

    if (SKIP_FILES.some((p) => filename.includes(p))) return {};
    if (!filename.endsWith('.vue')) return {};

    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const text = sourceCode.getText();

    // 收集所有 <script> 开标签
    const scriptTags = [...text.matchAll(/<script([^>]*)>/g)];
    if (scriptTags.length === 0) {
      return {};
    }

    const hasSetup = scriptTags.some((m) => /\bsetup\b/.test(m[1]));
    const hasLangTs = scriptTags.some((m) => /lang\s*=\s*["']ts["']/.test(m[1]));

    return {
      'Program:exit'() {
        if (!hasSetup) {
          context.report({ messageId: 'missingSetup', loc: { line: 1, column: 1 } });
          return;
        }
        if (!hasLangTs) {
          context.report({ messageId: 'missingLangTs', loc: { line: 1, column: 1 } });
        }
      },
    };
  },
};
