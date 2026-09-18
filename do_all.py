#!/usr/bin/env python3
"""One-shot generator"""
import json, os

BC=r"D:\Code\open\ydsz-micro\comm\locales\src\langs"
BM=r"D:\Code\open\ydsz-micro\main\src\locales\langs"
L=["af-ZA","am-ET","ar-EG","ar-SA","az-AZ","bg-BG","bn-BD","bs-BA","ca-ES","cs-CZ","cy-GB","da-DK","de-AT","de-CH","de-DE","el-GR","en-GB","es-AR","es-ES","es-MX","et-EE","eu-ES","fa-IR","fi-FI","fil-PH","fr-CA","fr-FR","gl-ES","gu-IN","he-IL","hi-IN","hr-HR","hu-HU","hy-AM","id-ID","is-IS","it-IT","ja-JP","ka-GE","kk-KZ","km-KH","kn-IN","ko-KR","lo-LA","lt-LT","lv-LV","mk-MK","ml-IN","mn-MN","mr-IN","ms-MY","my-MM","nb-NO","ne-NP","nl-BE","nl-NL","pl-PL","pt-BR","pt-PT","ro-RO","ru-RU","si-LK","sk-SK","sl-SI","sq-AL","sr-RS","sv-SE","sw-KE","ta-IN","te-IN","th-TH","tr-TR","uk-UA","ur-PK","uz-UZ","vi-VN","zh-HK","zh-TW","zu-ZA"]

def rj(p):
    try:
        with open(p,'r',encoding='utf-8') as f:return json.load(f)
    except:return {}
def sg(d,k,fb):
    v=d.get(k)
    if not v or not isinstance(v,str) or "MYMEMORY" in v:return fb
    return v

from i18n_data import T  # All translation dicts keyed by locale

cnt=0
for loc in L:
    cc=rj(os.path.join(BC,loc,"common.json"))
    ca=rj(os.path.join(BC,loc,"authentication.json"))
    login=sg(cc,"login",T["login"].get(loc,"Login"))
    qr=sg(ca,"qrcodeLogin",T["qrcodeLogin"].get(loc,"QR Code Login"))
    fp=sg(ca,"forgetPassword",T["forgetPassword"].get(loc,"Forget Password page"))

    page={
        "auth":{"login":login,"register":T["register"][loc],"codeLogin":T["codeLogin"][loc],"qrcodeLogin":qr,"forgetPassword":fp},
        "dashboard":{"title":T["dash_title"][loc],"analytics":T["dash_analytics"][loc],"workspace":T["dash_workspace"][loc]},
        "microKernel":{
            "containerLabel":T["container"][loc],
            "phase":{"loading":T["ph_loading"][loc],"loaded":T["ph_loaded"][loc],"mounting":T["ph_mounting"][loc],"mounted":T["ph_loaded"][loc],"unmounting":T["ph_unmounting"][loc],"error":T["ph_error"][loc]},
            "announcements":{"loading":T["ann_loading"][loc],"loaded":T["ann_loaded"][loc],"mounting":T["ann_mounting"][loc],"mounted":T["ann_mounted"][loc],"unmounting":T["ann_unmounting"][loc],"error":T["ann_error"][loc]},
            "errorMask":{"title":T["err_title"][loc],"hint":T["err_hint"][loc]}
        }
    }
    demos={"title":T["demos_title"][loc]}
    od=os.path.join(BM,loc)
    os.makedirs(od,exist_ok=True)
    with open(os.path.join(od,"page.json"),'w',encoding='utf-8') as f:json.dump(page,f,ensure_ascii=False,indent=2);f.write("\n")
    with open(os.path.join(od,"demos.json"),'w',encoding='utf-8') as f:json.dump(demos,f,ensure_ascii=False,indent=2);f.write("\n")
    cnt+=1
print(cnt)
