#!/usr/bin/env python3
"""Translate en-US locale files to 8 target languages.

Uses deep-translator (LibreTranslate / MyMemory / Microsoft) as fallback
when googletrans is unavailable or network-restricted.
"""

import json
import os
import time
import argparse

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

PRESERVE_RUIMI_KEYS = {"welcomeBack", "loginSuccessDesc"}

# Keys whose values should NOT be translated (numbers, CSS values, etc.)
SKIP_VALUE_PATTERNS = [
    "px", "rem", "em", "%", "rgba", "rgb", "http", "window.", "document.",
]


def should_skip_value(value):
    """Skip values that are purely numeric/CSS/code."""
    if not isinstance(value, str):
        return True
    v = value.strip()
    if not v:
        return True
    # Pure numbers
    try:
        float(v)
        return True
    except ValueError:
        pass
    # Short CSS values, hex colors, etc.
    if v.startswith(("#", "rgba", "rgb", "http", "/", "window", "document")):
        return True
    if v.endswith(("px", "rem", "em", "%", "vh", "vw", "ms", "s")) and len(v) < 10:
        try:
            float(v.replace("px", "").replace("rem", "").replace("em", "")
                   .replace("%", "").replace("vh", "").replace("vw", "")
                   .replace("ms", "").replace("s", ""))
            return True
        except ValueError:
            pass
    return False


def make_translator():
    """Try multiple backends until one works."""
    # 1. Try googletrans
    try:
        from googletrans import Translator
        t = Translator()
        test = t.translate("Hello", dest="sk").text
        print(f"[OK] googletrans: Hello -> {test}")
        return lambda text, dest: t.translate(text, dest=dest, src='en').text
    except Exception as e:
        print(f"[FAIL] googletrans: {e}")

    # 2. Try deep-translator LibreTranslate
    try:
        from deep_translator import LibreTranslate
        t = LibreTranslate(source="en", target="sk")
        test = t.translate("Hello")
        print(f"[OK] LibreTranslate: Hello -> {test}")
        def libtranslate(text, dest):
            t2 = LibreTranslate(source="en", target=dest)
            return t2.translate(text)
        return libtranslate
    except Exception as e:
        print(f"[FAIL] LibreTranslate: {e}")

    # 3. Try MyMemory
    try:
        from deep_translator import MyMemoryTranslator
        t = MyMemoryTranslator(source="en-US", target="sk")
        test = t.translate("Hello")
        print(f"[OK] MyMemory: Hello -> {test}")
        def mymemory_translate(text, dest):
            lang_map = {"sk":"sk-SK","sl":"sl-SI","sq":"sq-AL","sr":"sr-RS",
                        "sw":"sw-KE","ta":"ta-IN","te":"te-IN","ur":"ur-PK"}
            dest_full = lang_map.get(dest, dest)
            t2 = MyMemoryTranslator(source="en-US", target=dest_full)
            return t2.translate(text)
        return mymemory_translate
    except Exception as e:
        print(f"[FAIL] MyMemory: {e}")

    # 4. Try GoogleTranslator (deep-translator)
    try:
        from deep_translator import GoogleTranslator
        test = GoogleTranslator(source='en', target='sk').translate("Hello")
        print(f"[OK] deep-translator Google: Hello -> {test}")
        def deeptranslate(text, dest):
            return GoogleTranslator(source='en', target=dest).translate(text)
        return deeptranslate
    except Exception as e:
        print(f"[FAIL] deep-translator Google: {e}")

    raise RuntimeError("No translator backend available!")


def translate_text(text, dest_lang, translate_fn):
    """Translate a single string, retrying on failure."""
    if should_skip_value(text):
        return text
    for attempt in range(3):
        try:
            result = translate_fn(text, dest_lang)
            return result
        except Exception as e:
            print(f"  Translation error (attempt {attempt+1}): {e}")
            time.sleep(3)
    return text  # fallback to original


def translate_dict(d, dest_lang, translate_fn, preserve_ruimi=False):
    """Recursively translate all string values in a dict."""
    result = {}
    for key, value in d.items():
        if isinstance(value, dict):
            result[key] = translate_dict(value, dest_lang, translate_fn, preserve_ruimi=False)
        elif isinstance(value, str):
            if preserve_ruimi and key in PRESERVE_RUIMI_KEYS:
                result[key] = value
            elif value.strip():
                translated = translate_text(value, dest_lang, translate_fn)
                result[key] = translated
                time.sleep(0.1)  # rate limiting
            else:
                result[key] = value
        else:
            result[key] = value
    return result


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
        f.write('\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lang', help='Single lang code to translate')
    args = parser.parse_args()

    print("Looking for a working translator...")
    translate_fn = make_translator()

    # Load source files
    src_files = {}
    for fname in FILES:
        src_path = os.path.join(BASE_DIR, SRC_LANG, fname)
        src_files[fname] = load_json(src_path)
        print(f"Loaded {SRC_LANG}/{fname}")

    langs_to_process = {args.lang: LANGUAGES[args.lang]} if args.lang else LANGUAGES

    for lang_code, lang_short in langs_to_process.items():
        print(f"\n=== Translating to {lang_code} (dest={lang_short}) ===")
        lang_dir = os.path.join(BASE_DIR, lang_code)
        os.makedirs(lang_dir, exist_ok=True)

        for fname in FILES:
            src_data = src_files[fname]
            preserve_ruimi = (fname == "authentication.json")
            translated = translate_dict(src_data, lang_short, translate_fn, preserve_ruimi)

            out_path = os.path.join(lang_dir, fname)
            save_json(out_path, translated)
            print(f"  Saved {lang_code}/{fname}")

    print("\nDone! All files translated.")


if __name__ == "__main__":
    main()
