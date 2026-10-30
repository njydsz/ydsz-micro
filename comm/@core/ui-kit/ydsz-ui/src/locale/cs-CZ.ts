/**
 * ydsz-ui Komponenta vestavěný český text（cs-CZ）。
 *
 * Klíče přesně odpovídají zh-CN.ts;
 * Jsou podporovány zástupné symboly {placeholder}.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\cs-CZ.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Česká tabulka zpráv —— 捷克语 */
export const csCZ = {
  // ===== Obecné =====
  'common.confirm': 'Potvrdit',
  'common.cancel': 'Zrušit',
  'common.loading': 'Načítání...',
  'common.search': 'Hledat',
  'common.reset': 'Resetovat',
  'common.submit': 'Odeslat',
  'common.close': 'Zavřít',
  'common.more': 'Více',
  'common.expand': 'Rozbalit',
  'common.collapse': 'Sbalit',
  'common.copy': 'Kopírovat',
  'common.copied': 'Zkopírováno',
  'common.delete': 'Smazat',
  'common.edit': 'Upravit',
  'common.add': 'Přidat',
  'common.save': 'Uložit',
  'common.refresh': 'Obnovit',
  'common.required': 'Povinné',
  'common.preview': 'Náhled',
  'common.clear': 'Vymazat',
  'common.retry': 'Opakovat',
  'common.searchPlaceholder': 'Hledat...',

  // ===== Tabulka =====
  'table.empty': 'Žádná data',
  'table.loading': 'Načítání...',
  'table.total': '{count} záznamů',
  'table.page': 'Strana {page}',
  'table.filter.confirm': 'Filtrovat',
  'table.filter.reset': 'Resetovat',
  'table.sort.asc': 'Vzestupně',
  'table.sort.desc': 'Sestupně',
  'table.selectAll': 'Vybrat vše',
  'table.selectRow': 'Vybrat řádek',
  'table.cancelSelect': 'Zrušit výběr',
  'table.expandedRow': 'Rozbalit řádek',
  'table.collapseRow': 'Sbalit řádek',
  'table.columnSetting': 'Nastavení sloupců',
  'table.editCell': 'Upravit buňku',
  'table.sortHint': 'Kliknutí pro řazení, Shift+pro vícenásobné řazení',
  'table.resizeColumn': 'Táhnout pro změnu šířky sloupce',
  'table.dragColumn': 'Táhnout pro změnu pořadí sloupců',

  // ===== Výběr =====
  'select.placeholder': 'Vyberte',
  'select.search': 'Hledat možnosti',
  'select.empty': 'Žádné odpovídající možnosti',
  'select.loading': 'Načítání...',
  'select.selectAll': 'Vybrat vše',
  'select.clear': 'Vymazat',
  'select.removeTag': 'Odebrat',
  'create.label': 'Vytvořit "{value}"',

  // ===== Formulář =====
  'form.validating': 'Ověřování...',
  'form.submitting': 'Odesílání...',
  'form.required': 'Toto pole je povinné',
  'form.invalid': 'Neplatný formát',
  'form.passwordMismatch': 'Hesla se neshodují',
  'form.validateSuccess': 'Ověření proběhlo úspěšně',
  'form.validateFailed': 'Ověření selhalo, zkontrolujte zadané údaje',

  // ===== Dialog =====
  'dialog.close': 'Zavřít',
  'dialog.confirm': 'Potvrdit',
  'dialog.cancel': 'Zrušit',
  'dialog.deleteConfirm': 'Potvrdit smazání?',
  'dialog.deleteWarning': 'Tuto akci nelze vrátit zpět',

  // ===== Zásuvka =====
  'drawer.ariaLabel': 'Zásuvka',
  'drawer.close': 'Zavřít',
  'drawer.closeAriaLabel': 'Zavřít zásuvku',
  'drawer.confirm': 'Potvrdit',
  'drawer.cancel': 'Zrušit',

  // ===== Stránkování =====
  'pagination.page': 'Strana',
  'pagination.total': 'Celkem {count} záznamů',
  'pagination.size': '/ strana',
  'pagination.jumpTo': 'Přejít na',
  'pagination.prev': 'Předchozí',
  'pagination.next': 'Další',
  'pagination.first': 'První',
  'pagination.last': 'Poslední',

  // ===== Výběr data =====
  'datepicker.placeholder': 'Vyberte datum',
  'datepicker.startPlaceholder': 'Datum začátku',
  'datepicker.endPlaceholder': 'Datum konce',
  'datepicker.today': 'Dnes',
  'datepicker.yesterday': 'Včera',
  'datepicker.thisWeek': 'Tento týden',
  'datepicker.thisMonth': 'Tento měsíc',
  'datepicker.thisYear': 'Tento rok',
  'datepicker.clear': 'Vymazat',
  'datepicker.confirm': 'Potvrdit',
  'datepicker.openCalendar': 'Otevřít kalendář',
  'datepicker.previousMonth': 'Předchozí měsíc',
  'datepicker.nextMonth': 'Následující měsíc',

  // ===== Prázdný stav =====
  'empty.default': 'Žádná data',
  'empty.search': 'Nebyly nalezeny žádné výsledky',
  'empty.networkError': 'Chyba sítě',
  'empty.retry': 'Klikněte pro opakování',
  'empty.created': 'Začněte vytvářet',
  'empty.error': 'Načítání selhalo',
  'empty.no-data': 'Žádná data',
  'empty.no-permission': 'Žádné oprávnění',
  'empty.no-result': 'Žádné odpovídající výsledky',

  // ===== Zpráva =====
  'message.success': 'Úspěch',
  'message.error': 'Chyba',
  'message.warning': 'Varování',
  'message.info': 'Info',
  'message.closeAriaLabel': 'Zavřít zprávu',

  // ===== Upozornění =====
  'notification.title': 'Oznámení',
  'notification.empty': 'Žádná oznámení',
  'notification.markAllRead': 'Označit vše jako přečtené',
  'notification.viewAll': 'Zobrazit vše',
  'notification.closeAriaLabel': 'Zavřít oznámení',
  'notification.region': 'Oznámení',

  // ===== Toast =====
  'toast.region': 'Oznámení',

  // ===== Nahrávání =====
  'upload.drag': 'Kliknutím nebo přetažením souboru do této oblasti jej nahrajete',
  'upload.dragging': 'Pro nahrajte uvolněte',
  'upload.error': 'Nahrávání selhalo',
  'upload.success': 'Nahrávání úspěšné',
  'upload.preview': 'Náhled',
  'upload.remove': 'Odebrat',
  'upload.retry': 'Opakovat',
  'upload.maxSize': 'Velikost souboru přesahuje limit',
  'upload.maxCount': 'Počet souborů přesahuje limit',
  'upload.invalidFormat': 'Nepodporovaný formát souboru',
  'upload.clickToUpload': 'Klikněte pro nahrání',
  'upload.dragTipPrefix': 'Přetáhněte soubor sem nebo ',

  // ===== Nahrávání / Soubor =====
  'fileUpload.clickToUpload': 'Klikněte nebo přetáhněte pro nahrání',
  'fileUpload.dragAndDrop': 'Přetáhněte soubory do této oblasti',
  'fileUpload.fileSize': 'Velikost',
  'upload.fileListAriaLabel': 'Seznam nahraných souborů',

  // ===== Automatické doplňování =====
  'autoComplete.placeholder': 'Zadejte klíčové slovo',
  'autoComplete.emptyText': 'Žádné odpovídající položky',
  'autoComplete.loadingText': 'Načítání...',
  'autoComplete.clearAriaLabel': 'Vymazat vstup',

  // ===== Seřadit seznam =====
  'orderList.moveToTop': 'Přesunout nahoru',
  'orderList.moveUp': 'Přesunout výše',
  'orderList.moveDown': 'Přesunout níže',
  'orderList.moveToBottom': 'Přesunout dolů',
  'orderList.filterPlaceholder': 'Hledat',
  'orderList.ariaLabel': 'Seznam řazený přetažením',
  'orderList.listAriaLabel': 'Seznam řazení',

  // ===== Seznam výběru =====
  'pickList.sourceLabel': 'Zdrojový seznam',
  'pickList.targetLabel': 'Cílový seznam',
  'pickList.moveToTarget': 'Přesunout do cílového',
  'pickList.moveToSource': 'Vrátit do zdrojového',
  'pickList.moveAllToTarget': 'Přesunout vše do cílového',
  'pickList.moveAllToSource': 'Vrátit vše do zdrojového',
  'pickList.filterPlaceholder': 'Hledat',

  // ===== QR kód =====
  'qrCode.download': 'Stáhnout QR kód',
  'qrCode.generateFailed': 'Nepodařilo se vygenerovat QR kód',
  'qrCode.ariaLabel': 'QR kód {value}',
  'qrCode.hint.url': 'Naskenujte pro otevření odkazu',
  'qrCode.hint.text': 'Naskenujte QR kód',
  'qrCode.hint.vcard': 'Naskenujte pro přidání kontaktu',
  'qrCode.hint.download': 'Naskenujte pro stažení souboru',
  'qrCode.hint.wifi': 'Naskenujte pro připojení k WiFi',

  // ===== Cascader / PinInput / Mention =====
  'cascader.ariaLabel': 'Kaskádový výběr',
  'cascader.searchPlaceholder': 'Hledat...',
  'common.clearAriaLabel': 'Vymazat vstup',
  'mention.ariaLabel': 'Vstup zmínky',
  'mention.optionsAriaLabel': 'Návrhy zmínek',
  'mention.placeholder': 'Napište @ pro zmínku',
  'pinInput.ariaLabel': 'Ověřovací kód',
  'pinInput.groupAriaLabel': 'Číslice ověřovacího kódu',
  'pinInput.itemAriaLabel': 'Číslice {index} ověřovacího kódu',
  'pinInput.sendAriaLabel': 'Odeslat ověřovací kód',
  'pinInput.sendingAriaLabel': 'Odesílání ověřovacího kódu',
  'popconfirm.defaultTitle': 'Potvrdit tuto akci?',

  // ===== Výběr barvy =====
  'colorPicker.ariaLabel': 'Výběr barvy',
  'colorPicker.clear': 'Vymazat barvu',
  'colorPicker.custom': 'Vlastní',
  'colorPicker.presets': 'Předvolby',
  'colorPicker.saturationAriaLabel': 'Výběr sytosti',
  'colorPicker.unselected': 'Nevybráno',

  // ===== Obrázek =====
  'image.closeAriaLabel': 'Zavřít náhled',
  'image.itemAriaLabel': 'Obrázek {index}',
  'image.nextAriaLabel': 'Následující obrázek',
  'image.prevAriaLabel': 'Předchozí obrázek',
  'image.previewAlt': 'Náhled obrázku {index}',
  'image.previewAriaLabel': 'Náhled obrázku',
  'image.switchAriaLabel': 'Přepínač obrázků',
  'image.zoomInAriaLabel': 'Přiblížit',
  'image.zoomOutAriaLabel': 'Oddálit',
  'image.rotateLeftAriaLabel': 'Otočit doleva',
  'image.rotateRightAriaLabel': 'Otočit doprava',
  'image.resetTransformAriaLabel': 'Resetovat přiblížení a otočení',

  // ===== Štítky vstupu =====
  'inputTags.ariaLabel': 'Vstup štítků ({count} štítků)',
  'inputTags.placeholder': 'Zadejte štítek',
  'inputTags.removeAriaLabel': 'Odebrat štítek {tag}',
  'inputTags.tagAriaLabel': 'Štítek: {tag}',

  // ===== Výběr času / Výběr rozsahu =====
  'calendar.monthOption': '{month}',
  'calendar.selectMonthAriaLabel': 'Vyberte měsíc',
  'calendar.selectYearAriaLabel': 'Vyberte rok',
  'calendar.yearOption': '{year}',
  'datepicker.yearMonth': '{month}.{year}',
  'pagination.sizeOption': '{size} / str.',
  'rangePicker.ariaLabel': 'Výběr rozsahu dat',
  'rangePicker.endTimePlaceholder': 'Čas konce',
  'rangePicker.startTimePlaceholder': 'Čas začátku',
  'rangePicker.to': '-',
  'timepicker.ariaLabel': 'Výběr času',
  'timepicker.clearAriaLabel': 'Vymazat čas',
  'timepicker.hourAriaLabel': 'Hodiny',
  'timepicker.meridiemAriaLabel': 'AM/PM',
  'timepicker.minuteAriaLabel': 'Minuty',
  'timepicker.placeholder': 'Vyberte čas',
  'timepicker.secondAriaLabel': 'Sekundy',
} as const satisfies Record<string, string>;

export default csCZ;
