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

# === af-ZA Afrikaans ===
T["af-ZA"] = {
    "messageTitle": "Boodskapbestuur", "messageId": "Boodskap-ID",
    "messageChannel": "Kanaal", "messageRecipient": "Ontvanger",
    "messageSubject": "Onderwerp", "messageSendTime": "Gestuur om",
    "messageConfirmDelete": 'Is jy seker jy wil "{id}" uitvee?',
    "operationSuccess": "Sukses",
    "templateName": "Sjabloonnaam", "templateContent": "Sjablooninhoud",
    "templateType": "Sjabloontipe", "routeName": "Roetenaam",
    "routePriority": "Prioriteit", "routeCondition": "Roete-voorwaarde",
    "preferenceName": "Voorkeur-naam", "dndEnabled": "Moenie-Storen",
    "dndStart": "Moenie-Storen Begin", "dndEnd": "Moenie-Storen Einde",
    "confirmDelete": 'Is jy seker jy wil "{id}" uitvee?',
    "msg_message": "Boodskap", "msg_messageList": "Boodskaplys",
    "msg_batchSend": "Bondelstuur", "msg_deadLetter": "Dead Letter",
    "msg_template": "Sjabloon", "msg_templateList": "Sjabloonlys",
    "msg_notification": "Kennisgewing", "msg_notificationList": "Kennisgewinglys",
    "msg_route": "Roete", "msg_routeRule": "Roete-reel",
    "msg_preference": "Voorkeur", "msg_messagePreference": "Boodskapvoorkeur",
}

# === am-ET Amharic ===
T["am-ET"] = {
    "messageTitle": "የመልእክት አስተዳደር", "messageId": "የመልእክት መታወቂያ",
    "messageChannel": "ቻናል", "messageRecipient": "ተቀባይ",
    "messageSubject": "ርዕስ", "messageSendTime": "የተላከበት ጊዜ",
    "messageConfirmDelete": 'እርግጠኛ ነዎት "{id}" ማስወገድ ይፈልጋሉ?',
    "operationSuccess": "ተሳክቷል",
    "templateName": "የአብነት ስም", "templateContent": "የአብነት ይዘት",
    "templateType": "የአብነት አይነት", "routeName": "የመንገድ ስም",
    "routePriority": "ቅድሚያ", "routeCondition": "የመንገድ ሁኔታ",
    "preferenceName": "የምርጫ ስም", "dndEnabled": "አትረታታ",
    "dndStart": "አትረታታ ጀምር", "dndEnd": "አትረታታ ጨርስ",
    "confirmDelete": 'እርግጠኛ ነዎት "{id}" ማስወገድ ይፈልጋሉ?',
    "msg_message": "መልእክት", "msg_messageList": "የመልእክት ዝርዝር",
    "msg_batchSend": "የቡድን መላኪያ", "msg_deadLetter": "የሞተ ደብዳቤ",
    "msg_template": "አብነት", "msg_templateList": "የአብነት ዝርዝር",
    "msg_notification": "ማሳወቂያ", "msg_notificationList": "የማሳወቂያ ዝርዝር",
    "msg_route": "መንገድ", "msg_routeRule": "የመንገድ ደንብ",
    "msg_preference": "ምርጫ", "msg_messagePreference": "የመልእክት ምርጫ",
}

# === ar-EG Arabic (Egypt) ===
T["ar-EG"] = {
    "messageTitle": "إدارة الرسائل", "messageId": "معرف الرسالة",
    "messageChannel": "القناة", "messageRecipient": "المستلم",
    "messageSubject": "الموضوع", "messageSendTime": "وقت الإرسال",
    "messageConfirmDelete": 'هل أنت متأكد من حذف "{id}"؟',
    "operationSuccess": "تمت العملية بنجاح",
    "templateName": "اسم القالب", "templateContent": "محتوى القالب",
    "templateType": "نوع القالب", "routeName": "اسم المسار",
    "routePriority": "الأولوية", "routeCondition": "شرط المسار",
    "preferenceName": "اسم التفضيل", "dndEnabled": "عدم الإزعاج",
    "dndStart": "بدء عدم الإزعاج", "dndEnd": "إنهاء عدم الإزعاج",
    "confirmDelete": 'هل أنت متأكد من حذف "{id}"؟',
    "msg_message": "رسالة", "msg_messageList": "قائمة الرسائل",
    "msg_batchSend": "إرسال مجمّع", "msg_deadLetter": "الرسائل الميتة",
    "msg_template": "قالب", "msg_templateList": "قائمة القوالب",
    "msg_notification": "إشعار", "msg_notificationList": "قائمة الإشعارات",
    "msg_route": "مسار", "msg_routeRule": "قاعدة المسار",
    "msg_preference": "تفضيل", "msg_messagePreference": "تفضيل الرسائل",
}

# === ar-SA Arabic (Saudi) ===
T["ar-SA"] = {
    "messageTitle": "إدارة الرسائل", "messageId": "معرّف الرسالة",
    "messageChannel": "القناة", "messageRecipient": "المستلم",
    "messageSubject": "الموضوع", "messageSendTime": "وقت الإرسال",
    "messageConfirmDelete": 'هل أنت متأكد من حذف "{id}"؟',
    "operationSuccess": "تمت العملية بنجاح",
    "templateName": "اسم القالب", "templateContent": "محتوى القالب",
    "templateType": "نوع القالب", "routeName": "اسم المسار",
    "routePriority": "الأولوية", "routeCondition": "شرط المسار",
    "preferenceName": "اسم التفضيل", "dndEnabled": "عدم الإزعاج",
    "dndStart": "بدء عدم الإزعاج", "dndEnd": "إنهاء عدم الإزعاج",
    "confirmDelete": 'هل أنت متأكد من حذف "{id}"؟',
    "msg_message": "رسالة", "msg_messageList": "قائمة الرسائل",
    "msg_batchSend": "إرسال مجمّع", "msg_deadLetter": "الرسائل الميتة",
    "msg_template": "قالب", "msg_templateList": "قائمة القوالب",
    "msg_notification": "إشعار", "msg_notificationList": "قائمة الإشعارات",
    "msg_route": "مسار", "msg_routeRule": "قاعدة المسار",
    "msg_preference": "تفضيل", "msg_messagePreference": "تفضيل الرسائل",
}

# === az-AZ Azerbaijani ===
T["az-AZ"] = {
    "messageTitle": "Mesaj İdarəetməsi", "messageId": "Mesaj ID",
    "messageChannel": "Kanal", "messageRecipient": "Alıcı",
    "messageSubject": "Mövzu", "messageSendTime": "Göndərmə vaxtı",
    "messageConfirmDelete": '"{id}" silmək istədiyinizə əminsiniz?',
    "operationSuccess": "Uğurlu oldu",
    "templateName": "Şablon adı", "templateContent": "Şablon məzmunu",
    "templateType": "Şablon növü", "routeName": "Marşrut adı",
    "routePriority": "Prioritet", "routeCondition": "Marşrut şərti",
    "preferenceName": "Tərcih adı", "dndEnabled": "Narahat etməyin",
    "dndStart": "Narahat etməyin Başlanğıc", "dndEnd": "Narahat etməyin Son",
    "confirmDelete": '"{id}" silmək istədiyinizə əminsiniz?',
    "msg_message": "Mesaj", "msg_messageList": "Mesaj siyahısı",
    "msg_batchSend": "Toplu göndərmə", "msg_deadLetter": "Ölübə",
    "msg_template": "Şablon", "msg_templateList": "Şablon siyahısı",
    "msg_notification": "Bildiriş", "msg_notificationList": "Bildiriş siyahısı",
    "msg_route": "Marşrut", "msg_routeRule": "Marşrut qaydası",
    "msg_preference": "Tərcih", "msg_messagePreference": "Mesaj tərcihi",
}

# === bg-BG Bulgarian ===
T["bg-BG"] = {
    "messageTitle": "Управление на съобщения", "messageId": "ID на съобщение",
    "messageChannel": "Канал", "messageRecipient": "Получател",
    "messageSubject": "Тема", "messageSendTime": "Време на изпращане",
    "messageConfirmDelete": 'Сигурни ли сте, че искате да изтриете "{id}"?',
    "operationSuccess": "Успешно",
    "templateName": "Име на шаблон", "templateContent": "Съдържание на шаблон",
    "templateType": "Тип на шаблон", "routeName": "Име на маршрут",
    "routePriority": "Приоритет", "routeCondition": "Условие за маршрут",
    "preferenceName": "Име на предпочитание", "dndEnabled": "Не безпокойте",
    "dndStart": "Начало на Не безпокойте", "dndEnd": "Край на Не безпокойте",
    "confirmDelete": 'Сигурни ли сте, че искате да изтриете "{id}"?',
    "msg_message": "Съобщение", "msg_messageList": "Списък със съобщения",
    "msg_batchSend": "Групово изпращане", "msg_deadLetter": "Мъртва поща",
    "msg_template": "Шаблон", "msg_templateList": "Списък с шаблони",
    "msg_notification": "Известие", "msg_notificationList": "Списък с известия",
    "msg_route": "Маршрут", "msg_routeRule": "Правило за маршрут",
    "msg_preference": "Предпочитание", "msg_messagePreference": "Предпочитание за съобщения",
}

# === bn-BD Bengali ===
T["bn-BD"] = {
    "messageTitle": "বার্তা ব্যবস্থাপনা", "messageId": "বার্তা আইডি",
    "messageChannel": "চ্যানেল", "messageRecipient": "প্রাপক",
    "messageSubject": "বিষয়", "messageSendTime": "পাঠানোর সময়",
    "messageConfirmDelete": 'আপনি কি নিশ্চিত "{id}" মুছে ফেলতে চান?',
    "operationSuccess": "সফল",
    "templateName": "টেমপ্লেটের নাম", "templateContent": "টেমপ্লেট বিষয়বস্তু",
    "templateType": "টেমপ্লেটের ধরন", "routeName": "রুটের নাম",
    "routePriority": "অগ্রাধিকার", "routeCondition": "রুটের শর্ত",
    "preferenceName": "পছন্দের নাম", "dndEnabled": "বিঘ্নিত করবেন না",
    "dndStart": "DND শুরু", "dndEnd": "DND শেষ",
    "confirmDelete": 'আপনি কি নিশ্চিত "{id}" মুছে ফেলতে চান?',
    "msg_message": "বার্তা", "msg_messageList": "বার্তার তালিকা",
    "msg_batchSend": "ব্যাচ পাঠান", "msg_deadLetter": "মৃত চিঠি",
    "msg_template": "টেমপ্লেট", "msg_templateList": "টেমপ্লেট তালিকা",
    "msg_notification": "বিজ্ঞপ্তি", "msg_notificationList": "বিজ্ঞপ্তি তালিকা",
    "msg_route": "রুট", "msg_routeRule": "রুট নিয়ম",
    "msg_preference": "পছন্দ", "msg_messagePreference": "বার্তা পছন্দ",
}

# === bs-BA Bosnian ===
T["bs-BA"] = {
    "messageTitle": "Upravljanje porukama", "messageId": "ID poruke",
    "messageChannel": "Kanal", "messageRecipient": "Primalac",
    "messageSubject": "Tema", "messageSendTime": "Vrijeme slanja",
    "messageConfirmDelete": 'Da li ste sigurni da želite obrisati "{id}"?',
    "operationSuccess": "Uspješno",
    "templateName": "Naziv predloška", "templateContent": "Sadržaj predloška",
    "templateType": "Vrsta predloška", "routeName": "Naziv rute",
    "routePriority": "Prioritet", "routeCondition": "Uslov rute",
    "preferenceName": "Naziv postavke", "dndEnabled": "Ne uznemiravaj",
    "dndStart": "Ne uznemiravaj Početak", "dndEnd": "Ne uznemiravaj Kraj",
    "confirmDelete": 'Da li ste sigurni da želite obrisati "{id}"?',
    "msg_message": "Poruka", "msg_messageList": "Lista poruka",
    "msg_batchSend": "Grupno slanje", "msg_deadLetter": "Mrtvo pismo",
    "msg_template": "Predložak", "msg_templateList": "Lista predložaka",
    "msg_notification": "Obavijest", "msg_notificationList": "Lista obavijesti",
    "msg_route": "Ruta", "msg_routeRule": "Pravilo rute",
    "msg_preference": "Postavka", "msg_messagePreference": "Postavka poruka",
}

# === ca-ES Catalan ===
T["ca-ES"] = {
    "messageTitle": "Gestió de missatges", "messageId": "ID de missatge",
    "messageChannel": "Canal", "messageRecipient": "Destinatari",
    "messageSubject": "Assumpte", "messageSendTime": "Hora d'enviament",
    "messageConfirmDelete": 'Esteu segur que voleu eliminar "{id}"?',
    "operationSuccess": "Èxit",
    "templateName": "Nom de la plantilla", "templateContent": "Contingut de la plantilla",
    "templateType": "Tipus de plantilla", "routeName": "Nom de la ruta",
    "routePriority": "Prioritat", "routeCondition": "Condició de ruta",
    "preferenceName": "Nom de la preferència", "dndEnabled": "No molestar",
    "dndStart": "No molestar Inici", "dndEnd": "No molestar Fi",
    "confirmDelete": 'Esteu segur que voleu eliminar "{id}"?',
    "msg_message": "Missatge", "msg_messageList": "Llista de missatges",
    "msg_batchSend": "Enviat per lots", "msg_deadLetter": "Carta morta",
    "msg_template": "Plantilla", "msg_templateList": "Llista de plantilles",
    "msg_notification": "Notificació", "msg_notificationList": "Llista de notificacions",
    "msg_route": "Ruta", "msg_routeRule": "Regla de ruta",
    "msg_preference": "Preferència", "msg_messagePreference": "Preferència de missatges",
}

# === cs-CZ Czech ===
T["cs-CZ"] = {
    "messageTitle": "Správa zpráv", "messageId": "ID zprávy",
    "messageChannel": "Kanál", "messageRecipient": "Příjemce",
    "messageSubject": "Předmět", "messageSendTime": "Čas odeslání",
    "messageConfirmDelete": 'Opravdu chcete smazat "{id}"?',
    "operationSuccess": "Úspěch",
    "templateName": "Název šablony", "templateContent": "Obsah šablony",
    "templateType": "Typ šablony", "routeName": "Název trasy",
    "routePriority": "Priorita", "routeCondition": "Podmínka trasy",
    "preferenceName": "Název předvolby", "dndEnabled": "Nerušit",
    "dndStart": "Nerušit Začátek", "dndEnd": "Nerušit Konec",
    "confirmDelete": 'Opravdu chcete smazat "{id}"?',
    "msg_message": "Zpráva", "msg_messageList": "Seznam zpráv",
    "msg_batchSend": "Hromadné odeslání", "msg_deadLetter": "Mrtvá pošta",
    "msg_template": "Šablona", "msg_templateList": "Seznam šablon",
    "msg_notification": "Oznámení", "msg_notificationList": "Seznam oznámení",
    "msg_route": "Trasa", "msg_routeRule": "Pravidlo trasy",
    "msg_preference": "Předvolba", "msg_messagePreference": "Předvolba zpráv",
}

# === cy-GB Welsh ===
T["cy-GB"] = {
    "messageTitle": "Rheolaeth Negeseuon", "messageId": "ID Neges",
    "messageChannel": "Sianel", "messageRecipient": "Derbynnydd",
    "messageSubject": "Pwnc", "messageSendTime": "Afonfonwyd am",
    "messageConfirmDelete": 'Ydych chi\'n siŵr eich bod eisiau dileu "{id}"?',
    "operationSuccess": "Llwyddiant",
    "templateName": "Enw'r Templed", "templateContent": "Cynnwys y Templed",
    "templateType": "Math o Dempled", "routeName": "Enw'r Llwybr",
    "routePriority": "Blaenoriaeth", "routeCondition": "Amod Llwybr",
    "preferenceName": "Enw'r Dewisiad", "dndEnabled": "Peidiwch â Tharfu",
    "dndStart": "Peidiwch â Tharfu Dechrau", "dndEnd": "Peidiwch â Tharfu Diwedd",
    "confirmDelete": 'Ydych chi\'n siŵr eich bod eisiau dileu "{id}"?',
    "msg_message": "Neges", "msg_messageList": "Rhestr Negeseuon",
    "msg_batchSend": "Anfon Swp", "msg_deadLetter": "Llythyr Marw",
    "msg_template": "Templed", "msg_templateList": "Rhestr Templets",
    "msg_notification": "Hysbysiad", "msg_notificationList": "Rhestr Hysbysiadau",
    "msg_route": "Llwybr", "msg_routeRule": "Rheol Llwybr",
    "msg_preference": "Dewisiad", "msg_messagePreference": "Dewisiad Neges",
}

# === da-DK Danish ===
T["da-DK"] = {
    "messageTitle": "Beskedsadministration", "messageId": "Besked-ID",
    "messageChannel": "Kanal", "messageRecipient": "Modtager",
    "messageSubject": "Emne", "messageSendTime": "Sendt kl.",
    "messageConfirmDelete": 'Er du sikker på, at du vil slette "{id}"?',
    "operationSuccess": "Lykkedes",
    "templateName": "Skabelonnavn", "templateContent": "Skabelonindhold",
    "templateType": "Skabelontype", "routeName": "Rutenavn",
    "routePriority": "Prioritet", "routeCondition": "Rutebetingelse",
    "preferenceName": "Præferencenavn", "dndEnabled": "Forstyr ikke",
    "dndStart": "Forstyr ikke Start", "dndEnd": "Forstyr ikke Slut",
    "confirmDelete": 'Er du sikker på, at du vil slette "{id}"?',
    "msg_message": "Besked", "msg_messageList": "Beskedliste",
    "msg_batchSend": "Batchafsendelse", "msg_deadLetter": "Dødt brev",
    "msg_template": "Skabelon", "msg_templateList": "Skabelonliste",
    "msg_notification": "Notifikation", "msg_notificationList": "Notifikationsliste",
    "msg_route": "Rute", "msg_routeRule": "Ruteregul",
    "msg_preference": "Præference", "msg_messagePreference": "Beskedpræference",
}


# === de-AT Austrian German ===
T["de-AT"] = {
    "messageTitle": "Nachrichtenverwaltung", "messageId": "Nachrichten-ID",
    "messageChannel": "Kanal", "messageRecipient": "Empfänger",
    "messageSubject": "Betreff", "messageSendTime": "Sendezeitpunkt",
    "messageConfirmDelete": 'Sind Sie sicher, dass Sie "{id}" löschen möchten?',
    "operationSuccess": "Erfolgreich",
    "templateName": "Vorlagenname", "templateContent": "Vorlageninhalt",
    "templateType": "Vorlagetyp", "routeName": "Routenname",
    "routePriority": "Priorität", "routeCondition": "Routenbedingung",
    "preferenceName": "Einstellungsname", "dndEnabled": "Nicht stören",
    "dndStart": "Nicht stören Start", "dndEnd": "Nicht stören Ende",
    "confirmDelete": 'Sind Sie sicher, dass Sie "{id}" löschen möchten?',
    "msg_message": "Nachricht", "msg_messageList": "Nachrichtenliste",
    "msg_batchSend": "Batch-Versand", "msg_deadLetter": "Dead Letter",
    "msg_template": "Vorlage", "msg_templateList": "Vorlagenliste",
    "msg_notification": "Benachrichtigung", "msg_notificationList": "Benachrichtigungsliste",
    "msg_route": "Route", "msg_routeRule": "Routenregel",
    "msg_preference": "Einstellung", "msg_messagePreference": "Nachrichteneinstellung",
}

# === de-CH Swiss German ===
T["de-CH"] = {
    "messageTitle": "Nachrichteverwaltig", "messageId": "Nachrichte-ID",
    "messageChannel": "Kanal", "messageRecipient": "Empfänger",
    "messageSubject": "Beträf", "messageSendTime": "Sendezytpunkt",
    "messageConfirmDelete": 'Sind Sie sicher, dass Sie "{id}" lösche wönd?',
    "operationSuccess": "Erfolgriich",
    "templateName": "Vorlagename", "templateContent": "Vorlageinhalt",
    "templateType": "Vorlagetyp", "routeName": "Routename",
    "routePriority": "Priorität", "routeCondition": "Routbedingig",
    "preferenceName": "Iistelligsname", "dndEnabled": "Nicht störe",
    "dndStart": "Nicht störe Afang", "dndEnd": "Nicht Störe Ändi",
    "confirmDelete": 'Sind Sie sicher, dass Sie "{id}" lösche wönd?',
    "msg_message": "Nachricht", "msg_messageList": "Nachrichteliste",
    "msg_batchSend": "Batch-Versand", "msg_deadLetter": "Totti Brief",
    "msg_template": "Vorlag", "msg_templateList": "Vorlageliste",
    "msg_notification": "Benochrichtigung", "msg_notificationList": "Benochrichtigungsliste",
    "msg_route": "Rout", "msg_routeRule": "Roterichdig",
    "msg_preference": "Iistellig", "msg_messagePreference": "Nachrichteistellig",
}

# === de-DE German ===
T["de-DE"] = {
    "messageTitle": "Nachrichtenverwaltung", "messageId": "Nachrichten-ID",
    "messageChannel": "Kanal", "messageRecipient": "Empfänger",
    "messageSubject": "Betreff", "messageSendTime": "Sendezeitpunkt",
    "messageConfirmDelete": 'Sind Sie sicher, dass Sie "{id}" löschen möchten?',
    "operationSuccess": "Erfolgreich",
    "templateName": "Vorlagenname", "templateContent": "Vorlageninhalt",
    "templateType": "Vorlagetyp", "routeName": "Routenname",
    "routePriority": "Priorität", "routeCondition": "Routenbedingung",
    "preferenceName": "Einstellungsname", "dndEnabled": "Nicht stören",
    "dndStart": "Nicht stören Beginn", "dndEnd": "Nicht stören Ende",
    "confirmDelete": 'Sind Sie sicher, dass Sie "{id}" löschen möchten?',
    "msg_message": "Nachricht", "msg_messageList": "Nachrichtenliste",
    "msg_batchSend": "Batch-Versand", "msg_deadLetter": "Dead Letter",
    "msg_template": "Vorlage", "msg_templateList": "Vorlagenliste",
    "msg_notification": "Benachrichtigung", "msg_notificationList": "Benachrichtigungsliste",
    "msg_route": "Route", "msg_routeRule": "Routenregel",
    "msg_preference": "Einstellung", "msg_messagePreference": "Nachrichteneinstellung",
}

# === el-GR Greek ===
T["el-GR"] = {
    "messageTitle": "Διαχείριση Μηνυμάτων", "messageId": "ID Μηνύματος",
    "messageChannel": "Κανάλι", "messageRecipient": "Παραλήπτης",
    "messageSubject": "Θέμα", "messageSendTime": "Ώρα Αποστολής",
    "messageConfirmDelete": 'Είστε σίγουροι ότι θέλετε να διαγράψετε το "{id}";',
    "operationSuccess": "Επιτυχία",
    "templateName": "Όνομα Προτύπου", "templateContent": "Περιεχόμενο Προτύπου",
    "templateType": "Τύπος Προτύπου", "routeName": "Όνομα Διαδρομής",
    "routePriority": "Προτεραιότητα", "routeCondition": "Συνθήκη Διαδρομής",
    "preferenceName": "Όνομα Προτίμησης", "dndEnabled": "Μην Ενοχλείτε",
    "dndStart": "Μην Ενοχλείτε Έναρξη", "dndEnd": "Μην Ενοχλείτε Λήξη",
    "confirmDelete": 'Είστε σίγουροι ότι θέλετε να διαγράψετε το "{id}";',
    "msg_message": "Μήνυμα", "msg_messageList": "Λίστα Μηνυμάτων",
    "msg_batchSend": "Μαζική Αποστολή", "msg_deadLetter": "Νεκρό Γράμμα",
    "msg_template": "Πρότυπο", "msg_templateList": "Λίστα Προτύπων",
    "msg_notification": "Ειδοποίηση", "msg_notificationList": "Λίστα Ειδοποιήσεων",
    "msg_route": "Διαδρομή", "msg_routeRule": "Κανόνας Διαδρομής",
    "msg_preference": "Προτίμηση", "msg_messagePreference": "Προτίμηση Μηνυμάτων",
}

# === en-GB British English ===
T["en-GB"] = {
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

# === es-AR Argentine Spanish ===
T["es-AR"] = {
    "messageTitle": "Gestión de Mensajes", "messageId": "ID de Mensaje",
    "messageChannel": "Canal", "messageRecipient": "Destinatario",
    "messageSubject": "Asunto", "messageSendTime": "Hora de Envío",
    "messageConfirmDelete": '¿Estás seguro de que querés eliminar "{id}"?',
    "operationSuccess": "Operación Exitosa",
    "templateName": "Nombre de Plantilla", "templateContent": "Contenido de Plantilla",
    "templateType": "Tipo de Plantilla", "routeName": "Nombre de Ruta",
    "routePriority": "Prioridad", "routeCondition": "Condición de Ruta",
    "preferenceName": "Nombre de Preferencia", "dndEnabled": "No Molestar",
    "dndStart": "No Molestar Inicio", "dndEnd": "No Molestar Fin",
    "confirmDelete": '¿Estás seguro de que querés eliminar "{id}"?',
    "msg_message": "Mensaje", "msg_messageList": "Lista de Mensajes",
    "msg_batchSend": "Envío por Lotes", "msg_deadLetter": "Carta Muerta",
    "msg_template": "Plantilla", "msg_templateList": "Lista de Plantillas",
    "msg_notification": "Notificación", "msg_notificationList": "Lista de Notificaciones",
    "msg_route": "Ruta", "msg_routeRule": "Regla de Ruta",
    "msg_preference": "Preferencia", "msg_messagePreference": "Preferencia de Mensajes",
}

# === es-ES European Spanish ===
T["es-ES"] = {
    "messageTitle": "Gestión de Mensajes", "messageId": "ID de Mensaje",
    "messageChannel": "Canal", "messageRecipient": "Destinatario",
    "messageSubject": "Asunto", "messageSendTime": "Hora de Envío",
    "messageConfirmDelete": '¿Está seguro de que desea eliminar "{id}"?',
    "operationSuccess": "Operación Exitosa",
    "templateName": "Nombre de Plantilla", "templateContent": "Contenido de Plantilla",
    "templateType": "Tipo de Plantilla", "routeName": "Nombre de Ruta",
    "routePriority": "Prioridad", "routeCondition": "Condición de Ruta",
    "preferenceName": "Nombre de Preferencia", "dndEnabled": "No Molestar",
    "dndStart": "No Molestar Inicio", "dndEnd": "No Molestar Fin",
    "confirmDelete": '¿Está seguro de que desea eliminar "{id}"?',
    "msg_message": "Mensaje", "msg_messageList": "Lista de Mensajes",
    "msg_batchSend": "Envío por Lotes", "msg_deadLetter": "Carta Muerta",
    "msg_template": "Plantilla", "msg_templateList": "Lista de Plantillas",
    "msg_notification": "Notificación", "msg_notificationList": "Lista de Notificaciones",
    "msg_route": "Ruta", "msg_routeRule": "Regla de Ruta",
    "msg_preference": "Preferencia", "msg_messagePreference": "Preferencia de Mensajes",
}

# === es-MX Mexican Spanish ===
T["es-MX"] = {
    "messageTitle": "Gestión de Mensajes", "messageId": "ID de Mensaje",
    "messageChannel": "Canal", "messageRecipient": "Destinatario",
    "messageSubject": "Asunto", "messageSendTime": "Hora de Envío",
    "messageConfirmDelete": '¿Estás seguro de que deseas eliminar "{id}"?',
    "operationSuccess": "Operación Exitosa",
    "templateName": "Nombre de Plantilla", "templateContent": "Contenido de Plantilla",
    "templateType": "Tipo de Plantilla", "routeName": "Nombre de Ruta",
    "routePriority": "Prioridad", "routeCondition": "Condición de Ruta",
    "preferenceName": "Nombre de Preferencia", "dndEnabled": "No Molestar",
    "dndStart": "No Molestar Inicio", "dndEnd": "No Molestar Fin",
    "confirmDelete": '¿Estás seguro de que deseas eliminar "{id}"?',
    "msg_message": "Mensaje", "msg_messageList": "Lista de Mensajes",
    "msg_batchSend": "Envío por Lotes", "msg_deadLetter": "Carta Muerta",
    "msg_template": "Plantilla", "msg_templateList": "Lista de Plantillas",
    "msg_notification": "Notificación", "msg_notificationList": "Lista de Notificaciones",
    "msg_route": "Ruta", "msg_routeRule": "Regla de Ruta",
    "msg_preference": "Preferencia", "msg_messagePreference": "Preferencia de Mensajes",
}

# === et-EE Estonian ===
T["et-EE"] = {
    "messageTitle": "Sõnumite haldus", "messageId": "Sõnumi ID",
    "messageChannel": "Kanal", "messageRecipient": "Saaja",
    "messageSubject": "Teema", "messageSendTime": "Saatmise aeg",
    "messageConfirmDelete": 'Kas olete kindel, et soovite kustutada "{id}"?',
    "operationSuccess": "Edukas",
    "templateName": "Mallinimi", "templateContent": "Malli sisu",
    "templateType": "Mallitüüp", "routeName": "Marsruudi nimi",
    "routePriority": "Prioriteet", "routeCondition": "Marsruudi tingimus",
    "preferenceName": "Eelistuse nimi", "dndEnabled": "Mira häiri",
    "dndStart": "Mira häiri Algus", "dndEnd": "Mira häiri Lõpp",
    "confirmDelete": 'Kas olete kindel, et soovite kustutada "{id}"?',
    "msg_message": "Sõnum", "msg_messageList": "Sõnumite loend",
    "msg_batchSend": "Partii saatmine", "msg_deadLetter": "Surnud kiri",
    "msg_template": "Mall", "msg_templateList": "Mallide loend",
    "msg_notification": "Teavitus", "msg_notificationList": "Teavituste loend",
    "msg_route": "Marsruut", "msg_routeRule": "Marsruudi reegel",
    "msg_preference": "Eelistus", "msg_messagePreference": "Sõnumi eelistus",
}

# === eu-ES Basque ===
T["eu-ES"] = {
    "messageTitle": "Mezuen Kudeaketa", "messageId": "Mezu IDa",
    "messageChannel": "Kanala", "messageRecipient": "Hartzailea",
    "messageSubject": "Gaia", "messageSendTime": "Bidaltzeko Ordua",
    "messageConfirmDelete": '"{id}" ezabatu nahi duzurik ziur zaude?',
    "operationSuccess": "Ongi burutu da",
    "templateName": "Txantiloiaren izena", "templateContent": "Txantiloiaren edukia",
    "templateType": "Txantiloiaren mota", "routeName": "Bidearen izena",
    "routePriority": "Lehentasuna", "routeCondition": "Bidearen baldintza",
    "preferenceName": "Hobespenaren izena", "dndEnabled": "Ez molestatu",
    "dndStart": "Ez molestatu Hasiera", "dndEnd": "Ez molestatu Amaiera",
    "confirmDelete": '"{id}" ezabatu nahi duzurik ziur zaude?',
    "msg_message": "Mezua", "msg_messageList": "Mezuen zerrenda",
    "msg_batchSend": "Sorta-bidalketa", "msg_deadLetter": "Gutur minsua",
    "msg_template": "Txantiloia", "msg_templateList": "Txantiloi zerrenda",
    "msg_notification": "Jakinarazpena", "msg_notificationList": "Jakinarazpen zerrenda",
    "msg_route": "Bidea", "msg_routeRule": "Bide araua",
    "msg_preference": "Hobespena", "msg_messagePreference": "Mezuen hobespena",
}

# === fa-IR Persian/Farsi ===
T["fa-IR"] = {
    "messageTitle": "مدیریت پیام‌ها", "messageId": "شناسه پیام",
    "messageChannel": "کانال", "messageRecipient": "گیرنده",
    "messageSubject": "موضوع", "messageSendTime": "زمان ارسال",
    "messageConfirmDelete": 'آیا از حذف "{id}" اطمینان دارید؟',
    "operationSuccess": "عملیات موفق",
    "templateName": "نام الگو", "templateContent": "محتوای الگو",
    "templateType": "نوع الگو", "routeName": "نام مسیر",
    "routePriority": "اولویت", "routeCondition": "شرط مسیر",
    "preferenceName": "نام ترجیح", "dndEnabled": "مزاحم نشوید",
    "dndStart": "شروع مزاحم نشوید", "dndEnd": "پایان مزاحم نشوید",
    "confirmDelete": 'آیا از حذف "{id}" اطمینان دارید؟',
    "msg_message": "پیام", "msg_messageList": "لیست پیام‌ها",
    "msg_batchSend": "ارسال گروهی", "msg_deadLetter": "نامه مرده",
    "msg_template": "الگو", "msg_templateList": "لیست الگوها",
    "msg_notification": "اعلان", "msg_notificationList": "لیست اعلان‌ها",
    "msg_route": "مسیر", "msg_routeRule": "قاعده مسیر",
    "msg_preference": "ترجیح", "msg_messagePreference": "ترجیح پیام",
}

# === fi-FI Finnish ===
T["fi-FI"] = {
    "messageTitle": "Viestien hallinta", "messageId": "Viestin ID",
    "messageChannel": "Kanava", "messageRecipient": "Vastaanottaja",
    "messageSubject": "Aihe", "messageSendTime": "Lähetysaika",
    "messageConfirmDelete": 'Haluatko varmasti poistaa "{id}"?',
    "operationSuccess": "Onnistui",
    "templateName": "Mallipohjan nimi", "templateContent": "Mallipohjan sisältö",
    "templateType": "Mallin tyyppi", "routeName": "Reitin nimi",
    "routePriority": "Prioriteetti", "routeCondition": "Reitin ehto",
    "preferenceName": "Asetuksen nimi", "dndEnabled": "Älä häiritse",
    "dndStart": "Älä häirtä Alkuperä", "dndEnd": "Älä häiritse Loppu",
    "confirmDelete": 'Haluatko varmasti poistaa "{id}"?',
    "msg_message": "Viesti", "msg_messageList": "Viestilista",
    "msg_batchSend": "Erälähetys", "msg_deadLetter": "Kuollut kirje",
    "msg_template": "Mallipohja", "msg_templateList": "Malli lista",
    "msg_notification": "Ilmoitus", "msg_notificationList": "Ilmoituslista",
    "msg_route": "Reitti", "msg_routeRule": "Reitin sääntö",
    "msg_preference": "Asetus", "msg_messagePreference": "Viestin asetukset",
}

# === fil-PH Filipino ===
T["fil-PH"] = {
    "messageTitle": "Pamamahala ng Mensahe", "messageId": "ID ng Mensahe",
    "messageChannel": "Channel", "messageRecipient": "Tatanggap",
    "messageSubject": "Paksa", "messageSendTime": "Oras ng Pagpapadala",
    "messageConfirmDelete": 'Sigurado ka bang gusto mong tanggalin ang "{id}"?',
    "operationSuccess": "Matagumpay",
    "templateName": "Pangalan ng Template", "templateContent": "Nilalaman ng Template",
    "templateType": "Uri ng Template", "routeName": "Pangalan ng Ruta",
    "routePriority": "Prayoridad", "routeCondition": "Kundisyon ng Ruta",
    "preferenceName": "Pangalan ng Kagustuhan", "dndEnabled": "Huwag Istulog",
    "dndStart": "Huwag Istulog Simula", "dndEnd": "Huwag Issulog Wakas",
    "confirmDelete": 'Sigurado ka bang gusto mong tanggalin ang "{id}"?',
    "msg_message": "Mensahe", "msg_messageList": "Listahan ng Mensahe",
    "msg_batchSend": "Padalang Batch", "msg_deadLetter": "Patay na Liham",
    "msg_template": "Template", "msg_templateList": "Listahan ng Template",
    "msg_notification": "Abiso", "msg_notificationList": "Listahan ng Abiso",
    "msg_route": "Ruta", "msg_routeRule": "Patakaran ng Ruta",
    "msg_preference": "Kagustuhan", "msg_messagePreference": "Kagustuhan sa Mensahe",
}

# === fr-CA Canadian French ===
T["fr-CA"] = {
    "messageTitle": "Gestion des messages", "messageId": "ID du message",
    "messageChannel": "Canal", "messageRecipient": "Destinataire",
    "messageSubject": "Objet", "messageSendTime": "Heure d\\'envoi",
    "messageConfirmDelete": '\\u00cates-vous s\\u00fbr de vouloir supprimer \\u00ab {id} \\u00bb ?',
    "operationSuccess": "Opération réussie",
    "templateName": "Nom du modèle", "templateContent": "Contenu du modèle",
    "templateType": "Type de modèle", "routeName": "Nom de l\\'itinéraire",
    "routePriority": "Priorité", "routeCondition": "Condition d\\'itinéraire",
    "preferenceName": "Nom de la préférence", "dndEnabled": "Ne pas déranger",
    "dndStart": "Ne pas déranger Début", "dndEnd": "Ne pas déranger Fin",
    "confirmDelete": '\\u00cates-vous s\\u00fbr de vouloir supprimer \\u00ab {id} \\u00bb ?',
    "msg_message": "Message", "msg_messageList": "Liste des messages",
    "msg_batchSend": "Envoi en lot", "msg_deadLetter": "Lettre morte",
    "msg_template": "Modèle", "msg_templateList": "Liste des modèles",
    "msg_notification": "Notification", "msg_notificationList": "Liste des notifications",
    "msg_route": "Itinéraire", "msg_routeRule": "Règle d\\'itinéraire",
    "msg_preference": "Préférence", "msg_messagePreference": "Préférence des messages",
}

# === fr-FR French ===
T["fr-FR"] = {
    "messageTitle": "Gestion des messages", "messageId": "ID du message",
    "messageChannel": "Canal", "messageRecipient": "Destinataire",
    "messageSubject": "Objet", "messageSendTime": "Heure d\\'envoi",
    "messageConfirmDelete": '\\u00cates-vous s\\u00fbr de vouloir supprimer \\u00ab {id} \\u00bb ?',
    "operationSuccess": "Opération réussie",
    "templateName": "Nom du modèle", "templateContent": "Contenu du modèle",
    "templateType": "Type de modèle", "routeName": "Nom de la route",
    "routePriority": "Priorité", "routeCondition": "Condition de route",
    "preferenceName": "Nom de la préférence", "dndEnabled": "Ne pas déranger",
    "dndStart": "Ne pas déranger Début", "dndEnd": "Ne pas déranger Fin",
    "confirmDelete": '\\u00cates-vous s\\u00fbr de vouloir supprimer \\u00ab {id} \\u00bb ?',
    "msg_message": "Message", "msg_messageList": "Liste des messages",
    "msg_batchSend": "Envoi en lot", "msg_deadLetter": "Lettre morte",
    "msg_template": "Modèle", "msg_templateList": "Liste des modèles",
    "msg_notification": "Notification", "msg_notificationList": "Liste des notifications",
    "msg_route": "Route", "msg_routeRule": "Règle de route",
    "msg_preference": "Préférence", "msg_messagePreference": "Préférence des messages",
}

# === gl-ES Galician ===
T["gl-ES"] = {
    "messageTitle": "Xestión de Mensaxes", "messageId": "ID de Mensaxe",
    "messageChannel": "Canle", "messageRecipient": "Destinatario",
    "messageSubject": "Asunto", "messageSendTime": "Hora de Envío",
    "messageConfirmDelete": 'Está seguro de que desexa eliminar "{id}"?',
    "operationSuccess": "Operación Exitosa",
    "templateName": "Nome de Modelo", "templateContent": "Contido do Modelo",
    "templateType": "Tipo de Modelo", "routeName": "Nome da Ruta",
    "routePriority": "Prioridade", "routeCondition": "Condición de Ruta",
    "preferenceName": "Nome de Preferencia", "dndEnabled": "Non Molestar",
    "dndStart": "Non Molestar Inicio", "dndEnd": "Non Molestar Fin",
    "confirmDelete": 'Está seguro de que desexa eliminar "{id}"?',
    "msg_message": "Mensaxe", "msg_messageList": "Lista de Mensaxes",
    "msg_batchSend": "Envío por Lotes", "msg_deadLetter": "Carta Morta",
    "msg_template": "Modelo", "msg_templateList": "Lista de Modelos",
    "msg_notification": "Notificación", "msg_notificationList": "Lista de Notificacións",
    "msg_route": "Ruta", "msg_routeRule": "Regra da Ruta",
    "msg_preference": "Preferencia", "msg_messagePreference": "Preferencia de Mensaxes",
}

# === gu-IN Gujarati ===
T["gu-IN"] = {
    "messageTitle": "સંદેશ વ્યવસ્થાપન", "messageId": "સંદેશ ID",
    "messageChannel": "ચેનલ", "messageRecipient": "પ્રાપ્તકર્તા",
    "messageSubject": "વિષય", "messageSendTime": "મોકલવાનો સમય",
    "messageConfirmDelete": 'શું તમે ખરેખર "{id}" કાઢી નાખવા માંગો છો?',
    "operationSuccess": "સફળ",
    "templateName": "ટેમ્પલેટ નામ", "templateContent": "ટેમ્પલેટ સામગ્રી",
    "templateType": "ટેમ્પલેટ પ્રકાર", "routeName": "રુટ નામ",
    "routePriority": "પ્રાધાન્ય", "routeCondition": "રુટ શરત",
    "preferenceName": "પસંદગી નામ", "dndEnabled": "ડીએન્ડી",
    "dndStart": "DND શરૂઆત", "dndEnd": "DND અંત",
    "confirmDelete": 'શું તમે ખરેખર "{id}" કાઢી નાખવા માંગો છો?',
    "msg_message": "સંદેશ", "msg_messageList": "સંદેશ સૂચિ",
    "msg_batchSend": "બેચ મોકલો", "msg_deadLetter": "મૃત પત્ર",
    "msg_template": "ટેમ્પલેટ", "msg_templateList": "ટેમ્પલેટ સૂચિ",
    "msg_notification": "સૂચના", "msg_notificationList": "સૂચના સૂચિ",
    "msg_route": "રુટ", "msg_routeRule": "રુટ નિયમ",
    "msg_preference": "પસંદગી", "msg_messagePreference": "સંદેશ પસંદગી",
}

# === he-IL Hebrew ===
T["he-IL"] = {
    "messageTitle": "ניהול הודעות", "messageId": "מזהה הודעה",
    "messageChannel": "ערוץ", "messageRecipient": "נמען",
    "messageSubject": "נושא", "messageSendTime": "שעת שליחה",
    "messageConfirmDelete": 'האם אתה בטוח שברצונך למחוק "{id}"?',
    "operationSuccess": "הצלחה",
    "templateName": "שם תבנית", "templateContent": "תוכן תבנית",
    "templateType": "סוג תבנית", "routeName": "שם נתיב",
    "routePriority": "עדיפות", "routeCondition": "תנאי נתיב",
    "preferenceName": "שם העדפה", "dndEnabled": "אל תפריע",
    "dndStart": "אל תפריע חתימה", "dndEnd": "אל תפריע סיום",
    "confirmDelete": 'האם אתה בטוח שברצונך למחוק "{id}"?',
    "msg_message": "הודעה", "msg_messageList": "רשימת הודעות",
    "msg_batchSend": "שליחה קבוצתית", "msg_deadLetter": "מכתב מת",
    "msg_template": "תבנית", "msg_templateList": "רשימת תבניות",
    "msg_notification": "התראה", "msg_notificationList": "רשימת התראות",
    "msg_route": "נתיב", "msg_routeRule": "חוק נתיב",
    "msg_preference": "העדפה", "msg_messagePreference": "העדפת הודעות",
}

# === hi-IN Hindi ===
T["hi-IN"] = {
    "messageTitle": "संदेश प्रबंधन", "messageId": "संदेश ID",
    "messageChannel": "चैनल", "messageRecipient": "प्राप्तकर्ता",
    "messageSubject": "विषय", "messageSendTime": "भेजने का समय",
    "messageConfirmDelete": 'क्या आप वाकई "{id}" हटाना चाहते हैं?',
    "operationSuccess": "सफल",
    "templateName": "टेम्पलेट नाम", "templateContent": "टेम्पलेट सामग्री",
    "templateType": "टेम्पलेट प्रकार", "routeName": "रूट नाम",
    "routePriority": "प्राथमिकता", "routeCondition": "रूट शर्त",
    "preferenceName": "पसंद नाम", "dndEnabled": "परेशान न करें",
    "dndStart": "DND आरंभ", "dndEnd": "DND समाप्त",
    "confirmDelete": 'क्या आप वाकई "{id}" हटाना चाहते हैं?',
    "msg_message": "संदेश", "msg_messageList": "संदेश सूची",
    "msg_batchSend": "बैच भेजें", "msg_deadLetter": "मृत पत्र",
    "msg_template": "टेम्पलेट", "msg_templateList": "टेम्पलेट सूची",
    "msg_notification": "अधिसूचना", "msg_notificationList": "अधिसूचना सूची",
    "msg_route": "रूट", "msg_routeRule": "रूट नियम",
    "msg_preference": "पसंद", "msg_messagePreference": "संदेश पसंद",
}

# === hr-HR Croatian ===
T["hr-HR"] = {
    "messageTitle": "Upravljanje porukama", "messageId": "ID poruke",
    "messageChannel": "Kanal", "messageRecipient": "Primatelj",
    "messageSubject": "Tema", "messageSendTime": "Vrijeme slanja",
    "messageConfirmDelete": 'Jeste li sigurni da želite izbrisati "{id}"?',
    "operationSuccess": "Uspješno",
    "templateName": "Naziv predloška", "templateContent": "Sadržaj predloška",
    "templateType": "Tip predloška", "routeName": "Naziv rute",
    "routePriority": "Prioritet", "routeCondition": "Uvjet rute",
    "preferenceName": "Naziv postavki", "dndEnabled": "Ne uznemiravaj",
    "dndStart": "Ne uznemiravaj Početak", "dndEnd": "Ne uznemiravaj Kraj",
    "confirmDelete": 'Jeste li sigurni da želite izbrisati "{id}"?',
    "msg_message": "Poruka", "msg_messageList": "Lista poruka",
    "msg_batchSend": "Skupno slanje", "msg_deadLetter": "Mrtvo pismo",
    "msg_template": "Predložak", "msg_templateList": "Lista predložaka",
    "msg_notification": "Obavijest", "msg_notificationList": "Lista obavijesti",
    "msg_route": "Ruta", "msg_routeRule": "Pravilo rute",
    "msg_preference": "Postavke", "msg_messagePreference": "Postavke poruka",
}

# === hu-HU Hungarian ===
T["hu-HU"] = {
    "messageTitle": "Üzenetkezelés", "messageId": "Üzenet azonosítója",
    "messageChannel": "Csatorna", "messageRecipient": "Címzett",
    "messageSubject": "Tárgy", "messageSendTime": "Küldés időpontja",
    "messageConfirmDelete": 'Biztosan törölni szeretné: "{id}"?',
    "operationSuccess": "Sikeres művelet",
    "templateName": "Sablon neve", "templateContent": "Sablon tartalma",
    "templateType": "Sablon típusa", "routeName": "Útvonal neve",
    "routePriority": "Prioritás", "routeCondition": "Útvonal feltétele",
    "preferenceName": "Beállítás neve", "dndEnabled": "Ne zavarjanak",
    "dndStart": "Ne zavarjanak Kezdet", "dndEnd": "Ne zavarjanak Vége",
    "confirmDelete": 'Biztosan törölni szeretné: "{id}"?',
    "msg_message": "Üzenet", "msg_messageList": "Üzenetek listája",
    "msg_batchSend": "Kötegelt küldés", "msg_deadLetter": "Halott levél",
    "msg_template": "Sablon", "msg_templateList": "Sablonok listája",
    "msg_notification": "Értesítés", "msg_notificationList": "Értesítések listája",
    "msg_route": "Útvonal", "msg_routeRule": "Útvonal szabálya",
    "msg_preference": "Beállítás", "msg_messagePreference": "Üzenetbeállítások",
}

# === hy-AM Armenian ===
T["hy-AM"] = {
    "messageTitle": "Հաղորդագրությունների կառավարում", "messageId": "Հաղորդագրության ID",
    "messageChannel": "Աղբյուր", "messageRecipient": "Ստացող",
    "messageSubject": "Թեմա", "messageSendTime": "Ուղարկման ժամ",
    "messageConfirmDelete": 'Վստա՞հ եք, որ ցանկանում եք ջնջել "{id}"-ը:',
    "operationSuccess": "Հաջողվեց",
    "templateName": "Կաղապարի անուն", "templateContent": "Կաղապարի պարունակություն",
    "templateType": "Կաղապարի տեսակ", "routeName": "Երթուղու անուն",
    "routePriority": "Առաջնահերթություն", "routeCondition": "Երթուղու պայման",
    "preferenceName": "Նախապատվության անուն", "dndEnabled": "Չխանգարել",
    "dndStart": "Չխանգարել Սկիզբ", "dndEnd": "Չխանգարել Ավարտ",
    "confirmDelete": 'Վստա՞հ եք, որ ցանկանում եք ջնջել "{id}"-ը:',
    "msg_message": "Հաղորդագրություն", "msg_messageList": "Հաղորդագրությունների ցուցակ",
    "msg_batchSend": "Խմբային ուղարկում", "msg_deadLetter": "Մահացած նամակ",
    "msg_template": "Կաղապար", "msg_templateList": "Կաղապարների ցուցակ",
    "msg_notification": "Ծանուցում", "msg_notificationList": "Ծանուցումների ցուցակ",
    "msg_route": "Երթուղի", "msg_routeRule": "Երթուղու կանոն",
    "msg_preference": "Նախապատություն", "msg_messagePreference": "Հաղորդագրության նախապատություն",
}

# === id-ID Indonesian ===
T["id-ID"] = {
    "messageTitle": "Manajemen Pesan", "messageId": "ID Pesan",
    "messageChannel": "Kanal", "messageRecipient": "Penerima",
    "messageSubject": "Subjek", "messageSendTime": "Waktu Kirim",
    "messageConfirmDelete": 'Apakah Anda yakin ingin menghapus "{id}"?',
    "operationSuccess": "Berhasil",
    "templateName": "Nama Templat", "templateContent": "Konten Templat",
    "templateType": "Tipe Templat", "routeName": "Nama Rute",
    "routePriority": "Prioritas", "routeCondition": "Kondisi Rute",
    "preferenceName": "Nama Preferensi", "dndEnabled": "Jangan Ganggu",
    "dndStart": "Jangan Ganggu Mulai", "dndEnd": "Jangan Ganggu Selesai",
    "confirmDelete": 'Apakah Anda yakin ingin menghapus "{id}"?',
    "msg_message": "Pesan", "msg_messageList": "Daftar Pesan",
    "msg_batchSend": "Kirim Batch", "msg_deadLetter": "Surat Mati",
    "msg_template": "Templat", "msg_templateList": "Daftar Templat",
    "msg_notification": "Notifikasi", "msg_notificationList": "Daftar Notifikasi",
    "msg_route": "Rute", "msg_routeRule": "Aturan Rute",
    "msg_preference": "Preferensi", "msg_messagePreference": "Preferensi Pesan",
}

# === is-IS Icelandic ===
T["is-IS"] = {
    "messageTitle": "Skilaboðastjórnun", "messageId": "Skilaboð ID",
    "messageChannel": "Rás", "messageRecipient": "Mótakandi",
    "messageSubject": "Efni", "messageSendTime": "Sendingartími",
    "messageConfirmDelete": 'Ertu viss um að þú viljir eyða "{id}"?',
    "operationSuccess": "Tókst",
    "templateName": "Sniðmátsheiti", "templateContent": "Sniðmátsinnihald",
    "templateType": "Sniðmátstegund", "routeName": "Leiðarheiti",
    "routePriority": "Forgangsröðun", "routeCondition": "Leiðarskilyrði",
    "preferenceName": "Kostur heiti", "dndEnabled": "Ekki trufla",
    "dndStart": "Ekki trufla Byrjun", "dndEnd": "Ekki trufla Endir",
    "confirmDelete": 'Ertu viss um að þú viljir eyða "{id}"?',
    "msg_message": "Skilaboð", "msg_messageList": "Skilaboðalisti",
    "msg_batchSend": "Sending hóps", "msg_deadLetter": "Dautt bréf",
    "msg_template": "Sniðmát", "msg_templateList": "Sniðmátalisti",
    "msg_notification": "Tilkynning", "msg_notificationList": "Tilkynningarlisti",
    "msg_route": "Leið", "msg_routeRule": "Leiðarregla",
    "msg_preference": "Kostur", "msg_messagePreference": "Skilaboðakostur",
}

# === it-IT Italian ===
T["it-IT"] = {
    "messageTitle": "Gestione Messaggi", "messageId": "ID Messaggio",
    "messageChannel": "Canale", "messageRecipient": "Destinatario",
    "messageSubject": "Oggetto", "messageSendTime": "Ora di Invio",
    "messageConfirmDelete": 'Sei sicuro di voler eliminare "{id}"?',
    "operationSuccess": "Operazione Riuscita",
    "templateName": "Nome Modello", "templateContent": "Contenuto Modello",
    "templateType": "Tipo Modello", "routeName": "Nome Percorso",
    "routePriority": "Priorità", "routeCondition": "Condizione Percorso",
    "preferenceName": "Nome Preferenza", "dndEnabled": "Non Disturbare",
    "dndStart": "Non Disturbare Inizio", "dndEnd": "Non Disturbare Fine",
    "confirmDelete": 'Sei sicuro di voler eliminare "{id}"?',
    "msg_message": "Messaggio", "msg_messageList": "Elenco Messaggi",
    "msg_batchSend": "Invio Batch", "msg_deadLetter": "Lettera Morta",
    "msg_template": "Modello", "msg_templateList": "Elenco Modelli",
    "msg_notification": "Notifica", "msg_notificationList": "Elenco Notifiche",
    "msg_route": "Percorso", "msg_routeRule": "Regola Percorso",
    "msg_preference": "Preferenza", "msg_messagePreference": "Preferenza Messaggi",
}

# === ja-JP Japanese ===
T["ja-JP"] = {
    "messageTitle": "メッセージ管理", "messageId": "メッセージID",
    "messageChannel": "チャネル", "messageRecipient": "受信者",
    "messageSubject": "件名", "messageSendTime": "送信日時",
    "messageConfirmDelete": '"{id}" を削除してもよろしいですか？',
    "operationSuccess": "成功しました",
    "templateName": "テンプレート名", "templateContent": "テンプレート内容",
    "templateType": "テンプレート種別", "routeName": "ルート名",
    "routePriority": "優先度", "routeCondition": "ルーティング条件",
    "preferenceName": "プリファレンス名", "dndEnabled": "着信拒否",
    "dndStart": "着信拒否 開始", "dndEnd": "着信拒否 終了",
    "confirmDelete": '"{id}" を削除してもよろしいですか？',
    "msg_message": "メッセージ", "msg_messageList": "メッセージ一覧",
    "msg_batchSend": "一括送信", "msg_deadLetter": "デッドレター",
    "msg_template": "テンプレート", "msg_templateList": "テンプレート一覧",
    "msg_notification": "通知", "msg_notificationList": "通知一覧",
    "msg_route": "ルート", "msg_routeRule": "ルーティングルール",
    "msg_preference": "プリファレンス", "msg_messagePreference": "メッセージプリファレンス",
}

# === kk-KZ Kazakh ===
T["kk-KZ"] = {
    "messageTitle": "Хабарларды басқару", "messageId": "Хабарлама ID",
    "messageChannel": "Арна", "messageRecipient": "Алушы",
    "messageSubject": "Тақырып", "messageSendTime": "Жіберу уақыты",
    "messageConfirmDelete": '"{id}" жоюға сенімдісіз бе?',
    "operationSuccess": "Сәтті",
    "templateName": "Үлгі атауы", "templateContent": "Үлгі мазмұны",
    "templateType": "Үлгі түрі", "routeName": "Маршрут атауы",
    "routePriority": "Басымдылық", "routeCondition": "Маршрут шарты",
    "preferenceName": "Таңдау атауы", "dndEnabled": "Мазаламаңыз",
    "dndStart": "Мазаламаңыз Бастау", "dndEnd": "Мазаламаңыз Аяқтау",
    "confirmDelete": '"{id}" жоюға сенімдісіз бе?',
    "msg_message": "Хабарлама", "msg_messageList": "Хабарлар тізімі",
    "msg_batchSend": "Топтап жіберу", "msg_deadLetter": "Өлі хат",
    "msg_template": "Үлгі", "msg_templateList": "Үлгілер тізімі",
    "msg_notification": "Хабарландыру", "msg_notificationList": "Хабарландыру тізімі",
    "msg_route": "Маршрут", "msg_routeRule": "Маршрут ережесі",
    "msg_preference": "Таңдау", "msg_messagePreference": "Хабарлама таңдауы",
}

# === km-KH Khmer ===
T["km-KH"] = {
    "messageTitle": "ការគ្រប់គ្រងសារ", "messageId": "លេខសម្គាល់សារ",
    "messageChannel": "ឆានែល", "messageRecipient": "អ្នកទទួល",
    "messageSubject": "ប្រធានបទ", "messageSendTime": "ម៉ោងផ្ញើ",
    "messageConfirmDelete": 'តើអ្នកប្រាកដជាចង់លុប "{id}" មែនទេ?',
    "operationSuccess": "ជោគជ័យ",
    "templateName": "ឈ្មោះគំរូ", "templateContent": "ខ្លឹមសារគំរូ",
    "templateType": "ប្រភេទគំរូ", "routeName": "ឈ្មោះផ្លូវ",
    "routePriority": "អាទិភាព", "routeCondition": "លក្ខខណ្ឌផ្លូវ",
    "preferenceName": "ឈ្មោះចំណូលចិត្ត", "dndEnabled": "កុំបំពាន",
    "dndStart": "កុំបំពាន ចាប់ផ្តើម", "dndEnd": "កុំបំពាន បញ្ចប់",
    "confirmDelete": 'តើអ្នទការប្រាកដជាចង់លុប "{id}" មែនទេ?',
    "msg_message": "សារ", "msg_messageList": "បញ្ជីសារ",
    "msg_batchSend": "ផ្ញើជាក្រុម", "msg_deadLetter": "សំបុត្រស្លាប់",
    "msg_template": "គំរូ", "msg_templateList": "បញ្ជីគំរូ",
    "msg_notification": "សារជូនដំណឹង", "msg_notificationList": "បញ្ជីសារជូនដំណឹង",
    "msg_route": "ផ្លូវ", "msg_routeRule": "ច្បាប់ផ្លូវ",
    "msg_preference": "ចំណូលចិត្ត", "msg_messagePreference": "ចំណូលចិត្តសារ",
}

# === kn-IN Kannada ===
T["kn-IN"] = {
    "messageTitle": "ಸಂದೇಶ ನಿರ್ವಹಣೆ", "messageId": "ಸಂದೇಶ ID",
    "messageChannel": "ಚಾನೆಲ್", "messageRecipient": "ಸ್ವೀಕರಿಸುವವರು",
    "messageSubject": "ವಿಷಯ", "messageSendTime": "ಕಳುಹಿಸಿದ ಸಮಯ",
    "messageConfirmDelete": 'ನೀವು "{id}" ಅಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುತ್ತೀರಾ?',
    "operationSuccess": "ಯಶಸ್ಸು",
    "templateName": "ಟೆಂಪ್ಲೇಟ್ ಹೆಸರು", "templateContent": "ಟೆಂಪ್ಲೇಟ್ ವಿಷಯ",
    "templateType": "ಟೆಂಪ್ಲೇಟ್ ಪ್ರಕಾರ", "routeName": "ರೂಟ್ ಹೆಸರು",
    "routePriority": "ಆದ್ಯತೆ", "routeCondition": "ರೂಟ್ ಕಂಡಿಷನ್",
    "preferenceName": "ಆದ್ಯತೆ ಹೆಸರು", "dndEnabled": "DND",
    "dndStart": "DND ಆರಂಭ", "dndEnd": "DND ಅಂತ್ಯ",
    "confirmDelete": 'ನೀವು "{id}" ಅಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುತ್ತೀರಾ?',
    "msg_message": "ಸಂದೇಶ", "msg_messageList": "ಸಂದೇಶ ಪಟ್ಟಿ",
    "msg_batchSend": "ಬ್ಯಾಚ್ ಕಳುಹಿಸಿ", "msg_deadLetter": "ಡೆಡ್ ಲೆಟರ್",
    "msg_template": "ಟೆಂಪ್ಲೇಟ್", "msg_templateList": "ಟೆಂಪ್ಲೇಟ್ ಪಟ್ಟಿ",
    "msg_notification": "ಸೂಚನೆ", "msg_notificationList": "ಸೂಚನೆ ಪಟ್ಟಿ",
    "msg_route": "ರೂಟ್", "msg_routeRule": "ರೂಟ್ ನಿಯಮ",
    "msg_preference": "ಆದ್ಯತೆ", "msg_messagePreference": "ಸಂದೇಶ ಆದ್ಯತೆ",
}

# === ko-KR Korean ===
T["ko-KR"] = {
    "messageTitle": "메시지 관리", "messageId": "메시지 ID",
    "messageChannel": "채널", "messageRecipient": "수신자",
    "messageSubject": "제목", "messageSendTime": "발송 시간",
    "messageConfirmDelete": '"{id}"을(를) 삭제하시겠습니까?',
    "operationSuccess": "성공",
    "templateName": "템플릿 이름", "templateContent": "템플릿 내용",
    "templateType": "템플릿 유형", "routeName": "라우트 이름",
    "routePriority": "우선순위", "routeCondition": "라우팅 조건",
    "preferenceName": "환경설정 이름", "dndEnabled": "방해 금지",
    "dndStart": "방해 금지 시작", "dndEnd": "방해 금지 종료",
    "confirmDelete": '"{id}"을(를) 삭제하시겠습니까?',
    "msg_message": "메시지", "msg_messageList": "메시지 목록",
    "msg_batchSend": "일괄 발송", "msg_deadLetter": "데드레터",
    "msg_template": "템플릿", "msg_templateList": "템플릿 목록",
    "msg_notification": "알림", "msg_notificationList": "알림 목록",
    "msg_route": "라우트", "msg_routeRule": "라우팅 규칙",
    "msg_preference": "환경설정", "msg_messagePreference": "메시지 환경설정",
}

# === lt-LT Lithuanian ===
T["lt-LT"] = {
    "messageTitle": "Pranešimų valdymas", "messageId": "Pranešimo ID",
    "messageChannel": "Kanalas", "messageRecipient": "Gavėjas",
    "messageSubject": "Tema", "messageSendTime": "Siuntimo laikas",
    "messageConfirmDelete": 'Ar tikrai norite ištrinti "{id}"?',
    "operationSuccess": "Sėkmingai",
    "templateName": "Šablono pavadinimas", "templateContent": "Šablono turinys",
    "templateType": "Šablono tipas", "routeName": "Maršruto pavadinimas",
    "routePriority": "Prioritetas", "routeCondition": "Maršruto sąlyga",
    "preferenceName": "Nuostatos pavadinimas", "dndEnabled": "Netrukdyti",
    "dndStart": "Netrukdyti Pradžia", "dndEnd": "Netrukdyti Pabaiga",
    "confirmDelete": 'Ar tikrai norite ištrinti "{id}"?',
    "msg_message": "Pranešimas", "msg_messageList": "Pranešimų sąrašas",
    "msg_batchSend": "Paketinė siuntimas", "msg_deadLetter": "Mirtas laiškas",
    "msg_template": "Šablonas", "msg_templateList": "Šablonų sąrašas",
    "msg_notification": "Pranešimas apie", "msg_notificationList": "Pranešimų sąrašas",
    "msg_route": "Maršrutas", "msg_routeRule": "Maršruto taisyklė",
    "msg_preference": "Nuostatos", "msg_messagePreference": "Pranešimų nuostatos",
}

# === lv-LV Latvian ===
T["lv-LV"] = {
    "messageTitle": "Ziņojumu pārvaldība", "messageId": "Ziņojuma ID",
    "messageChannel": "Kanāls", "messageRecipient": "Saņēmējs",
    "messageSubject": "Temats", "messageSendTime": "Sūtīšanas laiks",
    "messageConfirmDelete": 'Vai tiešām vēlaties dzēst "{id}"?',
    "operationSuccess": "Veiksmīgi",
    "templateName": "Veidnes nosaukums", "templateContent": "Veidnes saturs",
    "templateType": "Veidnes tips", "routeName": "Maršruta nosaukums",
    "routePriority": "Prioritāte", "routeCondition": "Maršruta nosacījums",
    "preferenceName": "Iestatījumu nosaukums", "dndEnabled": "Netraucēt",
    "dndStart": "Netraucēt Sākums", "dndEnd": "Netraucēt Beigas",
    "confirmDelete": 'Vai tiešām vēlaties dzēst "{id}"?',
    "msg_message": "Ziņojums", "msg_messageList": "Ziņojumu saraksts",
    "msg_batchSend": "Partijas sūtīšana", "msg_deadLetter": "Mirstīgais vēstule",
    "msg_template": "Veidne", "msg_templateList": "Veidņu saraksts",
    "msg_notification": "Paziņojums", "msg_notificationList": "Paziņojumu saraksts",
    "msg_route": "Maršruts", "msg_routeRule": "Maršruta noteikums",
    "msg_preference": "Iestatījumi", "msg_messagePreference": "Ziņojumu iestatījumi",
}

# === mk-MK Macedonian ===
T["mk-MK"] = {
    "messageTitle": "Управување со пораки", "messageId": "ID на порака",
    "messageChannel": "Канал", "messageRecipient": "Примател",
    "messageSubject": "Предмет", "messageSendTime": "Време на испраќање",
    "messageConfirmDelete": 'Дали сте сигурни дека сакате да го избришете "{id}"?',
    "operationSuccess": "Успешно",
    "templateName": "Име на дефиниција", "templateContent": "Содржина на дефиниција",
    "templateType": "Тип на дефиниција", "routeName": "Име на рута",
    "routePriority": "Приоритет", "routeCondition": "Услов на рута",
    "preferenceName": "Име на поставка", "dndEnabled": "Не вознемирувај",
    "dndStart": "Не вознемирувај Почеток", "dndEnd": "Не вознемирувај Крај",
    "confirmDelete": 'Дали сте сигурни дека сакате да го избришете "{id}"?',
    "msg_message": "Порака", "msg_messageList": "Листа на пораки",
    "msg_batchSend": "Групно испраќање", "msg_deadLetter": "Мртво писмо",
    "msg_template": "Дефиниција", "msg_templateList": "Листа на дефиниции",
    "msg_notification": "Известување", "msg_notificationList": "Листа на известувања",
    "msg_route": "Рута", "msg_routeRule": "Правило на рута",
    "msg_preference": "Поставка", "msg_messagePreference": "Поставка на пораки",
}

# === ml-IN Malayalam ===
T["ml-IN"] = {
    "messageTitle": "സന്ദേശ മാനേജ്മെന്റ്", "messageId": "സന്ദേശ ID",
    "messageChannel": "ചാനൽ", "messageRecipient": "സ്വീകർത്താവ്",
    "messageSubject": "വിഷയം", "messageSendTime": "അയച്ച സമയം",
    "messageConfirmDelete": 'നിങ്ങൾക്ക് "{id}" ഇല്ലാതാക്കണമെന്ന് ഉറപ്പാണോ?',
    "operationSuccess": "വിജയകരം",
    "templateName": "ടെംപ്ലേറ്റ് പേര്", "templateContent": "ടെംപ്ലേറ്റ് ഉള്ളടക്കം",
    "templateType": "ടെംപ്ലേറ്റ് തരം", "routeName": "റൂട്ട് പേര്",
    "routePriority": "പ്രാധാന്യം", "routeCondition": "റൂട്ട് വ്യവസ്ഥ",
    "preferenceName": "മുൻഗണന പേര്", "dndEnabled": "DND",
    "dndStart": "DND ആരംഭം", "dndEnd": "DND അവസാനം",
    "confirmDelete": 'നിങ്ങൾക്ക് "{id}" ഇല്ലാതാക്കണമെന്ന് ഉറപ്പാണോ?',
    "msg_message": "സന്ദേശം", "msg_messageList": "സന്ദേശ ലിസ്റ്റ്",
    "msg_batchSend": "ബാച്ച് അയയ്ക്കുക", "msg_deadLetter": "ഡെഡ് ലെറ്റർ",
    "msg_template": "ടെംപ്ലേറ്റ്", "msg_templateList": "ടെംപ്ലേറ്റ് ലിസ്റ്റ്",
    "msg_notification": "അറിയിപ്പ്", "msg_notificationList": "അറിയിപ്പ് ലിസ്റ്റ്",
    "msg_route": "റൂട്ട്", "msg_routeRule": "റൂട്ട് നിയമം",
    "msg_preference": "മുൻഗണന", "msg_messagePreference": "സന്ദേശ മുൻഗണന",
}

# === mr-IN Marathi ===
T["mr-IN"] = {
    "messageTitle": "संदेश व्यवस्थापन", "messageId": "संदेश ID",
    "messageChannel": "चॅनल", "messageRecipient": "प्राप्तकर्ता",
    "messageSubject": "विषय", "messageSendTime": "पाठवण्याची वेळ",
    "messageConfirmDelete": 'आपण "{id}" हटवू इच्छिता याची खात्री आहे का?',
    "operationSuccess": "यशस्वी",
    "templateName": "टेम्पलेट नाव", "templateContent": "टेम्पलेट सामग्री",
    "templateType": "टेम्पलेट प्रकार", "routeName": "मार्ग नाव",
    "routePriority": "प्राधान्य", "routeCondition": "मार्ग अट",
    "preferenceName": "प्राधान्य नाव", "dndEnabled": "व्यत्यय ऊडऊ नका",
    "dndStart": "व्यत्यय ऊडऊ नका सुरुवात", "dndEnd": "व्यत्यय ऊडऊ नका शेवट",
    "confirmDelete": 'आपण "{id}" हटवू इच्छिता याची खात्री आहे का?',
    "msg_message": "संदेश", "msg_messageList": "संदेश यादी",
    "msg_batchSend": "बॅच पाठवा", "msg_deadLetter": "मृत पत्र",
    "msg_template": "टेम्पलेट", "msg_templateList": "टेम्पलेट यादी",
    "msg_notification": "सूचना", "msg_notificationList": "सूचना यादी",
    "msg_route": "मार्ग", "msg_routeRule": "मार्ग नियम",
    "msg_preference": "प्राधान्य", "msg_messagePreference": "संदेश प्राधान्य",
}

# === ms-MY Malay ===
T["ms-MY"] = {
    "messageTitle": "Pengurusan Mesej", "messageId": "ID Mesej",
    "messageChannel": "Saluran", "messageRecipient": "Penerima",
    "messageSubject": "Subjek", "messageSendTime": "Masa Hantar",
    "messageConfirmDelete": 'Adakah anda pasti ingin memadam "{id}"?',
    "operationSuccess": "Berjaya",
    "templateName": "Nama Templat", "templateContent": "Kandungan Templat",
    "templateType": "Jenis Templat", "routeName": "Nama Laluan",
    "routePriority": "Keutamaan", "routeCondition": "Syarat Laluan",
    "preferenceName": "Nama Keutamaan", "dndEnabled": "Jangan Ganggu",
    "dndStart": "Jangan Ganggu Mula", "dndEnd": "Jangan Ganggu Tamat",
    "confirmDelete": 'Adakah anda pasti ingin memadam "{id}"?',
    "msg_message": "Mesej", "msg_messageList": "Senarai Mesej",
    "msg_batchSend": "Hantar Kumpulan", "msg_deadLetter": "Surat Mati",
    "msg_template": "Templat", "msg_templateList": "Senarai Templat",
    "msg_notification": "Pemberitahuan", "msg_notificationList": "Senarai Pemberitahuan",
    "msg_route": "Laluan", "msg_routeRule": "Peraturan Laluan",
    "msg_preference": "Keutamaan", "msg_messagePreference": "Keutamaan Mesej",
}

# === nb-NO Norwegian Bokmål ===
T["nb-NO"] = {
    "messageTitle": "Meldingsadministrasjon", "messageId": "Melding-ID",
    "messageChannel": "Kanal", "messageRecipient": "Mottaker",
    "messageSubject": "Emne", "messageSendTime": "Sendt kl.",
    "messageConfirmDelete": 'Er du sikker på at du vil slette "{id}"?',
    "operationSuccess": "Vellykket",
    "templateName": "Malnavn", "templateContent": "Malinnhold",
    "templateType": "Maltype", "routeName": "Rutenavn",
    "routePriority": "Prioritet", "routeCondition": "Rutebetingelse",
    "preferenceName": "Innstillingsnavn", "dndEnabled": "Ikke forstyrr",
    "dndStart": "Ikke forstyrr Start", "dndEnd": "Ikke forstyrr Stopp",
    "confirmDelete": 'Er du sikker på at du vil slette "{id}"?',
    "msg_message": "Melding", "msg_messageList": "Meldingsliste",
    "msg_batchSend": "Batchsending", "msg_deadLetter": "Dødt brev",
    "msg_template": "Mal", "msg_templateList": "Malliste",
    "msg_notification": "Varsling", "msg_notificationList": "Varslingsliste",
    "msg_route": "Rute", "msg_routeRule": "Ruteregel",
    "msg_preference": "Innstilling", "msg_messagePreference": "Meldingsinnstilling",
}

# === nl-BE Dutch (Belgium) ===
T["nl-BE"] = {
    "messageTitle": "Berichtenbeheer", "messageId": "Bericht-ID",
    "messageChannel": "Kanaal", "messageRecipient": "Ontvanger",
    "messageSubject": "Onderwerp", "messageSendTime": "Verzonden om",
    "messageConfirmDelete": 'Bent u zeker dat u "{id}" wilt verwijderen?',
    "operationSuccess": "Geslaagd",
    "templateName": "Sjabloonnaam", "templateContent": "Sjablooninhoud",
    "templateType": "Sjabloontype", "routeName": "Routenaam",
    "routePriority": "Prioriteit", "routeCondition": "Routevoorwaarde",
    "preferenceName": "Voorkeurnaam", "dndEnabled": "Niet storen",
    "dndStart": "Niet storen Begin", "dndEnd": "Niet storen Einde",
    "confirmDelete": 'Bent u zeker dat u "{id}" wilt verwijderen?',
    "msg_message": "Bericht", "msg_messageList": "Berichtenlijst",
    "msg_batchSend": "Batchverzending", "msg_deadLetter": "Dood brief",
    "msg_template": "Sjabloon", "msg_templateList": "Sjabloonlijst",
    "msg_notification": "Melding", "msg_notificationList": "Meldingenlijst",
    "msg_route": "Route", "msg_routeRule": "Routeregel",
    "msg_preference": "Voorkeur", "msg_messagePreference": "Berichtvoorkeur",
}

# === nl-NL Dutch (Netherlands) ===
T["nl-NL"] = {
    "messageTitle": "Berichtenbeheer", "messageId": "Bericht-ID",
    "messageChannel": "Kanaal", "messageRecipient": "Ontvanger",
    "messageSubject": "Onderwerp", "messageSendTime": "Verzonden om",
    "messageConfirmDelete": 'Weet u zeker dat u "{id}" wilt verwijderen?',
    "operationSuccess": "Geslaagd",
    "templateName": "Sjabloonnaam", "templateContent": "Sjablooninhoud",
    "templateType": "Sjabloontype", "routeName": "Routenaam",
    "routePriority": "Prioriteit", "routeCondition": "Routevoorwaarde",
    "preferenceName": "Voorkeurnaam", "dndEnabled": "Niet storen",
    "dndStart": "Niet storen Begin", "dndEnd": "Niet storen Einde",
    "confirmDelete": 'Weet u zeker dat u "{id}" wilt verwijderen?',
    "msg_message": "Bericht", "msg_messageList": "Berichtenlijst",
    "msg_batchSend": "Batchverzending", "msg_deadLetter": "Dood brief",
    "msg_template": "Sjabloon", "msg_templateList": "Sjabloonlijst",
    "msg_notification": "Notificatie", "msg_notificationList": "Notificatielijst",
    "msg_route": "Route", "msg_routeRule": "Routeregel",
    "msg_preference": "Voorkeur", "msg_messagePreference": "Berichtvoorkeur",
}

# === pl-PL Polish ===
T["pl-PL"] = {
    "messageTitle": "Zarządzanie Wiadomościami", "messageId": "ID Wiadomości",
    "messageChannel": "Kanał", "messageRecipient": "Odbiorca",
    "messageSubject": "Temat", "messageSendTime": "Czas Wysłania",
    "messageConfirmDelete": 'Czy na pewno chcesz usunąć "{id}"?',
    "operationSuccess": "Operacja Udana",
    "templateName": "Nazwa Szablonu", "templateContent": "Treść Szablonu",
    "templateType": "Typ Szablonu", "routeName": "Nazwa Trasy",
    "routePriority": "Priorytet", "routeCondition": "Warunek Trasy",
    "preferenceName": "Nazwa Ustawienia", "dndEnabled": "Nie Przeszkadzać",
    "dndStart": "Nie Przeszkadzać Początek", "dndEnd": "Nie Przeszkadzać Koniec",
    "confirmDelete": 'Czy na pewno chcesz usunąć "{id}"?',
    "msg_message": "Wiadomość", "msg_messageList": "Lista Wiadomości",
    "msg_batchSend": "Wysyłka Wsadowa", "msg_deadLetter": "Martwa Litera",
    "msg_template": "Szablon", "msg_templateList": "Lista Szablonów",
    "msg_notification": "Powiadomienie", "msg_notificationList": "Lista Powiadomień",
    "msg_route": "Trasa", "msg_routeRule": "Reguła Trasy",
    "msg_preference": "Ustawienie", "msg_messagePreference": "Ustawienie Wiadomości",
}

# === pt-BR Portuguese (Brazil) ===
T["pt-BR"] = {
    "messageTitle": "Gerenciamento de Mensagens", "messageId": "ID da Mensagem",
    "messageChannel": "Canal", "messageRecipient": "Destinatário",
    "messageSubject": "Assunto", "messageSendTime": "Horário de Envio",
    "messageConfirmDelete": 'Tem certeza de que deseja excluir "{id}"?',
    "operationSuccess": "Sucesso",
    "templateName": "Nome do Modelo", "templateContent": "Conteúdo do Modelo",
    "templateType": "Tipo de Modelo", "routeName": "Nome da Rota",
    "routePriority": "Prioridade", "routeCondition": "Condição da Rota",
    "preferenceName": "Nome da Preferência", "dndEnabled": "Não Perturbe",
    "dndStart": "Não Perturbe Início", "dndEnd": "Não Perturbe Fim",
    "confirmDelete": 'Tem certeza de que deseja excluir "{id}"?',
    "msg_message": "Mensagem", "msg_messageList": "Lista de Mensagens",
    "msg_batchSend": "Envio em Lote", "msg_deadLetter": "Carta Morta",
    "msg_template": "Modelo", "msg_templateList": "Lista de Modelos",
    "msg_notification": "Notificação", "msg_notificationList": "Lista de Notificações",
    "msg_route": "Rota", "msg_routeRule": "Regra de Rota",
    "msg_preference": "Preferência", "msg_messagePreference": "Preferência de Mensagens",
}

# === pt-PT Portuguese (Portugal) ===
T["pt-PT"] = {
    "messageTitle": "Gestão de Mensagens", "messageId": "ID da Mensagem",
    "messageChannel": "Canal", "messageRecipient": "Destinatário",
    "messageSubject": "Assunto", "messageSendTime": "Hora de Envio",
    "messageConfirmDelete": 'Tem a certeza de que pretende eliminar "{id}"?',
    "operationSuccess": "Sucesso",
    "templateName": "Nome do Modelo", "templateContent": "Conteúdo do Modelo",
    "templateType": "Tipo de Modelo", "routeName": "Nome da Rota",
    "routePriority": "Prioridade", "routeCondition": "Condição da Rota",
    "preferenceName": "Nome da Preferência", "dndEnabled": "Não Perturbar",
    "dndStart": "Não Perturar Início", "dndEnd": "Não Perturbar Fim",
    "confirmDelete": 'Tem a certeza de que pretende eliminar "{id}"?',
    "msg_message": "Mensagem", "msg_messageList": "Lista de Mensagens",
    "msg_batchSend": "Envio em Lote", "msg_deadLetter": "Carta Morta",
    "msg_template": "Modelo", "msg_templateList": "Lista de Modelos",
    "msg_notification": "Notificação", "msg_notificationList": "Lista de Notificações",
    "msg_route": "Rota", "msg_routeRule": "Regra de Rota",
    "msg_preference": "Preferência", "msg_messagePreference": "Preferência de Mensagens",
}

# === ro-RO Romanian ===
T["ro-RO"] = {
    "messageTitle": "Gestionarea Mesajelor", "messageId": "ID-ul Mesajului",
    "messageChannel": "Canal", "messageRecipient": "Destinatar",
    "messageSubject": "Subiect", "messageSendTime": "Ora Trimiterii",
    "messageConfirmDelete": 'Sigur doriți să ștergeți "{id}"?',
    "operationSuccess": "Operațiune Reușită",
    "templateName": "Numele Șablonului", "templateContent": "Conținutul Șablonului",
    "templateType": "Tipul Șablonului", "routeName": "Numele Rutei",
    "routePriority": "Prioritate", "routeCondition": "Condiția Rutei",
    "preferenceName": "Numele Preferinței", "dndEnabled": "Nu Deranjați",
    "dndStart": "Nu Deranjați Început", "dndEnd": "Nu Deranjați Sfârșit",
    "confirmDelete": 'Sigur doriți să ștergeți "{id}"?',
    "msg_message": "Mesaj", "msg_messageList": "Lista de Mesaje",
    "msg_batchSend": "Trimitere în Lot", "msg_deadLetter": "Scrisoare Moartă",
    "msg_template": "Șablon", "msg_templateList": "Lista de șabloane",
    "msg_notification": "Notificare", "msg_notificationList": "Lista de Notificări",
    "msg_route": "Rută", "msg_routeRule": "Regula Rutei",
    "msg_preference": "Preferință", "msg_messagePreference": "Preferința Mesajelor",
}

# === ru-RU Russian ===
T["ru-RU"] = {
    "messageTitle": "Управление Сообщениями", "messageId": "ID Сообщения",
    "messageChannel": "Канал", "messageRecipient": "Получатель",
    "messageSubject": "Тема", "messageSendTime": "Время Отправки",
    "messageConfirmDelete": 'Вы уверены, что хотите удалить "{id}"?',
    "operationSuccess": "Операция выполнена",
    "templateName": "Имя Шаблона", "templateContent": "Содержимое Шаблона",
    "templateType": "Тип Шаблона", "routeName": "Имя Маршрута",
    "routePriority": "Приоритет", "routeCondition": "Условие Маршрута",
    "preferenceName": "Имя Настройки", "dndEnabled": "Не Беспокоить",
    "dndStart": "Не Беспокоить Начало", "dndEnd": "Не Беспокоить Конец",
    "confirmDelete": 'Вы уверены, что хотите удалить "{id}"?',
    "msg_message": "Сообщение", "msg_messageList": "Список Сообщений",
    "msg_batchSend": "Пакетная Отправка", "msg_deadLetter": "Мертвое Письмо",
    "msg_template": "Шаблон", "msg_templateList": "Список Шаблонов",
    "msg_notification": "Уведомление", "msg_notificationList": "Список Уведомлений",
    "msg_route": "Маршрут", "msg_routeRule": "Правила Маршрутизации",
    "msg_preference": "Настройка", "msg_messagePreference": "Настройка Сообщений",
}

# === sk-SK Slovak ===
T["sk-SK"] = {
    "messageTitle": "Správa Správ", "messageId": "ID Správy",
    "messageChannel": "Kanál", "messageRecipient": "Príjemca",
    "messageSubject": "Predmet", "messageSendTime": "Čas Odoslania",
    "messageConfirmDelete": 'Naozaj chcete vymazať "{id}"?',
    "operationSuccess": "Úspešná Operácia",
    "templateName": "Názov Šablóny", "templateContent": "Obsah Šablóny",
    "templateType": "Typ Šablóny", "routeName": "Názov Trasy",
    "routePriority": "Priorita", "routeCondition": "Podmienka Trasy",
    "preferenceName": "Názov Predvoľby", "dndEnabled": "Nerušiť",
    "dndStart": "Nerušiť Začiatok", "dndEnd": "Nerušiť Koniec",
    "confirmDelete": 'Naozaj chcete vymazaš "{id}"?',
    "msg_message": "Správa", "msg_messageList": "Zoznam Správ",
    "msg_batchSend": "Hromadné Odoslanie", "msg_deadLetter": "Mŕtva Pošta",
    "msg_template": "Šablóna", "msg_templateList": "Zoznam Šablón",
    "msg_notification": "Oznámenie", "msg_notificationList": "Zoznam Oznámení",
    "msg_route": "Trasa", "msg_routeRule": "Pravidlo Trasy",
    "msg_preference": "Predvoľba", "msg_messagePreference": "Predvoľba Správ",
}

# === sl-SI Slovenian ===
T["sl-SI"] = {
    "messageTitle": "Upravljanje Sporočil", "messageId": "ID Sporočila",
    "messageChannel": "Kanal", "messageRecipient": "Prejemnik",
    "messageSubject": "Zadeva", "messageSendTime": "Čas Pošiljanja",
    "messageConfirmDelete": 'Ali ste prepričani, da želite izbrisati "{id}"?',
    "operationSuccess": "Operacija Uspešna",
    "templateName": "Ime Predloge", "templateContent": "Vsebina Predloge",
    "templateType": "Vrsta Predloge", "routeName": "Ime Poti",
    "routePriority": "Prioriteta", "routeCondition": "Pogoj Poti",
    "preferenceName": "Ime Nastavitve", "dndEnabled": "Ne Moti",
    "dndStart": "Ne Moti Začetek", "dndEnd": "Ne Moti Konec",
    "confirmDelete": 'Ali ste prepričani, da želite izbrisati "{id}"?',
    "msg_message": "Sporočilo", "msg_messageList": "Seznam Sporočil",
    "msg_batchSend": "Paketno Pošiljanje", "msg_deadLetter": "Mrtvo Pismo",
    "msg_template": "Predloga", "msg_templateList": "Seznam Predlog",
    "msg_notification": "Obvestilo", "msg_notificationList": "Seznam Obvestil",
    "msg_route": "Pot", "msg_routeRule": "Pravilo Poti",
    "msg_preference": "Nastavitev", "msg_messagePreference": "Nastavitev Sporočil",
}

# === sv-SE Swedish ===
T["sv-SE"] = {
    "messageTitle": "Meddelandehantering", "messageId": "Meddelande-ID",
    "messageChannel": "Kanal", "messageRecipient": "Mottagare",
    "messageSubject": "Ämne", "messageSendTime": "Skickat Kl",
    "messageConfirmDelete": 'Är du säker på att du vill ta bort "{id}"?',
    "operationSuccess": "Lyckades",
    "templateName": "Mallnamn", "templateContent": "Mallinnehåll",
    "templateType": "Malltyp", "routeName": "Ruttnamn",
    "routePriority": "Prioritet", "routeCondition": "Ruttvillkor",
    "preferenceName": "Inställningsnamn", "dndEnabled": "Stör Ej",
    "dndStart": "Stör Ej Start", "dndEnd": "Stör Ej Slut",
    "confirmDelete": 'Är du säker på att du vill ta bort "{id}"?',
    "msg_message": "Meddelande", "msg_messageList": "Meddelandelista",
    "msg_batchSend": "Batchsändning", "msg_deadLetter": "Dött Brev",
    "msg_template": "Mall", "msg_templateList": "Mallista",
    "msg_notification": "Notifiering", "msg_notificationList": "Notifieringslista",
    "msg_route": "Rutt", "msg_routeRule": "Ruttregel",
    "msg_preference": "Inställning", "msg_messagePreference": "Meddelandeinställning",
}

# === ta-IN Tamil ===
T["ta-IN"] = {
    "messageTitle": "செய்தி மேலாண்மை", "messageId": "செய்தி ID",
    "messageChannel": "சேனல்", "messageRecipient": "பெறுநர்",
    "messageSubject": "பொருள்", "messageSendTime": "அனுப்பிய நேரம்",
    "messageConfirmDelete": 'நீங்கள் நிச்சயமாக "{id}" அழிக்க விரும்புகிறீர்களா?',
    "operationSuccess": "வெற்றி",
    "templateName": "வார்ப்புரு பெயர்", "templateContent": "வார்ப்புரு உள்ளடக்கம்",
    "templateType": "வார்ப்புரு வகை", "routeName": "பாதை பெயர்",
    "routePriority": "முன்னுரிமை", "routeCondition": "பாதை நிபந்தனை",
    "preferenceName": "விருப்பம் பெயர்", "dndEnabled": "தொந்தரவு வேண்டாம்",
    "dndStart": "தொந்தரவு வேண்டாம் தொடக்கம்", "dndEnd": "தொந்தரவு வேண்டாம் முடிவு",
    "confirmDelete": 'நீங்கள் நிச்சயமாக "{id}" அழிக்க விரும்புகிறீர்களா?',
    "msg_message": "செய்தி", "msg_messageList": "செய்தி பட்டியல்",
    "msg_batchSend": "தொகுப்பு அனுப்பு", "msg_deadLetter": "இறந்த கடிதம்",
    "msg_template": "வார்ப்புரு", "msg_templateList": "வார்ப்புரு பட்டியல்",
    "msg_notification": "அறிவிப்பு", "msg_notificationList": "அறிவிப்பு பட்டியல்",
    "msg_route": "பாதை", "msg_routeRule": "பாதை விதி",
    "msg_preference": "விருப்பம்", "msg_messagePreference": "செய்தி விருப்பம்",
}

# === te-IN Telugu ===
T["te-IN"] = {
    "messageTitle": "సందేశ నిర్వహణ", "messageId": "సందేశ ID",
    "messageChannel": "చానల్", "messageRecipient": "గ్రహీత",
    "messageSubject": "విషయం", "messageSendTime": "పంపిన సమయం",
    "messageConfirmDelete": 'మీరు "{id}" తొలగించాలని ఖచ్చితంగా కోరుతున్నారా?',
    "operationSuccess": "విజయవంతం",
    "templateName": "టెంప్లేట్ పేరు", "templateContent": "టెంప్లేట్ కంటెంట్",
    "templateType": "టెంప్లేట్ రకం", "routeName": "మార్గం పేరు",
    "routePriority": "ప్రాధాన్యత", "routeCondition": "మార్గ షరతు",
    "preferenceName": "ప్రాధాన్యత పేరు", "dndEnabled": "DND",
    "dndStart": "DND ప్రారంభం", "dndEnd": "DND ముగింపు",
    "confirmDelete": 'మీరు "{id}" తొలగించాలని ఖచ్చితంగా కోరుతున్నారా?',
    "msg_message": "సందేశం", "msg_messageList": "సందేశ జాబితా",
    "msg_batchSend": "బ్యాచ్ పంపండి", "msg_deadLetter": "డెడ్ లెటర్",
    "msg_template": "టెంప్లేట్", "msg_templateList": "టెంప్లేట్ జాబితా",
    "msg_notification": "నోటిఫికేషన్", "msg_notificationList": "నోటిఫికేషన్ జాబితా",
    "msg_route": "మార్గం", "msg_routeRule": "మార్గ నియమం",
    "msg_preference": "ప్రాధాన్యత", "msg_messagePreference": "సందేశం ప్రాధాన్యత",
}

# === th-TH Thai ===
T["th-TH"] = {
    "messageTitle": "การจัดการข้อความ", "messageId": "รหัสข้อความ",
    "messageChannel": "ช่อง", "messageRecipient": "ผู้รับ",
    "messageSubject": "หัวข้อ", "messageSendTime": "เวลาส่ง",
    "messageConfirmDelete": 'คุณแน่ใจหรือไม่ว่าต้องการลบ "{id}"?',
    "operationSuccess": "สำเร็จ",
    "templateName": "ชื่อเทมเพลต", "templateContent": "เนื้อหาเทมเพลต",
    "templateType": "ประเภทเทมเพลต", "routeName": "ชื่อเส้นทาง",
    "routePriority": "ลำดับความสำคัญ", "routeCondition": "เงื่อนไขเส้นทาง",
    "preferenceName": "ชื่อการตั้งค่า", "dndEnabled": "ห้ามรบกวน",
    "dndStart": "ห้ามรบกวน เริ่ม", "dndEnd": "ห้ามรบกวน สิ้นสุด",
    "confirmDelete": 'คุณแน่ใจหรือไม่ว่าต้องการลบ "{id}"?',
    "msg_message": "ข้อความ", "msg_messageList": "รายการข้อความ",
    "msg_batchSend": "ส่งแบบกลุ่ม", "msg_deadLetter": "ดดเลตเตอร์",
    "msg_template": "เทมเพลต", "msg_templateList": "รายการเทมเพลต",
    "msg_notification": "การแจ้งเตือน", "msg_notificationList": "รายการแจ้งเตือน",
    "msg_route": "เส้นทาง", "msg_routeRule": "กฎเส้นทาง",
    "msg_preference": "การตั้งค่า", "msg_messagePreference": "การตั้งค่าข้อความ",
}

# === tr-TR Turkish ===
T["tr-TR"] = {
    "messageTitle": "Mesaj Yönetimi", "messageId": "Mesaj ID",
    "messageChannel": "Kanal", "messageRecipient": "Alıcı",
    "messageSubject": "Konu", "messageSendTime": "Gönderme Zamanı",
    "messageConfirmDelete": '"{id}" silmek istediğinizden emin misiniz?',
    "operationSuccess": "Başarılı",
    "templateName": "Şablon Adı", "templateContent": "Şablon İçeriği",
    "templateType": "Şablon Türü", "routeName": "Rota Adı",
    "routePriority": "Öncelik", "routeCondition": "Rota Koşulu",
    "preferenceName": "Tercih Adı", "dndEnabled": "Rahatsız Etmeyin",
    "dndStart": "Rahatsız Etmeyin Başlangıç", "dndEnd": "Rahatsız Etmeyin Bitiş",
    "confirmDelete": '"{id}" silmek istediğinizden emin misiniz?',
    "msg_message": "Mesaj", "msg_messageList": "Mesaj Listesi",
    "msg_batchSend": "Toplu Gönderme", "msg_deadLetter": "Ölü Mektup",
    "msg_template": "Şablon", "msg_templateList": "Şablon Listesi",
    "msg_notification": "Bildirim", "msg_notificationList": "Bildirim Listesi",
    "msg_route": "Rota", "msg_routeRule": "Rota Kuralı",
    "msg_preference": "Tercih", "msg_messagePreference": "Mesaj Tercihi",
}

# === uk-UA Ukrainian ===
T["uk-UA"] = {
    "messageTitle": "Управління Повідомленнями", "messageId": "ID Повідомлення",
    "messageChannel": "Канал", "messageRecipient": "Одержувач",
    "messageSubject": "Тема", "messageSendTime": "Час Відправлення",
    "messageConfirmDelete": 'Ви впевнені, що хочете видалити "{id}"?',
    "operationSuccess": "Операція Виконана",
    "templateName": "Ім'я Шаблону", "templateContent": "Вміст Шаблону",
    "templateType": "Тип Шаблону", "routeName": "Ім'я Маршруту",
    "routePriority": "Пріоритет", "routeCondition": "Умова Маршруту",
    "preferenceName": "Ім'я Налаштування", "dndEnabled": "Не Турбувати",
    "dndStart": "Не Турбувати Початок", "dndEnd": "Не Турбувати Кінець",
    "confirmDelete": 'Ви впевнені, що хочете видалити "{id}"?',
    "msg_message": "Повідомлення", "msg_messageList": "Список Повідомлень",
    "msg_batchSend": "Пакетна Відправка", "msg_deadLetter": "Мертвий Лист",
    "msg_template": "Шаблон", "msg_templateList": "Список Шаблонів",
    "msg_notification": "Сповіщення", "msg_notificationList": "Список Сповіщень",
    "msg_route": "Маршрут", "msg_routeRule": "Правила Маршрутизації",
    "msg_preference": "Налаштування", "msg_messagePreference": "Налаштування Повідомлень",
}

# === uz-UZ Uzbek ===
T["uz-UZ"] = {
    "messageTitle": "Xabarlar Boshqaruvi", "messageId": "Xabar ID",
    "messageChannel": "Kanal", "messageRecipient": "Qabul qiluvchi",
    "messageSubject": "Mavzu", "messageSendTime": "Yuborish vaqti",
    "messageConfirmDelete": '"{id}" ni oʻchirishga ishonchingiz komilmi?',
    "operationSuccess": "Muvaffaqiyatli",
    "templateName": "Shablon nomi", "templateContent": "Shablon tarkibi",
    "templateType": "Shablon turi", "routeName": "Yoʻnalish nomi",
    "routePriority": "Ustuvorlik", "routeCondition": "Yoʻnalish sharti",
    "preferenceName": "Sozlash nomi", "dndEnabled": "Bezovta qilmang",
    "dndStart": "Bezovta qilmang Boshlanish", "dndEnd": "Bezovta qilmang Tugash",
    "confirmDelete": '"{id}" ni oʻchirishga ishonchingiz komilmi?',
    "msg_message": "Xabar", "msg_messageList": "Xabarlar roʻyxati",
    "msg_batchSend": "Ommaviy yuborish", "msg_deadLetter": "Oʻlik xat",
    "msg_template": "Shablon", "msg_templateList": "Shablonlar roʻyxati",
    "msg_notification": "Bildirishnoma", "msg_notificationList": "Bildirishnomalar roʻyxati",
    "msg_route": "Yoʻnalish", "msg_routeRule": "Yoʻnalish qoidasi",
    "msg_preference": "Sozlash", "msg_messagePreference": "Xabar sozlamalari",
}

# === vi-VN Vietnamese ===
T["vi-VN"] = {
    "messageTitle": "Quản lý Tin nhắn", "messageId": "ID Tin nhắn",
    "messageChannel": "Kênh", "messageRecipient": "Người nhận",
    "messageSubject": "Chủ đề", "messageSendTime": "Thời gian Gửi",
    "messageConfirmDelete": 'Bạn có chắc chắn muốn xóa "{id}" không?',
    "operationSuccess": "Thành công",
    "templateName": "Tên Mẫu", "templateContent": "Nội dung Mẫu",
    "templateType": "Loại Mẫu", "routeName": "Tên Tuyến",
    "routePriority": "Độ ưu tiên", "routeCondition": "Điều kiện Tuyến",
    "preferenceName": "Tên Tùy chọn", "dndEnabled": "Đừng làm phiền",
    "dndStart": "Đừng làm phiền Bắt đầu", "dndEnd": "Đừng làm phiền Kết thúc",
    "confirmDelete": 'Bạn có chắc chắn muốn xóa "{id}" không?',
    "msg_message": "Tin nhắn", "msg_messageList": "Danh sách Tin nhắn",
    "msg_batchSend": "Gửi Hàng loạt", "msg_deadLetter": "Thư Chết",
    "msg_template": "Mẫu", "msg_templateList": "Danh sách Mẫu",
    "msg_notification": "Thông báo", "msg_notificationList": "Danh sách Thông báo",
    "msg_route": "Tuyến", "msg_routeRule": "Quy tắc Tuyến",
    "msg_preference": "Tùy chọn", "msg_messagePreference": "Tùy chọn Tin nhắn",
}

# === zh-HK Traditional Chinese (Hong Kong) ===
T["zh-HK"] = {
    "messageTitle": "訊息管理", "messageId": "訊息 ID",
    "messageChannel": "頻道", "messageRecipient": "收件人",
    "messageSubject": "主旨", "messageSendTime": "發送時間",
    "messageConfirmDelete": '確定刪除 "{id}" 嗎？',
    "operationSuccess": "操作成功",
    "templateName": "模板名稱", "templateContent": "模板內容",
    "templateType": "模板類型", "routeName": "路由名稱",
    "routePriority": "優先順序", "routeCondition": "路由條件",
    "preferenceName": "偏好設定名稱", "dndEnabled": "勿擾模式",
    "dndStart": "勿擾開始", "dndEnd": "勿擾結束",
    "confirmDelete": '確定刪除 "{id}" 嗎？',
    "msg_message": "訊息", "msg_messageList": "訊息清單",
    "msg_batchSend": "批次發送", "msg_deadLetter": "死信",
    "msg_template": "模板", "msg_templateList": "模組清單",
    "msg_notification": "通知", "msg_notificationList": "通知清單",
    "msg_route": "路由", "msg_routeRule": "路由規則",
    "msg_preference": "偏好設定", "msg_messagePreference": "訊息偏好設定",
}

# === zh-TW Traditional Chinese (Taiwan) ===
T["zh-TW"] = {
    "messageTitle": "訊息管理", "messageId": "訊息 ID",
    "messageChannel": "頻道", "messageRecipient": "收件者",
    "messageSubject": "主旨", "messageSendTime": "發送時間",
    "messageConfirmDelete": '確定刪除 "{id}"？',
    "operationSuccess": "操作成功",
    "templateName": "範本名稱", "templateContent": "範本內容",
    "templateType": "範本類型", "routeName": "路由名稱",
    "routePriority": "優先順序", "routeCondition": "路由條件",
    "preferenceName": "偏好設定名稱", "dndEnabled": "勿擾模式",
    "dndStart": "勿擾開始", "dndEnd": "勿擾結束",
    "confirmDelete": '確定刪除 "{id}"？',
    "msg_message": "訊息", "msg_messageList": "訊息清單",
    "msg_batchSend": "批次發送", "msg_deadLetter": "死信",
    "msg_template": "範本", "msg_templateList": "範本清單",
    "msg_notification": "通知", "msg_notificationList": "通知清單",
    "msg_route": "路由", "msg_routeRule": "路由規則",
    "msg_preference": "偏好設定", "msg_messagePreference": "訊息偏好設定",
}

# === Problematic locales - use English ===
EN_FALLBACK_LOCALES = ["mn-MN", "sr-RS", "sq-AL", "sw-KE"]
for loc in EN_FALLBACK_LOCALES:
    T[loc] = EN.copy()



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

def get_create_edit_delete(comm_data):
    """Extract create/edit/delete from comm data, handling both flat and nested formats."""
    create_val = ""
    edit_val = ""
    delete_val = ""
    # Flat format
    if "create" in comm_data:
        create_val = comm_data["create"]
    if "edit" in comm_data:
        edit_val = comm_data["edit"]
    if "delete" in comm_data:
        delete_val = comm_data["delete"]
    # Nested format: actionTitle.create/edit/delete
    if not create_val and "actionTitle" in comm_data:
        at = comm_data["actionTitle"]
        if "create" in at:
            create_val = at["create"].replace(" {0}", "").replace("{0}", "")
        if "edit" in at:
            edit_val = at["edit"].replace(" {0}", "").replace("{0}", "")
        if "delete" in at:
            delete_val = at["delete"].replace(" {0}", "").replace("{0}", "")
    # Nested format: crud.create/edit/delete
    if not create_val and "crud" in comm_data:
        crud = comm_data["crud"]
        if "create" in crud and not create_val:
            create_val = crud["create"]
        if "edit" in crud and not edit_val:
            edit_val = crud["edit"]
        if "delete" in crud and not delete_val:
            delete_val = crud["delete"]
    return create_val, edit_val, delete_val

def build_business_json(locale, comm_data):
    """Build business.json content for a locale."""
    is_corr = is_corrupted(comm_data)
    t = T.get(locale, {})

    # For create/edit/delete, prefer comm if available
    comm_create, comm_edit, comm_delete = get_create_edit_delete(comm_data)
    create_val = comm_create if comm_create and not is_corr else t.get("create", EN.get("create", "Add"))
    edit_val = comm_edit if comm_edit and not is_corr else t.get("edit", EN.get("edit", "Edit"))
    delete_val = comm_delete if comm_delete and not is_corr else t.get("delete", EN.get("delete", "Delete"))

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
    """Build page.json content for a locale."""
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
