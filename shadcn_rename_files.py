#!/usr/bin/env python3
"""
重命名 components/ 下的 .vue 文件，使其与 Yd 前缀的导出名匹配
"""

import os

BASE = "D:/Code/open/ydsz-micro/comm/@core/ui-kit/shadcn-ui/src/components"

# 文件名重命名映射：(子目录, 旧文件名, 新文件名)
FILE_RENAMES = [
    ("advanced-filter", "AdvancedFilterBar.vue", "YdAdvancedFilterBar.vue"),
    ("avatar", "avatar.vue", "YdAvatar.vue"),
    ("back-top", "back-top.vue", "YdBackTop.vue"),
    ("breadcrumb", "breadcrumb-view.vue", "YdBreadcrumbView.vue"),
    ("breadcrumb", "breadcrumb.vue", "YdBreadcrumbView.vue"),  # 删除重复
    ("button", "button.vue", "YdButton.vue"),
    ("button", "button-group.vue", "YdButtonGroup.vue"),
    ("button", "check-button-group.vue", "YdCheckButtonGroup.vue"),
    ("button", "icon-button.vue", "YdIconButton.vue"),
    ("checkbox", "checkbox.vue", "YdCheckbox.vue"),
    ("context-help", "ContextHelp.vue", "YdContextHelp.vue"),
    ("context-menu", "context-menu.vue", "YdContextMenu.vue"),
    ("count-to-animator", "count-to-animator.vue", "YdCountToAnimator.vue"),
    ("dashboard", "DashboardGrid.vue", "YdDashboardGrid.vue"),
    ("dashboard", "MiniChart.vue", "YdMiniChart.vue"),
    ("dashboard", "StatCard.vue", "YdStatCard.vue"),
    ("domain-filter", "DomainFilterPanel.vue", "YdDomainFilterPanel.vue"),
    ("dropdown-menu", "dropdown-menu.vue", "YdDropdownMenu.vue"),
    ("dropdown-menu", "dropdown-radio-menu.vue", "YdDropdownRadioMenu.vue"),
    ("empty-state", "EmptyState.vue", "YdEmptyState.vue"),
    ("entity-card", "CardGrid.vue", "YdCardGrid.vue"),
    ("entity-card", "EntityCard.vue", "YdEntityCard.vue"),
    ("expandable-arrow", "expandable-arrow.vue", "YdExpandableArrow.vue"),
    ("full-screen", "full-screen.vue", "YdFullScreen.vue"),
    ("hover-card", "hover-card.vue", "YdHoverCard.vue"),
    ("icon", "icon.vue", "YdIcon.vue"),
    ("input-password", "input-password.vue", "YdInputPassword.vue"),
    ("logo", "logo.vue", "YdLogo.vue"),
    ("notification", "notification-bell.vue", "YdNotificationBell.vue"),
    ("notification", "notification-panel.vue", "YdNotificationPanel.vue"),
    ("pin-input", "input.vue", "YdPinInput.vue"),
    ("popover", "popover.vue", "YdPopover.vue"),
    ("quick-create", "QuickCreateButton.vue", "YdQuickCreateButton.vue"),
    ("render-content", "render-content.vue", "YdRenderContent.vue"),
    ("scrollbar", "scrollbar.vue", "YdScrollbar.vue"),
    ("search", "global-search-panel.vue", "YdGlobalSearchPanel.vue"),
    ("segmented", "segmented.vue", "YdSegmented.vue"),
    ("select", "select.vue", "YdSelect.vue"),
    ("settings-float", "SettingsFloatButton.vue", "YdSettingsFloatButton.vue"),
    ("spine-text", "spine-text.vue", "YdSpineText.vue"),
    ("spinner", "loading.vue", "YdLoading.vue"),
    ("spinner", "spinner.vue", "YdSpinner.vue"),
    ("status-badge", "StatusBadge.vue", "YdStatusBadge.vue"),
    ("tooltip", "help-tooltip.vue", "YdHelpTooltip.vue"),
    ("tooltip", "tooltip.vue", "YdTooltip.vue"),
]

def main():
    success = 0
    fail = 0
    
    for subdir, old_name, new_name in FILE_RENAMES:
        old_path = os.path.join(BASE, subdir, old_name)
        new_path = os.path.join(BASE, subdir, new_name)
        
        if not os.path.exists(old_path):
            print(f"  SKIP (not found): {subdir}/{old_name}")
            continue
        if os.path.exists(new_path):
            print(f"  SKIP (exists): {subdir}/{new_name}")
            continue
        
        try:
            os.rename(old_path, new_path)
            success += 1
        except Exception as e:
            fail += 1
            print(f"  FAIL: {subdir}/{old_name} → {subdir}/{new_name}: {e}")
    
    print(f"\n成功: {success}, 失败: {fail}, 总计: {len(FILE_RENAMES)}")

if __name__ == '__main__':
    main()
