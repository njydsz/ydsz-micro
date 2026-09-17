#!/usr/bin/env python3
"""
UI 组件库 Yd 前缀统一脚本 — 覆盖 form-ui, popup-ui, menu-ui, tabs-ui, layout-ui, tiptap
"""

import json
import os
import re

BASE_DIR = "D:/Code/open/ydsz-micro"
EXTS = {'.ts', '.tsx', '.vue'}

# 扁平化映射表：旧名 → 新名（按长度降序避免短名误匹配）
RENAME_MAP = {
    # form-ui
    "YDSZFormAdapterOptions": "YdFormAdapterOptions",
    "BaseFormComponentType": "YdBaseFormComponentType",
    "ExtendedFormApi": "YdExtendedFormApi",
    "YDSZFormProps": "YdFormProps",
    "YDSZFormSchema": "YdFormSchema",
    "setupYDSZForm": "setupYdForm",
    "useYDSZForm": "useYdForm",
    "YDSZForm": "YdForm",
    # popup-ui
    "YDSZModal": "YdModal",
    "YDSZDrawer": "YdDrawer",
    "setDefaultModalProps": "setDefaultYdModalProps",
    "setDefaultDrawerProps": "setDefaultYdDrawerProps",
    "useYDSZModal": "useYdModal",
    "useYDSZDrawer": "useYdDrawer",
    "AlertProps": "YdAlertProps",
    "PromptProps": "YdPromptProps",
    "PopupApiOptions": "YdPopupApiOptions",
    "PopupApiCallbacks": "YdPopupApiCallbacks",
    "PopupApi": "YdPopupApi",
    "Alert": "YdAlert",
    # menu-ui
    "MenuBadgeDot": "YdMenuBadgeDot",
    "NormalMenu": "YdNormalMenu",
    "MenuBadge": "YdMenuBadge",
    "Menu": "YdMenu",
    # tabs-ui
    "TabsView": "YdTabsView",
    # layout-ui
    "YDSZAdminLayout": "YdAdminLayout",
    "YDSZLayoutProps": "YdLayoutProps",
    # tiptap
    "YDSZTipTapEditor": "YdTipTapEditor",
    "TipTapToolbar": "YdTipTapToolbar",
    "getDefaultExtensions": "getYdDefaultExtensions",
}

def should_process(filepath):
    if 'node_modules' in filepath or 'dist' in filepath or '.git' in filepath:
        return False
    if os.path.splitext(filepath)[1] not in EXTS:
        return False
    return True

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
    # 按长度降序排列，避免短名误匹配长名
    sorted_items = sorted(RENAME_MAP.items(), key=lambda x: -len(x[0]))
    
    for old_name, new_name in sorted_items:
        pattern = r'(?<![A-Za-z0-9_])' + re.escape(old_name) + r'(?![A-Za-z0-9_])'
        content = re.sub(pattern, new_name, content)
    
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
            rel = os.path.relpath(filepath, BASE_DIR)
            print(f"  {rel}")
    
    print(f"\n完成! 修改了 {modified} 个文件")

if __name__ == '__main__':
    main()
