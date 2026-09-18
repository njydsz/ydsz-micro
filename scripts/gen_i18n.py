#!/usr/bin/env python3
"""Generate message-web business.json and page.json for 79 locales."""
import json, os

BASE = r"D:\Code\open\ydsz-micro"
COMM_BASE = os.path.join(BASE, "comm", "locales", "src", "langs")
DEST_BASE = os.path.join(BASE, "apps", "message-web", "src", "locales", "langs")

LOCALES = [
    "af-ZA","am-ET","ar-EG","ar-SA","az-AZ","bg-BG","bn-BD","bs-BA","ca-ES","cs-CZ",
    "cy-GB","da-DK","de-AT","de-CH","de-DE","el-GR","en-GB","es-AR","es-ES","es-MX",
    "et-EE","eu-ES","fa-IR","fi-FI","fil-PH","fr-CA","fr-FR","gl-ES","gu-IN","he-IL",
    "hi-IN","hr-HR","hu-HU","hy-AM","id-ID","is-IS","it-IT","ja-JP","ka-GE","kk-KZ",
    "km-KH","kn-IN","ko-KR","lo-LA","lt-LT","lv-LV","mk-MK","ml-IN","mn-MN","mr-IN",
    "ms-MY","my-MM","nb-NO","ne-NP","nl-BE","nl-NL","pl-PL","pt-BR","pt-PT","ro-RO",
    "ru-RU","si-LK","sk-SK","sl-SI","sq-AL","sr-RS","sv-SE","sw-KE","ta-IN","te-IN",
    "th-TH","tr-TR","uk-UA","ur-PK","uz-UZ","vi-VN","zh-HK","zh-TW","zu-ZA"
]

EN = {
    "messageTitle": "Message Management", "messageId": "Message ID",
    "messageChannel": "Channel", "messageRecipient": "Recipient",
    "messageSubject": "Subject", "messageSendTime": "Sent At",
    "messageConfirmDelete": 'Are you sure you want to delete "{id}"?',
    "operationSuccess": "Operation Successful",
    "templateName": "Template Name", "templateContent": "Template Content",
    "templateType": "Template Type", "routeName": "Route Name",
    "routePriority": "Priority", "routeCondition": "Condition",
    "preferenceName": "Preference Name", "dndEnabled": "DND",
    "dndStart": "DND Start", "dndEnd": "DND End",
    "confirmDelete": 'Are you sure you want to delete "{id}"?',
    "msg_message": "Message", "msg_messageList": "Message List",
    "msg_batchSend": "Batch Send", "msg_deadLetter": "Dead Letter",
    "msg_template": "Template", "msg_templateList": "Template List",
    "msg_notification": "Notification", "msg_notificationList": "Notification List",
    "msg_route": "Route", "msg_routeRule": "Route Rule",
    "msg_preference": "Preference", "msg_messagePreference": "Message Preference",
}

T = {}

# Batch 1: Locales af-ZA through da-DK
exec(open(os.path.join(os.path.dirname(__file__), "data_batch1.py"), encoding="utf-8").read())
# Batch 2: Locales de-AT through sv-SE
exec(open(os.path.join(os.path.dirname(__file__), "data_batch2.py"), encoding="utf-8").read())
# Batch 3: Locales sw-KE through zu-ZA + problematic
exec(open(os.path.join(os.path.dirname(__file__), "data_batch3.py"), encoding="utf-8").read())

def read_comm(locale):
    path = os.path.join(COMM_BASE, locale, "common.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"  Warning: cannot read comm for {locale}: {e}")
        return {}

def is_corrupted(comm_data):
    if not comm_data:
        return True
    first_val = str(list(comm_data.values())[0]) if comm_data else ""
    return "MYMEMORY WARNING" in first_val

def get_create_edit_delete(comm_data):
    create_val, edit_val, delete_val = "", "", ""
    if "create" in comm_data:
        create_val = comm_data["create"]
    if "edit" in comm_data:
        edit_val = comm_data["edit"]
    if "delete" in comm_data:
        delete_val = comm_data["delete"]
    if not create_val and "actionTitle" in comm_data:
        at = comm_data["actionTitle"]
        if "create" in at:
            create_val = at["create"].replace(" {0}", "").replace("{0}", "")
        if "edit" in at:
            edit_val = at["edit"].replace(" {0}", "").replace("{0}", "")
        if "delete" in at:
            delete_val = at["delete"].replace(" {0}", "").replace("{0}", "")
    return create_val, edit_val, delete_val

def build_business_json(locale, comm_data):
    is_corr = is_corrupted(comm_data)
    t = T.get(locale, {})
    comm_create, comm_edit, comm_delete = get_create_edit_delete(comm_data)
    create_val = comm_create if comm_create and not is_corr else t.get("create", "Add")
    edit_val = comm_edit if comm_edit and not is_corr else t.get("edit", "Edit")
    delete_val = comm_delete if comm_delete and not is_corr else t.get("delete", "Delete")
    return {
        "message": {
            "title": t.get("messageTitle", EN["messageTitle"]),
            "columns": {
                "id": t.get("messageId", EN["messageId"]),
                "channel": t.get("messageChannel", EN["messageChannel"]),
                "recipient": t.get("messageRecipient", EN["messageRecipient"]),
                "subject": t.get("messageSubject", EN["messageSubject"]),
                "sendTime": t.get("messageSendTime", EN["messageSendTime"])
            },
            "confirmDelete": t.get("messageConfirmDelete", EN["messageConfirmDelete"])
        },
        "templateName": t.get("templateName", EN["templateName"]),
        "templateContent": t.get("templateContent", EN["templateContent"]),
        "templateType": t.get("templateType", EN["templateType"]),
        "routeName": t.get("routeName", EN["routeName"]),
        "routePriority": t.get("routePriority", EN["routePriority"]),
        "routeCondition": t.get("routeCondition", EN["routeCondition"]),
        "preferenceName": t.get("preferenceName", EN["preferenceName"]),
        "dndEnabled": t.get("dndEnabled", EN["dndEnabled"]),
        "dndStart": t.get("dndStart", EN["dndStart"]),
        "dndEnd": t.get("dndEnd", EN["dndEnd"]),
        "create": create_val,
        "edit": edit_val,
        "delete": delete_val,
        "confirmDelete": t.get("confirmDelete", EN["confirmDelete"]),
        "operationSuccess": t.get("operationSuccess", EN["operationSuccess"])
    }

def build_page_json(locale):
    t = T.get(locale, {})
    return {
        "message": t.get("msg_message", EN["msg_message"]),
        "messageList": t.get("msg_messageList", EN["msg_messageList"]),
        "batchSend": t.get("msg_batchSend", EN["msg_batchSend"]),
        "deadLetter": t.get("msg_deadLetter", EN["msg_deadLetter"]),
        "template": t.get("msg_template", EN["msg_template"]),
        "templateList": t.get("msg_templateList", EN["msg_templateList"]),
        "notification": t.get("msg_notification", EN["msg_notification"]),
        "notificationList": t.get("msg_notificationList", EN["msg_notificationList"]),
        "route": t.get("msg_route", EN["msg_route"]),
        "routeRule": t.get("msg_routeRule", EN["msg_routeRule"]),
        "preference": t.get("msg_preference", EN["msg_preference"]),
        "messagePreference": t.get("msg_messagePreference", EN["msg_messagePreference"])
    }

def main():
    success = 0
    for locale in LOCALES:
        print(f"Processing {locale}...")
        comm_data = read_comm(locale)
        dest_dir = os.path.join(DEST_BASE, locale)
        os.makedirs(dest_dir, exist_ok=True)
        business = build_business_json(locale, comm_data)
        page = build_page_json(locale)
        with open(os.path.join(dest_dir, "business.json"), "w", encoding="utf-8") as f:
            json.dump(business, f, ensure_ascii=False, indent=2)
        with open(os.path.join(dest_dir, "page.json"), "w", encoding="utf-8") as f:
            json.dump(page, f, ensure_ascii=False, indent=2)
        success += 1
    print(f"\nDone! Generated files for {success}/{len(LOCALES)} locales.")

if __name__ == "__main__":
    main()
