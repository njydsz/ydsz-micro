import json,os
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

from td import T  # translation data module

cnt=0
for loc in L:
    cc=rj(os.path.join(BC,loc,"common.json"))
    ca=rj(os.path.join(BC,loc,"authentication.json"))
    login=sg(cc,"login",T.login.get(loc,"Login"))
    qr=sg(ca,"qrcodeLogin",T.qrcodeLogin.get(loc,"QR Code Login"))
    fp=sg(ca,"forgetPassword",T.forgetPassword.get(loc,"Forget Password"))
    g=lambda k:T.d.get(k,{}).get(loc,"")
    page={"auth":{"login":login,"register":T.register[loc],"codeLogin":T.codeLogin[loc],"qrcodeLogin":qr,"forgetPassword":fp},"dashboard":{"title":T.dt[loc],"analytics":T.da[loc],"workspace":T.dw[loc]},"microKernel":{"containerLabel":T.mc[loc],"phase":{"loading":T.pl[loc],"loaded":T.pd[loc],"mounting":T.pm[loc],"mounted":T.pd[loc],"unmounting":T.pu[loc],"error":T.pe[loc]},"announcements":{"loading":T.al[loc],"loaded":T.ad[loc],"mounting":T.am[loc],"mounted":T.ao[loc],"unmounting":T.au[loc],"error":T.ae[loc]},"errorMask":{"title":T.et[loc],"hint":T.eh[loc]}}
    demos={"title":T.dm[loc]}
    od=os.path.join(BM,loc)
    os.makedirs(od,exist_ok=True)
    with open(os.path.join(od,"page.json"),'w',encoding='utf-8') as f:json.dump(page,f,ensure_ascii=False,indent=2);f.write("\n")
    with open(os.path.join(od,"demos.json"),'w',encoding='utf-8') as f:json.dump(demos,f,ensure_ascii=False,indent=2);f.write("\n")
    cnt+=1
print(cnt)
