#!/bin/bash
# 视觉回归基线更新助手脚本
# 用法: bash bash/update-visual-baselines.sh
#
# 该脚本用于在本地更新视觉回归测试的基线截图。
# 当 CI 中视觉回归测试失败且确认 UI 变更是刻意的时候使用。
#
# 更新后会列出变更的基线文件，便于审查后提交。

set -euo pipefail

echo "============================================"
echo "  视觉回归基线更新助手 (Visual Baseline Updater)"
echo "============================================"
echo ""

# 检查 Playwright 浏览器是否已安装
echo "> 检查 Playwright Chromium 浏览器..."
if ! pnpm exec playwright install --dry-run chromium 2>/dev/null | grep -q "already installed"; then
  echo "  安装 Playwright Chromium..."
  pnpm exec playwright install chromium
else
  echo "  已安装，跳过。"
fi
echo ""

# 运行视觉回归基线更新
echo "> 运行 pnpm test:visual:update 更新基线截图..."
pnpm test:visual:update
echo ""

# 展示变更文件
echo "============================================"
echo "  基线变更审查 (Review Changes)"
echo "============================================"
echo ""
git status --short tests/visual/__screenshots__/
echo ""

# 检查是否有变更
if git diff --quiet tests/visual/__screenshots__/ && git diff --cached --quiet tests/visual/__screenshots__/; then
  echo "基线文件无变更（可能已是最新）。"
else
  echo "请审查以上差异，确认无误后执行："
  echo ""
  echo "  git add tests/visual/__screenshots__/"
  echo '  git commit -m "chore: update visual baselines"'
  echo ""
  echo "如有不预期的变更，请回滚："
  echo "  git checkout -- tests/visual/__screenshots__/"
fi
