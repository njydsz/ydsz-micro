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

from td import register,codeLogin,login,qrcodeLogin,forgetPassword,dm,dt,da,dw,mc
from td import ph_loading,ph_loaded,ph_error,ph_mounting,ph_unmounting
from td import al,ad,am,ao,au,ae,et,eh

cnt=0
for loc in L:
    cc=rj(os.path.join(BC,loc,"common.json"))
    ca=rj(os.path.join(BC,loc,"authentication.json"))
    gli=sg(cc,"login",login.get(loc,"Login"))
    qr=sg(ca,"qrcodeLogin",qrcodeLogin.get(loc,"QR Code Login"))
    fp=sg(ca,"forgetPassword",forgetPassword.get(loc,"Forget Password"))
    ak={"login":gli,"register":register[loc],"codeLogin":codeLogin[loc],"qrcodeLogin":qr,"forgetPassword":fp}
    dk={"title":dt[loc],"analytics":da[loc],"workspace":dw[loc]}
    ph={"loading":ph_loading[loc],"loaded":ph_loaded[loc],"mounting":ph_mounting[loc],"mounted":ph_loaded[loc],"unmounting":ph_unmounting[loc],"error":ph_error[loc]}
    an={"loading":al[loc],"loaded":ad[loc],"mounting":am[loc],"mounted":ao[loc],"unmounting":au[loc],"error":ae[loc]}
    em={"title":et[loc],"hint":eh[loc]}
    mk={"containerLabel":mc[loc],"phase":ph,"announcements":an,"errorMask":em}
    page={"auth":ak,"dashboard":dk,"microKernel":mk}
    demos={"title":dm[loc]}
    od=os.path.join(BM,loc)
    os.makedirs(od,exist_ok=True)
    with open(os.path.join(od,"page.json"),'w',encoding='utf-8') as f:json.dump(page,f,ensure_ascii=False,indent=2);f.write("\n")
    with open(os.path.join(od,"demos.json"),'w',encoding='utf-8') as f:json.dump(demos,f,ensure_ascii=False,indent=2);f.write("\n")
    cnt+=1
print(cnt)
