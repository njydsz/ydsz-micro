import json, os
base = r'D:\Code\open\ydsz-micro\apps\message-web\src\locales\langs'
check = ['nb-NO','nl-NL','pl-PL','pt-PT','ro-RO','sk-SK','uz-UZ','vi-VN','ms-MY','ka-GE','zu-ZA','sq-AL','sw-KE','ne-NP','my-MM']
for loc in check:
    bp = os.path.join(base, loc, 'business.json')
    pp = os.path.join(base, loc, 'page.json')
    bd = json.load(open(bp, encoding='utf-8'))
    pd = json.load(open(pp, encoding='utf-8'))
    print(loc + ":")
    print("  biz.title=" + bd["message"]["title"])
    print("  biz.create=" + bd["create"] + "  edit=" + bd["edit"] + "  delete=" + bd["delete"])
    print("  page.batch=" + pd["batchSend"] + "  deadLetter=" + pd["deadLetter"] + "  route=" + pd["route"])
    print()
