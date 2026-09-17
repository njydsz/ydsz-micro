#!/usr/bin/env python3
import os, re
BASE = "D:/Code/open/ydsz-micro"
EXTS = {'.ts', '.tsx', '.vue'}
RENAME_MAP = {
    "ErrorBoundary": "YdErrorBoundary",
    "ErrorFeedback": "YdErrorFeedback",
    "ErrorState": "YdErrorState",
    "NetworkStatus": "YdNetworkStatus",
    "Skeleton": "YdSkeleton",
    "Tippy": "YdTippy",
    "ColPage": "YdColPage",
    "CountTo": "YdCountTo",
    "EllipsisText": "YdEllipsisText",
    "IconPicker": "YdIconPicker",
    "JsonViewer": "YdJsonViewer",
    "ApiComponent": "YdApiComponent",
    "PointSelectionCaptcha": "YdPointSelectionCaptcha",
    "SliderCaptcha": "YdSliderCaptcha",
    "AsyncState": "YdAsyncState",
    "DictSelect": "YdDictSelect",
    "DictTag": "YdDictTag",
    "FileIcon": "YdFileIcon",
    "ExcelExportButton": "YdExcelExportButton",
    "ExcelImportButton": "YdExcelImportButton",
    "KeyboardHelp": "YdKeyboardHelp",
    "VirtualSelect": "YdVirtualSelect",
    "VirtualList": "YdVirtualList",
    "AppTour": "YdAppTour",
    "ApprovalTimeline": "YdApprovalTimeline",
    "SecondaryAuthModal": "YdSecondaryAuthModal",
}
def should_process(fp):
    if 'node_modules' in fp or 'dist' in fp or '.git' in fp: return False
    return os.path.splitext(fp)[1] in EXTS
def find_files(base):
    result = []
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', '.git', '.next', 'cache')]
        for f in files:
            fp = os.path.join(root, f)
            if should_process(fp): result.append(fp)
    return result
def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f: content = f.read()
    except: return False
    orig = content
    for old, new in sorted(RENAME_MAP.items(), key=lambda x: -len(x[0])):
        p = r'(?<![A-Za-z0-9_])' + re.escape(old) + r'(?![A-Za-z0-9_])'
        content = re.sub(p, new, content)
    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f: f.write(content)
        return True
    return False
def main():
    all_files = find_files(BASE)
    mod = 0
    for fp in all_files:
        if replace_in_file(fp): mod += 1
    print(f"Phase1 identifier replace: {mod} files")
if __name__ == '__main__':
    main()
