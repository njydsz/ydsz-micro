#!/usr/bin/env python3
"""Check and fix td.py data for missing locales, then create i18n_data.py with T dict."""
import sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from td import *

# All expected locales
ALL=["af-ZA","am-ET","ar-EG","ar-SA","az-AZ","bg-BG","bn-BD","bs-BA","ca-ES","cs-CZ","cy-GB","da-DK","de-AT","de-CH","de-DE","el-GR","en-GB","es-AR","es-ES","es-MX","et-EE","eu-ES","fa-IR","fi-FI","fil-PH","fr-CA","fr-FR","gl-ES","gu-IN","he-IL","hi-IN","hr-HR","hu-HU","hy-AM","id-ID","is-IS","it-IT","ja-JP","ka-GE","kk-KZ","km-KH","kn-IN","ko-KR","lo-LA","lt-LT","lv-LV","mk-MK","ml-IN","mn-MN","mr-IN","ms-MY","my-MM","nb-NO","ne-NP","nl-BE","nl-NL","pl-PL","pt-BR","pt-PT","ro-RO","ru-RU","si-LK","sk-SK","sl-SI","sq-AL","sr-RS","sv-SE","sw-KE","ta-IN","te-IN","th-TH","tr-TR","uk-UA","ur-PK","uz-UZ","vi-VN","zh-HK","zh-TW","zu-ZA"]

dicts = {
    "register": register, "codeLogin": codeLogin, "login": login,
    "qrcodeLogin": qrcodeLogin, "forgetPassword": forgetPassword,
    "demos_title": dm, "dash_title": dt, "dash_analytics": da,
    "dash_workspace": dw, "container": mc, "ph_loading": ph_loading,
    "ph_loaded": ph_loaded, "ph_error": ph_error, "ph_mounting": ph_mounting,
    "ph_unmounting": ph_unmounting, "ann_loading": al, "ann_loaded": ad,
    "ann_mounting": am, "ann_mounted": ao, "ann_unmounting": au,
    "ann_error": ae, "err_title": et, "err_hint": eh
}

missing = {}
for name, d in dicts.items():
    miss = [loc for loc in ALL if loc not in d]
    if miss:
        missing[name] = miss

if missing:
    print("Missing locales per dict:")
    for k, v in missing.items():
        print(f"  {k}: {v}")
else:
    print("All locales present in all dicts!")
