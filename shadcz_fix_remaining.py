#!/usr/bin/env python3
"""
修复剩余的 YDSZ 引用：类型名、CSS 类名
"""

import os
import re

BASE_DIR = "D:/Code/open/ydsz-micro"

# YDSZ 前缀 → Yd 前缀（用于类型、接口、CSS 类等）
REPLACEMENTS = [
    # 类型/接口名 (PascalCase)
    ("YDSZButtonProps", "YdButtonProps"),
    ("YDSZButtonGroupProps", "YdButtonGroupProps"),
    ("YDSZDropdownMenuItem", "YdDropdownMenuItem"),
    ("YDSZCheckButtonGroup", "YdCheckButtonGroup"),
    ("YDSZButton", "YdButton"),
    ("YDSZIconButton", "YdIconButton"),
    ("YDSZAvatar", "YdAvatar"),
    ("YDSZTooltip", "YdTooltip"),
    ("YDSZHelpTooltip", "YdHelpTooltip"),
    ("YDSZIcon", "YdIcon"),
    ("YDSZLogo", "YdLogo"),
    ("YDSZSpinner", "YdSpinner"),
    ("YDSZLoading", "YdLoading"),
    ("YDSZPopover", "YdPopover"),
    ("YDSZSegmented", "YdSegmented"),
    ("YDSZSelect", "YdSelect"),
    ("YDSZHoverCard", "YdHoverCard"),
    ("YDSZCheckbox", "YdCheckbox"),
    ("YDSZPinInput", "YdPinInput"),
    ("YDSZInputPassword", "YdInputPassword"),
    ("YDSZCountToAnimator", "YdCountToAnimator"),
    ("YDSZExpandableArrow", "YdExpandableArrow"),
    ("YDSZBreadcrumbView", "YdBreadcrumbView"),
    ("YDSZFullScreen", "YdFullScreen"),
    ("YDSZBackTop", "YdBackTop"),
    ("YDSZRenderContent", "YdRenderContent"),
    ("YDSZScrollbar", "YdScrollbar"),
    ("YDSZSpineText", "YdSpineText"),
    ("YDSZContextMenu", "YdContextMenu"),
    ("YDSZDropdownMenu", "YdDropdownMenu"),
    ("YDSZDropdownRadioMenu", "YdDropdownRadioMenu"),
    # CSS 类名 (kebab-case)
    ("YDSZ-breadcrumb", "yd-breadcrumb"),
    ("YDSZ-button-group", "yd-button-group"),
    ("YDSZ-check-button-group", "yd-check-button-group"),
    ("YDSZ-scrollbar", "yd-scrollbar"),
    ("YDSZ-spine-text", "yd-spine-text"),
    ("YDSZ-link", "yd-link"),
]

EXTS = {'.ts', '.tsx', '.vue'}

def should_process(filepath):
    if 'node_modules' in filepath or 'dist' in filepath or '.git' in filepath:
        return False
    ext = os.path.splitext(filepath)[1]
    return ext in EXTS

def find_files(base_dir):
    result = []
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', '.git', '.next', '.nuxt', '.cache')]
        for f in files:
            filepath = os.path.join(root, f)
            if should_process(filepath):
                result.append(filepath)
    return result

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, PermissionError):
        return False
    
    original = content
    for old, new in REPLACEMENTS:
        # 只替换完整标识符
        pattern = r'(?<![A-Za-z0-9_-])' + re.escape(old) + r'(?![A-Za-z0-9_-])'
        content = re.sub(pattern, new, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    all_files = find_files(BASE_DIR)
    modified = 0
    for filepath in all_files:
        if replace_in_file(filepath):
            modified += 1
            print(f"  {filepath}")
    
    print(f"\n修复 {modified} 个文件中的 YDSZ 残留引用")

if __name__ == '__main__':
    main()
