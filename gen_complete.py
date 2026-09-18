#!/usr/bin/env python3
import json, os, sys, importlib.util

BC=r"D:\Code\open\ydsz-micro\comm\locales\src\langs"
BM=r"D:\Code\open\ydsz-micro\main\src\locales\langs"
ALL=["af-ZA","am-ET","ar-EG","ar-SA","az-AZ","bg-BG","bn-BD","bs-BA","ca-ES","cs-CZ","cy-GB","da-DK","de-AT","de-CH","de-DE","el-GR","en-GB","es-AR","es-ES","es-MX","et-EE","eu-ES","fa-IR","fi-FI","fil-PH","fr-CA","fr-FR","gl-ES","gu-IN","he-IL","hi-IN","hr-HR","hu-HU","hy-AM","id-ID","is-IS","it-IT","ja-JP","ka-GE","kk-KZ","km-KH","kn-IN","ko-KR","lo-LA","lt-LT","lv-LV","mk-MK","ml-IN","mn-MN","mr-IN","ms-MY","my-MM","nb-NO","ne-NP","nl-BE","nl-NL","pl-PL","pt-BR","pt-PT","ro-RO","ru-RU","si-LK","sk-SK","sl-SI","sq-AL","sr-RS","sv-SE","sw-KE","ta-IN","te-IN","th-TH","tr-TR","uk-UA","ur-PK","uz-UZ","vi-VN","zh-HK","zh-TW","zu-ZA"]

EN={"register":"Register","codeLogin":"Code Login","login":"Login","qrcodeLogin":"QR Code Login","forgetPassword":"Forget Password","demos_title":"Demos","dash_title":"YDSZ Platform","dash_analytics":"Analytics","dash_workspace":"Workspace","container":"Micro-frontend Subapplication Container","ph_loading":"Loading modules...","ph_loaded":"Modules loaded","ph_error":"Load failed","ph_mounting":"Mounting application...","ph_unmounting":"Switching application...","ann_loading":"Loading {{appName}} subapplication","ann_loaded":"{{appName}} modules loaded, preparing to mount","ann_mounting":"Mounting {{appName}} subapplication","ann_mounted":"{{appName}} subapplication loaded","ann_unmounting":"Switching away from {{appName}}","ann_error":"{{appName}} subapplication failed to load","err_title":"Failed to load application","err_hint":"Degraded to full-page navigation, please retry later"}

def rj(p):
    try:
        with open(p,'r',encoding='utf-8') as f:return json.load(f)
    except:return {}
def sg(d,k,fb):
    v=d.get(k)
    if not v or not isinstance(v,str) or "MYMEMORY" in v:return fb
    return v

spec=importlib.util.spec_from_file_location("td",os.path.join(os.path.dirname(os.path.abspath(__file__)),"td.py"))
td=importlib.util.module_from_spec(spec)
spec.loader.exec_module(td)

km={"register":"register","codeLogin":"codeLogin","login":"login","qrcodeLogin":"qrcodeLogin","forgetPassword":"forgetPassword","demos_title":"dm","dash_title":"dt","dash_analytics":"da","dash_workspace":"dw","container":"mc","ph_loading":"ph_loading","ph_loaded":"ph_loaded","ph_error":"ph_error","ph_mounting":"ph_mounting","ph_unmounting":"ph_unmounting","ann_loading":"al","ann_loaded":"ad","ann_mounting":"am","ann_mounted":"ao","ann_unmounting":"au","ann_error":"ae","err_title":"et","err_hint":"eh"}

T={}
for tn,dn in km.items():
    src=getattr(td,dn,{})
    T[tn]={loc:src.get(loc,EN[tn]) for loc in ALL}

cnt=0
for loc in ALL:
    cc=rj(os.path.join(BC,loc,"common.json"))
    ca=rj(os.path.join(BC,loc,"authentication.json"))
    login=sg(cc,"login",T["login"][loc])
    qr=sg(ca,"qrcodeLogin",T["qrcodeLogin"][loc])
    fp=sg(ca,"forgetPassword",T["forgetPassword"][loc])
    ak={"login":login,"register":T["register"][loc],"codeLogin":T["codeLogin"][loc],"qrcodeLogin":qr,"forgetPassword":fp}
    dk={"title":T["dash_title"][loc],"analytics":T["dash_analytics"][loc],"workspace":T["dash_workspace"][loc]}
    ph={"loading":T["ph_loading"][loc],"loaded":T["ph_loaded"][loc],"mounting":T["ph_mounting"][loc],"mounted":T["ph_loaded"][loc],"unmounting":T["ph_unmounting"][loc],"error":T["ph_error"][loc]}
    an={"loading":T["ann_loading"][loc],"loaded":T["ann_loaded"][loc],"mounting":T["ann_mounting"][loc],"mounted":T["ann_mounted"][loc],"unmounting":T["ann_unmounting"][loc],"error":T["ann_error"][loc]}
    em={"title":T["err_title"][loc],"hint":T["err_hint"][loc]}
    mk={"containerLabel":T["container"][loc],"phase":ph,"announcements":an,"errorMask":em}
    page={"auth":ak,"dashboard":dk,"microKernel":mk}
    demos={"title":T["demos_title"][loc]}
    od=os.path.join(BM,loc)
    os.makedirs(od,exist_ok=True)
    with open(os.path.join(od,"page.json"),'w',encoding='utf-8') as f:json.dump(page,f,ensure_ascii=False,indent=2);f.write("\n")
    with open(os.path.join(od,"demos.json"),'w',encoding='utf-8') as f:json.dump(demos,f,ensure_ascii=False,indent=2);f.write("\n")
    cnt+=1
print(cnt)
