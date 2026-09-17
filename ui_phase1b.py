#!/usr/bin/env python3
import os, glob
BASE = "D:/Code/open/ydsz-micro"

# 文件重命名
RENAMES = [
    ("comm/effects/common-ui/src/components", "error-boundary.vue", "YdErrorBoundary.vue"),
    ("comm/effects/common-ui/src/components", "error-feedback.vue", "YdErrorFeedback.vue"),
    ("comm/effects/common-ui/src/components", "error-state.vue", "YdErrorState.vue"),
    ("comm/effects/common-ui/src/components", "network-status.vue", "YdNetworkStatus.vue"),
    ("comm/effects/common-ui/src/components", "empty-state.vue", "YdCommonEmptyState.vue"),
    ("comm/effects/common-ui/src/components/col-page", "col-page.vue", "YdColPage.vue"),
    ("comm/effects/common-ui/src/components/count-to", "count-to.vue", "YdCountTo.vue"),
    ("comm/effects/common-ui/src/components/ellipsis-text", "ellipsis-text.vue", "YdEllipsisText.vue"),
    ("comm/effects/common-ui/src/components/json-viewer", "json-viewer.vue", "YdJsonViewer.vue"),
    ("comm/effects/common-ui/src/components/icon-picker", "icon-picker.vue", "YdIconPicker.vue"),
    ("comm/effects/common-ui/src/components/tippy", "directive.ts", "yd-tippy.ts"),
    ("comm/effects/common-ui/src/components/watermark", "directive.ts", "yd-watermark.ts"),
    ("comm/effects/common-ui/src/components/watermark", "use-watermark.ts", "useYdWatermark.ts"),
    ("comm/effects/common-ui/src/components/safe-html", "index.ts", "yd-safe-html.ts"),
    ("comm/effects/common-ui/src/components/api-component", "api-component.vue", "YdApiComponent.vue"),
    ("comm/effects/common-ui/src/components/captcha/point-selection-captcha", "index.vue", "YdPointSelectionCaptcha.vue"),
    ("comm/effects/common-ui/src/components/captcha/point-selection-captcha", "point-selection-captcha-card.vue", "YdPointSelectionCaptchaCard.vue"),
    ("comm/effects/common-ui/src/components/captcha/slider-captcha", "slider-captcha-content.vue", "YdSliderCaptchaContent.vue"),
    ("comm/effects/common-ui/src/components/captcha/slider-captcha", "slider-captcha-action.vue", "YdSliderCaptchaAction.vue"),
    ("comm/effects/common-ui/src/components/captcha/slider-rotate-captcha", "index.vue", "YdSliderRotateCaptcha.vue"),
    ("comm/effects/common-ui/src/components/captcha/slider-translate-captcha", "index.vue", "YdSliderTranslateCaptcha.vue"),
    ("comm/effects/common-ui/src/components/skeleton", "skeleton.vue", "YdSkeleton.vue"),
    ("comm/effects/common-ui/src/components/loading", "loading.vue", "YdPageLoading.vue"),
    ("comm/effects/common-ui/src/components/loading", "spinner.vue", "YdPageSpinner.vue"),
    ("comm/effects/common-ui/src/components/page-status", "page-status.vue", "YdPageStatus.vue"),
    ("comm/effects/common-ui/src/components/resize", "v-resize.vue", "YdVResize.vue"),
    ("comm/effects/shared-business/src/components", "async-state.vue", "YdAsyncState.vue"),
    ("comm/effects/shared-business/src/components", "user-avatar.vue", "YdUserAvatar.vue"),
    ("comm/effects/shared-business/src/components", "dict-select.vue", "YdDictSelect.vue"),
    ("comm/effects/shared-business/src/components", "dict-tag.vue", "YdDictTag.vue"),
    ("comm/effects/shared-business/src/components", "file-icon.vue", "YdFileIcon.vue"),
    ("comm/effects/shared-business/src/components", "excel-export-button.vue", "YdExcelExportButton.vue"),
    ("comm/effects/shared-business/src/components", "excel-import-button.vue", "YdExcelImportButton.vue"),
    ("comm/effects/shared-business/src/components", "keyboard-help.vue", "YdKeyboardHelp.vue"),
    ("comm/effects/shared-business/src/components", "virtual-select.vue", "YdVirtualSelect.vue"),
    ("comm/effects/shared-business/src/components", "virtual-list.vue", "YdVirtualList.vue"),
    ("comm/effects/shared-business/src/components", "app-tour.vue", "YdAppTour.vue"),
    ("comm/effects/shared-business/src/components", "approval-timeline.vue", "YdApprovalTimeline.vue"),
    ("comm/effects/shared-business/src/components/secondary-auth-modal", "index.vue", "YdSecondaryAuthModal.vue"),
]

def relpath(d):
    return os.path.join(BASE, d)

def main():
    ok = 0
    miss = 0
    for subdir, old, new in RENAMES:
        d = relpath(subdir)
        op, np = os.path.join(d, old), os.path.join(d, new)
        if os.path.exists(op):
            os.makedirs(os.path.dirname(np), exist_ok=True)
            if not os.path.exists(np):
                os.rename(op, np)
                ok += 1
            else:
                print(f"  SKIP(exists): {subdir}/{new}")
        else:
            print(f"  MISS: {subdir}/{old}")
            miss += 1
    print(f"Renames OK: {ok}, MISS: {miss}")

    # Fix index.ts references in common-ui + shared-business
    fixed = 0
    for root, dirs, files in os.walk(BASE):
        if 'node_modules' in root or 'dist' in root or '.git' in root: continue
        for f in files:
            if f != 'index.ts' and not f.endswith('.vue'): continue
            fp = os.path.join(root, f)
            try:
                with open(fp, 'r', encoding='utf-8') as fh: content = fh.read()
            except: continue
            orig = content
            for subdir, old, new in RENAMES:
                old_path = "./" + old
                new_path = "./" + new
                if old_path in content:
                    content = content.replace(old_path, new_path)
            if content != orig:
                with open(fp, 'w', encoding='utf-8') as fh: fh.write(content)
                fixed += 1
    print(f"Index.vue path fixes: {fixed}")

if __name__ == '__main__':
    main()
    print("Phase 1b done!")
