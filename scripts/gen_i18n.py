#!/usr/bin/env python3
"""Generate message-web business.json and page.json for 79 locales."""

import json
import os

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

# message-web specific translations by locale
# Keys: messageTitle, messageId, messageChannel, messageRecipient, messageSubject,
#       messageSendTime, messageConfirmDelete, operationSuccess
#       templateName, templateContent, templateType,
#       routeName, routePriority, routeCondition,
#       preferenceName, dndEnabled, dndStart, dndEnd
#       confirmDelete (top-level)
EN = {
    "messageTitle": "Message Management", "messageId": "Message ID",
    "messageChannel": "Channel", "messageRecipient": "Recipient",
    "messageSubject": "Subject", "messageSendTime": "Sent At",
    "messageConfirmDelete": 'Are you sure you want to delete "{id}"?',
    "operationSuccess": "Success",
    "templateName": "Template Name", "templateContent": "Template Content",
    "templateType": "Template Type", "routeName": "Route Name",
    "routePriority": "Priority", "routeCondition": "Condition",
    "preferenceName": "Preference Name", "dndEnabled": "DND",
    "dndStart": "DND Start", "dndEnd": "DND End",
    "confirmDelete": 'Are you sure you want to delete "{id}"?',
    # page.json keys
    "msg_message": "Message", "msg_messageList": "Message List",
    "msg_batchSend": "Batch Send", "msg_deadLetter": "Dead Letter",
    "msg_template": "Template", "msg_templateList": "Template List",
    "msg_notification": "Notification", "msg_notificationList": "Notification List",
    "msg_route": "Route", "msg_routeRule": "Route Rule",
    "msg_preference": "Preference", "msg_messagePreference": "Message Preference",
}

# Manual translations for each locale (message-web specific terms)
TRANSLATIONS = {}

# === Using en-US as base for problematic locales with MYMEMORY content ===
EN_FALLBACK = {
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

TRANSLATIONS["lo-LA"] = {
    "messageTitle": "ຈັດການຂໍ້ຄວາມ", "messageId": "ID ຂໍ້ຄວາມ",
    "messageChannel": "ຊ່ອງທາງ", "messageRecipient": "ຜູ້ຮັບ",
    "messageSubject": "ຫົວຂໍ້", "messageSendTime": "ເວລາສົ່ງ",
    "messageConfirmDelete": 'ທ່ານແນ່ໃຈວ່າຕ້ອງການລຶບ "{id}" ບໍ?',
    "operationSuccess": "ສຳເລັດ",
    "templateName": "ຊື່ແມ່ແບບ", "templateContent": "ເນື້ອຫາແມ່ແບບ",
    "templateType": "ປະເພດແມ່ແບບ", "routeName": "ຊື່ເສັນທາງ",
    "routePriority": "ຄວາມສຳຄັນ", "routeCondition": "ເງື່ອນໄຂເສັນທາງ",
    "preferenceName": "ຊື່ການຕັ້ງຄ່າ", "dndEnabled": "ຫ້າມລົບກວນ",
    "dndStart": "ເລີ່ມຫ້າມລົບກວນ", "dndEnd": "ສິ້ນສຸດຫ້າມລົບກວນ",
    "confirmDelete": 'ທ່ານແນ່ໃຈວ່າຕ້ອງການລຶບ "{id}" ບໍ?',
    "msg_message": "ຂໍ້ຄວາມ", "msg_messageList": "ລາຍການຂໍ້ຄວາມ",
    "msg_batchSend": "ສົ່ງໝົດ", "msg_deadLetter": "ຄິວຈົດຫມາຍຕາຍ",
    "msg_template": "ແມ່ແບບ", "msg_templateList": "ລາຍການແມ່ແບບ",
    "msg_notification": "ການແຈ້ງເຕືອນ", "msg_notificationList": "ລາຍການແຈ້ງເຕືອນ",
    "msg_route": "ເສັນທາງ", "msg_routeRule": "ກົດລະບຽບເສັນທາງ",
    "msg_preference": "ການຕັ້ງຄ່າ", "msg_messagePreference": "ການຕັ້ງຄ່າຂໍ້ຄວາມ",
}

TRANSLATIONS["my-MM"] = {
    "messageTitle": "စာစီမံခန့်ခွ�မှု", "messageId": "စာ ID",
    "messageChannel": "ချန်နယ်", "messageRecipient": "လက်ခံသူ",
    "messageSubject": "ခေါင်းစဉ်", "messageSendTime": "ပို့သည့်အချိန်",
    "messageConfirmDelete": '"{id}" ကိုဖျက်ရန် သေချာပါသလား?',
    "operationSuccess": "အောင်မြင်ပါသည်",
    "templateName": "တန်းပလိုက်အမည်", "templateContent": "တန်းပလိုက်အကြောင်းအရာ",
    "templateType": "တန်းပလိုက်အမျိုးအစား", "routeName": "လမ်းကြောင်းအမည်",
    "routePriority": "ဦးစားပေး", "routeCondition": "လမ်းကြောင်းအခြေအနေ",
    "preferenceName": "စိတ်ကြိုက်အမည်", "dndEnabled": "DND",
    "dndStart": "DND စတင်", "dndEnd": "DND အဆုံး",
    "confirmDelete": '"{id}" ကိုဖျက်ရန် သေချာပါသလား?',
    "msg_message": "စာ", "msg_messageList": "စာစာရင်း",
    "msg_batchSend": "အုပ်စုလိုက်ပို့", "msg_deadLetter": "သောစာအိတ်",
    "msg_template": "တန်းပလိုက်", "msg_templateList": "တန်းပလိုက်စာရင်း",
    "msg_notification": "အသိပေးချက်", "msg_notificationList": "အသိပေးချက်စာရင်း",
    "msg_route": "လမ်းကြောင်း", "msg_routeRule": "လမ်းကြောင်းစည်းမျဉ်း",
    "msg_preference": "စိတ်ကြိုက်", "msg_messagePreference": "စာစိတ်ကြိုက်",
}

TRANSLATIONS["ne-NP"] = {
    "messageTitle": "सन्देश व्यवस्थापन", "messageId": "सन्देश ID",
    "messageChannel": "च्यानल", "messageRecipient": "प्रापक",
    "messageSubject": "विषय", "messageSendTime": "पठाएको समय",
    "messageConfirmDelete": 'के तपाईं "{id}" मेटाउन निश्चित हुनुहुन्छ?',
    "operationSuccess": "सफल भयो",
    "templateName": "टेम्पलेट नाम", "templateContent": "टेम्पलेट सामग्री",
    "templateType": "टेम्पलेट प्रकार", "routeName": "मार्ग नाम",
    "routePriority": "प्राथमिकता", "routeCondition": "मार्ग सर्त",
    "preferenceName": "अभिरुचि नाम", "dndEnabled": "DND",
    "dndStart": "DND सुरु", "dndEnd": "DND अन्त्य",
    "confirmDelete": 'के तपाईं "{id}" मेटाउन निश्चित हुनुहुन्छ?',
    "msg_message": "सन्देश", "msg_messageList": "सन्देश सूची",
    "msg_batchSend": "ब्याच पठाउनुहोस्", "msg_deadLetter": "डेड लेटर",
    "msg_template": "टेम्पलेट", "msg_templateList": "टेम्पलेट सूची",
    "msg_notification": "सूचना", "msg_notificationList": "सूचना सूची",
    "msg_route": "मार्ग", "msg_routeRule": "मार्ग नियम",
    "msg_preference": "अभिरुचि", "msg_messagePreference": "सन्देश अभिरुचि",
}

TRANSLATIONS["si-LK"] = {
    "messageTitle": "පණිවිඩ කළමනාකරණය", "messageId": "පණිවිඩ ID",
    "messageChannel": "නාලිකාව", "messageRecipient": "ලබන්නා",
    "messageSubject": "විෂයය", "messageSendTime": "යැවූ වේලාව",
    "messageConfirmDelete": 'ඔබට "{id}" මැකීමට අවශ්‍ය බව විශ්වාසද?',
    "operationSuccess": "සාර්ථකයි",
    "templateName": "අච්චු නාමය", "templateContent": "අච්චු අන්තර්ගතය",
    "templateType": "අච්චු වර්ගය", "routeName": "මාර්ග නාමය",
    "routePriority": "ප්‍රමුඛතාව", "routeCondition": "මාර්ග කොන්දේසි",
    "preferenceName": "අභිරුචි නාමය", "dndEnabled": "DND",
    "dndStart": "DND ආරම්භය", "dndEnd": "DND අවසානය",
    "confirmDelete": 'ඔබට "{id}" මැකීමට අවශ්‍ය බව විශ්වාසද?',
    "msg_message": "පණිවිඩය", "msg_messageList": "පණිවිඩ ලැයිස්තුව",
    "msg_batchSend": "කණ්ඩායම් යවන්න", "msg_deadLetter": "මල ලිපි",
    "msg_template": "අච්චුව", "msg_templateList": "අච්චු ලැයිස්තුව",
    "msg_notification": "දැනුම්දීම", "msg_notificationList": "දැනුම්දීම් ලැයිස්තුව",
    "msg_route": "මාර්ගය", "msg_routeRule": "මාර්ග රීතිය",
    "msg_preference": "අභිරුචිය", "msg_messagePreference": "පණිවිඩ අභිරුචිය",
}

TRANSLATIONS["ur-PK"] = {
    "messageTitle": "پیغام مینجمنٹ", "messageId": "پیغام ID",
    "messageChannel": "چینل", "messageRecipient": "وصول کنندہ",
    "messageSubject": "موضوع", "messageSendTime": "بھیجنے کا وقت",
    "messageConfirmDelete": 'کیا آپ "{id}" حذف کرنا چاہتے ہیں؟',
    "operationSuccess": "کامیاب",
    "templateName": "ٹیمپلیٹ نام", "templateContent": "ٹیمپلیٹ مواد",
    "templateType": "ٹیمپلیٹ کی قسم", "routeName": "رٹا نام",
    "routePriority": "ترجیح", "routeCondition": "رٹا شرط",
    "preferenceName": "ترجیح کا نام", "dndEnabled": "DND",
    "dndStart": "DND شروع", "dndEnd": "DND ختم",
    "confirmDelete": 'کیا آپ "{id}" حذف کرنا چاہتے ہیں؟',
    "msg_message": "پیغام", "msg_messageList": "پیغام کی فہرست",
    "msg_batchSend": "بیچ بھیجیں", "msg_deadLetter": "ڈیڈ لیٹر",
    "msg_template": "ٹیمپلیٹ", "msg_templateList": "ٹیمپلیٹ کی فہرست",
    "msg_notification": "اطلاع", "msg_notificationList": "اطلاع کی فہرست",
    "msg_route": "راستہ", "msg_routeRule": "راسے کا قاعدہ",
    "msg_preference": "ترجیح", "msg_messagePreference": "پیغام کی ترجیح",
}

TRANSLATIONS["zu-ZA"] = {
    "messageTitle": "Ukuphatha Imilayezo", "messageId": "ID Yomlayezo",
    "messageChannel": "Isiteshi", "messageRecipient": "Ummkeli",
    "messageSubject": "Isihloko", "messageSendTime": "Isikhathi sokuthumela",
    "messageConfirmDelete": 'Uqinisekile ukuthi ufisa ukususa "{id}"?',
    "operationSuccess": "Kuphumelele",
    "templateName": "Igama le-Template", "templateContent": "Okuqukethwe yi-Template",
    "templateType": "Uhlobo lwe-Template", "routeName": "Igama le-Route",
    "routePriority": "Ukubaluleka", "routeCondition": "Isimo se-Route",
    "preferenceName": "Igama le-Preference", "dndEnabled": "DND",
    "dndStart": "Qala i-DND", "dndEnd": "Qeda i-DND",
    "confirmDelete": 'Uqinisekile ukuthi ufisa ukususa "{id}"?',
    "msg_message": "Umlayezo", "msg_messageList": "Uhlu lwemilayezo",
    "msg_batchSend": "Thumela ngobuningi", "msg_deadLetter": "I-Dead Letter",
    "msg_template": "I-Template", "msg_templateList": "Uhlu lwama-Template",
    "msg_notification": "Isaziso", "msg_notificationList": "Uhlu lwezaziso",
    "msg_route": "i-Route", "msg_routeRule": "Umthetho we-Route",
    "msg_preference": "i-Preference", "msg_messagePreference": "I-Preference yomlayezo",
}

TRANSLATIONS["ka-GE"] = {
    "messageTitle": "შეტყობინებების მართვა", "messageId": "შეტყობინების ID",
    "messageChannel": "არხი", "messageRecipient": "მიმღები",
    "messageSubject": "თემა", "messageSendTime": "გაგზავნის დრო",
    "messageConfirmDelete": 'დარწმუნებული ხართ, რომ გსურთ "{id}"-ის წაშლა?',
    "operationSuccess": "წარმატებული",
    "templateName": "შაბლონის სახელი", "templateContent": "შაბლონის შინაარსი",
    "templateType": "შაბლონის ტიპი", "routeName": "მარშრუტის სახელი",
    "routePriority": "პრიორიტეტი", "routeCondition": "მარშრუტის პირობა",
    "preferenceName": "პრეფერენციის სახელი", "dndEnabled": "DND",
    "dndStart": "DND დაწყება", "dndEnd": "DND დასრულება",
    "confirmDelete": 'დარწმუნებული ხართ, რომ გსურთ "{id}"-ის წაშლა?',
    "msg_message": "შეტყობინება", "msg_messageList": "შეტყობინებების სია",
    "msg_batchSend": "სტატიკური გაგზავნა", "msg_deadLetter": "მკვდარი წერილები",
    "msg_template": "შაბლონი", "msg_templateList": "შაბლონების სია",
    "msg_notification": "შეტყობინება", "msg_notificationList": "შეტყობინებების სია",
    "msg_route": "მარშრუტი", "msg_routeRule": "მარშრუტის წესი",
    "msg_preference": "პრეფერენცია", "msg_messagePreference": "შეტყობინების პრეფერენცია",
}

# Use English fallback for locales with corrupted MYMEMORY content that I don't have proper translations
EN_FALLBACK_LOCALES = ["mn-MN", "sr-RS", "sq-AL", "sw-KE"]
for loc in EN_FALLBACK_LOCALES:
    if loc not in TRANSLATIONS:
        TRANSLATIONS[loc] = EN_FALLBACK.copy()

def read_comm(locale):
    """Read comm common.json for a locale."""
    path = os.path.join(COMM_BASE, locale, "common.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"  Warning: cannot read comm for {locale}: {e}")
        return {}

def is_corrupted(comm_data):
    """Check if comm data is MYMEMORY warning."""
    if not comm_data:
        return True
    first_val = str(list(comm_data.values())[0]) if comm_data else ""
    return "MYMEMORY WARNING" in first_val

def get_comm_value(comm_data, key, fallback=None):
    """Get value from comm data, handling nested keys with dot notation."""
    if key in comm_data:
        return comm_data[key]
    if "." in key:
        parts = key.split(".")
        d = comm_data
        for p in parts:
            if isinstance(d, dict) and p in d:
                d = d[p]
            else:
                return fallback
        return d
    return fallback

def build_business_json(locale, comm_data):
    """Build business.json content for a locale."""
    is_corr = is_corrupted(comm_data)
    t = TRANSLATIONS.get(locale, {})

    def c(key):
        """Get translated key: prefer manual translation, then comm, then en."""
        if key in t:
            return t[key]
        if not is_corr and key in comm_data:
            return comm_data[key]
        if key in EN:
            return EN[key]
        return key

    # For create/edit/delete, prefer comm if available
    create_val = c("create") if not is_corr and "create" in comm_data else t.get("create", EN.get("create", "Add"))
    edit_val = c("edit") if not is_corr and "edit" in comm_data else t.get("edit", EN.get("edit", "Edit"))
    delete_val = c("delete") if not is_corr and "delete" in comm_data else t.get("delete", EN.get("delete", "Delete"))

    # For confirmDelete at business.json top-level (same as message.confirmDelete)
    confirm_top = t.get("confirmDelete", EN["confirmDelete"])

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
        "confirmDelete": confirm_top,
        "operationSuccess": t.get("operationSuccess", EN["operationSuccess"])
    }

def build_page_json(locale, comm_data):
    """Build page.json content for a locale."""
    t = TRANSLATIONS.get(locale, {})

    def p(key, en_key):
        if key in t:
            return t[key]
        return EN.get(en_key, en_key)

    return {
        "message": p("msg_message", "msg_message"),
        "messageList": p("msg_messageList", "msg_messageList"),
        "batchSend": p("msg_batchSend", "msg_batchSend"),
        "deadLetter": p("msg_deadLetter", "msg_deadLetter"),
        "template": p("msg_template", "msg_template"),
        "templateList": p("msg_templateList", "msg_templateList"),
        "notification": p("msg_notification", "msg_notification"),
        "notificationList": p("msg_notificationList", "msg_notificationList"),
        "route": p("msg_route", "msg_route"),
        "routeRule": p("msg_routeRule", "msg_routeRule"),
        "preference": p("msg_preference", "msg_preference"),
        "messagePreference": p("msg_messagePreference", "msg_messagePreference")
    }

def main():
    success = 0
    for locale in LOCALES:
        print(f"Processing {locale}...")
        comm_data = read_comm(locale)

        dest_dir = os.path.join(DEST_BASE, locale)
        os.makedirs(dest_dir, exist_ok=True)

        business = build_business_json(locale, comm_data)
        page = build_page_json(locale, comm_data)

        with open(os.path.join(dest_dir, "business.json"), "w", encoding="utf-8") as f:
            json.dump(business, f, ensure_ascii=False, indent=2)

        with open(os.path.join(dest_dir, "page.json"), "w", encoding="utf-8") as f:
            json.dump(page, f, ensure_ascii=False, indent=2)

        success += 1

    print(f"\nDone! Generated files for {success}/{len(LOCALES)} locales.")

if __name__ == "__main__":
    main()
