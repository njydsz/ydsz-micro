#!/usr/bin/env python3
"""Batch-translate en-US locale files to 8 target languages using MyMemory API.

Translation approach: collect all unique English strings across all 4 files,
translate each string to each target language, then rebuild files.

MyMemory free tier: ~500 requests/day, ~1000 chars/q. It works without auth.
We batch at most 3 concurrent requests with 0.3s delay to stay polite.
"""

import json
import os
import time
import sys
import requests

BASE_DIR = "D:/Code/open/ydsz-micro/comm/locales/src/langs"
SRC_LANG = "en-US"

LANGUAGES = {
    "sk-SK": "sk",
    "sl-SI": "sl",
    "sq-AL": "sq",
    "sr-RS": "sr",
    "sw-KE": "sw",
    "ta-IN": "ta",
    "te-IN": "te",
    "ur-PK": "ur",
}

FILES = ["common.json", "authentication.json", "preferences.json", "ui.json"]

# Keys whose values should be preserved as "瑞米软件" (never translated)
PRESERVE_RUIMI_KEYS = {"welcomeBack", "loginSuccessDesc"}

SKIP_PREFIXES = ("#", "rgba", "rgb", "http", "//", "window.", "document.", "data:", "@")
SKIP_SUFFIXES = ("px", "rem", "em", "%", "vh", "vw", "ms", "s")


def is_translatable(value):
    """Decide whether a string value should be translated."""
    if not isinstance(value, str):
        return False
    v = value.strip()
    if not v or len(v) <= 1:
        return False
    try:
        float(v)
        return False
    except ValueError:
        pass
    if v.startswith(SKIP_PREFIXES):
        return False
    for suffix in SKIP_SUFFIXES:
        if v.endswith(suffix) and len(v) < 12:
            try:
                float(v[: -len(suffix)])
                return False
            except ValueError:
                pass
    return True


def mymemory_translate(text, dest_lang, retries=5):
    """Translate using MyMemory free API."""
    url = "https://api.mymemory.translated.net/get"
    params = {"q": text, "langpair": f"en|{dest_lang}"}
    for attempt in range(retries):
        try:
            r = requests.get(url, params=params, timeout=30)
            data = r.json()
            translated = data.get("responseData", {}).get("translatedText", "")
            if translated and translated.strip().upper() != text.strip().upper():
                return translated
            if attempt < retries - 1:
                time.sleep(3)
                continue
            return text
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(5)
            else:
                print(f"    !! Failed '{text[:30]}...': {e}", flush=True)
                return text


def collect_strings(obj, path=""):
    """Collect all (path, value) pairs from a nested dict."""
    items = []
    if isinstance(obj, dict):
        for k in obj:
            items.extend(collect_strings(obj[k], f"{path}.{k}" if path else k))
    else:
        items.append((path, obj))
    return items


def set_by_path(d, path, value):
    keys = path.split(".")
    obj = d
    for k in keys[:-1]:
        obj = obj[k]
    obj[keys[-1]] = value


def get_by_path(d, path):
    keys = path.split(".")
    obj = d
    for k in keys:
        obj = obj[k]
    return obj


def deep_copy(d):
    return json.loads(json.dumps(d))


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
        f.write('\n')


def main():
    langs_to_process = LANGUAGES
    if len(sys.argv) > 1 and sys.argv[1] in LANGUAGES:
        langs_to_process = {sys.argv[1]: LANGUAGES[sys.argv[1]]}

    print("Loading English source files...")
    src_data = {}
    all_strings_per_file = {}

    for fname in FILES:
        src_path = os.path.join(BASE_DIR, SRC_LANG, fname)
        src_data[fname] = load_json(src_path)
        strs = collect_strings(src_data[fname])
        all_strings_per_file[fname] = strs

    for lang_code, lang_short in langs_to_process.items():
        print(f"\n{'='*60}")
        print(f"Translating to {lang_code} ({lang_short})")
        print(f"{'='*60}")

        # Gather all unique source strings across all files
        unique_en = {}  # en_text -> True
        for fname in FILES:
            for path, val in all_strings_per_file[fname]:
                if isinstance(val, str) and is_translatable(val):
                    unique_en[val.strip()] = True

        total = len(unique_en)
        print(f"Unique strings to translate: {total}")

        # Translate all unique strings to this language
        en_to_tr = {}
        for idx, en_text in enumerate(unique_en):
            tr_text = mymemory_translate(en_text, lang_short)
            en_to_tr[en_text] = tr_text
            if (idx + 1) % 25 == 0 or idx == total - 1:
                print(f"  [{idx+1}/{total}] {en_text[:50]} -> {tr_text[:50]}", flush=True)
            time.sleep(0.3)

        # Rebuild each file
        lang_dir = os.path.join(BASE_DIR, lang_code)
        os.makedirs(lang_dir, exist_ok=True)

        for fname in FILES:
            data = deep_copy(src_data[fname])
            for path, val in collect_strings(data):
                if isinstance(val, str):
                    key_name = path.split(".")[-1]
                    if key_name in PRESERVE_RUIMI_KEYS:
                        continue
                    en_text = val.strip()
                    if en_text in en_to_tr:
                        set_by_path(data, path, en_to_tr[en_text])

            out_path = os.path.join(lang_dir, fname)
            save_json(out_path, data)
            print(f"  Saved {lang_code}/{fname}")

    print("\nDone!")


if __name__ == "__main__":
    main()
