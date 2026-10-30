/**
 * ydsz-ui Komponens beépített magyar szöveg（hu-HU）。
 *
 * A kulcsok pontosan megfelelnek a zh-CN.ts;
 * A {placeholder} helyőrzők támogatva vannak.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\hu-HU.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Magyar üzenettáblázat —— 匈牙利语 */
export const huHU = {
  // ===== Általános =====
  'common.confirm': 'Megerősítés',
  'common.cancel': 'Mégse',
  'common.loading': 'Betöltés...',
  'common.search': 'Keresés',
  'common.reset': 'Visszaállítás',
  'common.submit': 'Küldés',
  'common.close': 'Bezárás',
  'common.more': 'Több',
  'common.expand': 'Kibontás',
  'common.collapse': 'Összecsukás',
  'common.copy': 'Másolás',
  'common.copied': 'Másolva',
  'common.delete': 'Törlés',
  'common.edit': 'Szerkesztés',
  'common.add': 'Hozzáadás',
  'common.save': 'Mentés',
  'common.refresh': 'Frissítés',
  'common.required': 'Kötelező',
  'common.preview': 'Előnézet',
  'common.clear': 'Törlés',
  'common.retry': 'Újra',
  'common.searchPlaceholder': 'Keresés...',

  // ===== Táblázat =====
  'table.empty': 'Nincs adat',
  'table.loading': 'Betöltés...',
  'table.total': '{count} rekord',
  'table.page': '{page}. oldal',
  'table.filter.confirm': 'Szűrő',
  'table.filter.reset': 'Visszaállítás',
  'table.sort.asc': 'Növekvő',
  'table.sort.desc': 'Csökkenő',
  'table.selectAll': 'Összes kijelölése',
  'table.selectRow': 'Sor kijelölése',
  'table.cancelSelect': 'Kijelölés visszavonása',
  'table.expandedRow': 'Sor kibontása',
  'table.collapseRow': 'Sor összecsukása',
  'table.columnSetting': 'Oszlopbeállítások',
  'table.editCell': 'Cella szerkesztése',
  'table.sortHint': 'Kattintson a rendezéshez, Shift+kattintás a többszörös rendezéshez',
  'table.resizeColumn': 'Húzza az oszlop szélességének módosításához',
  'table.dragColumn': 'Húzza az oszlopok átrendezéséhez',

  // ===== Kiválasztás =====
  'select.placeholder': 'Válasszon',
  'select.search': 'Opciók keresése',
  'select.empty': 'Nincs egyező opció',
  'select.loading': 'Betöltés...',
  'select.selectAll': 'Összes kijelölése',
  'select.clear': 'Törlés',
  'select.removeTag': 'Eltávolítás',
  'create.label': '"{value}" létrehozása',

  // ===== Űrlap =====
  'form.validating': 'Érvényesítés...',
  'form.submitting': 'Küldés...',
  'form.required': 'Ez a mező kötelező',
  'form.invalid': 'Érvénytelen formátum',
  'form.passwordMismatch': 'A jelszavak nem egyeznek',
  'form.validateSuccess': 'Érvényesítés sikeres',
  'form.validateFailed': 'Érvényesítés sikertelen, ellenőrizze a bevitelt',

  // ===== Párbeszéd =====
  'dialog.close': 'Bezárás',
  'dialog.confirm': 'Megerősítés',
  'dialog.cancel': 'Mégse',
  'dialog.deleteConfirm': 'Megerősíti a törlést?',
  'dialog.deleteWarning': 'Ez a művelet nem vonható vissza',

  // ===== Fiók =====
  'drawer.ariaLabel': 'Fiók',
  'drawer.close': 'Bezárás',
  'drawer.closeAriaLabel': 'Fiók bezárása',
  'drawer.confirm': 'Megerősítés',
  'drawer.cancel': 'Mégse',

  // ===== Lapozás =====
  'pagination.page': 'Oldal',
  'pagination.total': 'Összesen {count} rekord',
  'pagination.size': '/ oldal',
  'pagination.jumpTo': 'Ugrás',
  'pagination.prev': 'Előző',
  'pagination.next': 'Következő',
  'pagination.first': 'Első',
  'pagination.last': 'Utolsó',

  // ===== Dátumválasztó =====
  'datepicker.placeholder': 'Válasszon dátumot',
  'datepicker.startPlaceholder': 'Kezdés dátuma',
  'datepicker.endPlaceholder': 'Befejezés dátuma',
  'datepicker.today': 'Ma',
  'datepicker.yesterday': 'Tegnap',
  'datepicker.thisWeek': 'E héten',
  'datepicker.thisMonth': 'E hónapban',
  'datepicker.thisYear': 'Ebben az évben',
  'datepicker.clear': 'Törlés',
  'datepicker.confirm': 'Megerősítés',
  'datepicker.openCalendar': 'Naptár megnyitása',
  'datepicker.previousMonth': 'Előző hónap',
  'datepicker.nextMonth': 'Következő hónap',

  // ===== Üres állapot =====
  'empty.default': 'Nincs adat',
  'empty.search': 'Nincs találat',
  'empty.networkError': 'Hálózati hiba',
  'empty.retry': 'Kattintson az újrapróbálkozáshoz',
  'empty.created': 'Kezdje el létrehozni',
  'empty.error': 'A betöltés sikertelen',
  'empty.no-data': 'Nincs adat',
  'empty.no-permission': 'Nincs engedély',
  'empty.no-result': 'Nincs egyező találat',

  // ===== Üzenet =====
  'message.success': 'Siker',
  'message.error': 'Hiba',
  'message.warning': 'Figyelmeztetés',
  'message.info': 'Információ',
  'message.closeAriaLabel': 'Üzenet bezárása',

  // ===== Értesítés =====
  'notification.title': 'Értesítések',
  'notification.empty': 'Nincs értesítés',
  'notification.markAllRead': 'Összes megjelölése olvasottként',
  'notification.viewAll': 'Összes megtekintése',
  'notification.closeAriaLabel': 'Értesítés bezárása',
  'notification.region': 'Értesítések',

  // ===== Toast =====
  'toast.region': 'Értesítések',

  // ===== Feltöltés =====
  'upload.drag': 'Kattintson vagy húzza ide a fájlt a feltöltéshez',
  'upload.dragging': 'Engedje el a feltöltéshez',
  'upload.error': 'A feltöltés sikertelen',
  'upload.success': 'A feltöltés sikeres',
  'upload.preview': 'Előnézet',
  'upload.remove': 'Eltávolítás',
  'upload.retry': 'Újra',
  'upload.maxSize': 'A fájlméret meghaladja a korlátot',
  'upload.maxCount': 'A fájlok száma meghaladja a korlátot',
  'upload.invalidFormat': 'Nem támogatott fájlformátum',
  'upload.clickToUpload': 'Kattintson a feltöltéshez',
  'upload.dragTipPrefix': 'Húzza ide a fájlt, vagy ',

  // ===== Feltöltés =====
  'fileUpload.clickToUpload': 'Kattintson vagy húzza a feltöltéshez',
  'fileUpload.dragAndDrop': 'Húzza a fájlokat erre a területre',
  'fileUpload.fileSize': 'Méret',
  'upload.fileListAriaLabel': 'Feltöltött fájlok listája',

  // ===== Automata kiegészítés =====
  'autoComplete.placeholder': 'Írjon be egy kulcsszót',
  'autoComplete.emptyText': 'Nincs egyező elem',
  'autoComplete.loadingText': 'Betöltés...',
  'autoComplete.clearAriaLabel': 'Bevitel törlése',

  // ===== Rendezés lista =====
  'orderList.moveToTop': 'Mozgatás az elejére',
  'orderList.moveUp': 'Mozgatás fel',
  'orderList.moveDown': 'Mozgatás le',
  'orderList.moveToBottom': 'Mozgatás a végére',
  'orderList.filterPlaceholder': 'Keresés',
  'orderList.ariaLabel': 'Húzható rendezési lista',
  'orderList.listAriaLabel': 'Rendezési lista',

  // ===== Választás lista =====
  'pickList.sourceLabel': 'Forrás lista',
  'pickList.targetLabel': 'Cél lista',
  'pickList.moveToTarget': 'Mozgatás a célba',
  'pickList.moveToSource': 'Visszamozgatás a forrásba',
  'pickList.moveAllToTarget': 'Összes mozgatása a célba',
  'pickList.moveAllToSource': 'Összes visszamozgatása a forrásba',
  'pickList.filterPlaceholder': 'Keresés',

  // ===== QR-kód =====
  'qrCode.download': 'QR-kód letöltése',
  'qrCode.generateFailed': 'Nem sikerült létrehozni a QR-kódot',
  'qrCode.ariaLabel': 'QR-kód {value}',
  'qrCode.hint.url': 'Olvasva nyissa meg a hivatkozást',
  'qrCode.hint.text': 'QR-kód beolvasása',
  'qrCode.hint.vcard': 'Vegy fel egy kapcsolatot',
  'qrCode.hint.download': 'Fájl letöltéséhez olvassa be',
  'qrCode.hint.wifi': 'Csatlakozáshoz olvassa be',

  // ===== Cascader / PinInput / Mention =====
  'cascader.ariaLabel': 'Lépcsőzetes választó',
  'cascader.searchPlaceholder': 'Keresés...',
  'common.clearAriaLabel': 'Bevitel törlése',
  'mention.ariaLabel': 'Említés bevitel',
  'mention.optionsAriaLabel': 'Említés javaslatok',
  'mention.placeholder': 'Írjon @ jelet az említéshez',
  'pinInput.ariaLabel': 'Ellenőrző kód',
  'pinInput.groupAriaLabel': 'Ellenőrző kód számjegyei',
  'pinInput.itemAriaLabel': 'Ellenőrző kód {index}. számjegye',
  'pinInput.sendAriaLabel': 'Ellenőrző kód küldése',
  'pinInput.sendingAriaLabel': 'Ellenőrző kód küldése folyamatban',
  'popconfirm.defaultTitle': 'Megerősíti ezt a műveletet?',

  // ===== Színválasztó =====
  'colorPicker.ariaLabel': 'Színválasztó',
  'colorPicker.clear': 'Szín törlése',
  'colorPicker.custom': 'Egyéni',
  'colorPicker.presets': 'Előbeállítások',
  'colorPicker.saturationAriaLabel': 'Telítettség választó',
  'colorPicker.unselected': 'Nincs kiválasztva',

  // ===== Kép =====
  'image.closeAriaLabel': 'Előnézet bezárása',
  'image.itemAriaLabel': 'Kép {index}',
  'image.nextAriaLabel': 'Következő kép',
  'image.prevAriaLabel': 'Előző kép',
  'image.previewAlt': 'Kép előnézet {index}',
  'image.previewAriaLabel': 'Kép előnézet',
  'image.switchAriaLabel': 'Kép váltó',
  'image.zoomInAriaLabel': 'Nagyítás',
  'image.zoomOutAriaLabel': 'Kicsinyítés',
  'image.rotateLeftAriaLabel': 'Forgatás balra',
  'image.rotateRightAriaLabel': 'Forgatás jobbra',
  'image.resetTransformAriaLabel': 'Nagyítás és forgatás visszaállítása',

  // ===== Beviteli címkék =====
  'inputTags.ariaLabel': 'Címke bevitel ({count} címke)',
  'inputTags.placeholder': 'Adjon meg egy címkét',
  'inputTags.removeAriaLabel': 'Címke {tag} eltávolítása',
  'inputTags.tagAriaLabel': 'Címke: {tag}',

  // ===== Időválasztó =====
  'calendar.monthOption': '{month}',
  'calendar.selectMonthAriaLabel': 'Válasszon hónapot',
  'calendar.selectYearAriaLabel': 'Válasszon évet',
  'calendar.yearOption': '{year}',
  'datepicker.yearMonth': '{month}.{year}',
  'pagination.sizeOption': '{size} / oldal',
  'rangePicker.ariaLabel': 'Dátumtartomány-választó',
  'rangePicker.endTimePlaceholder': 'Befejezés ideje',
  'rangePicker.startTimePlaceholder': 'Kezdés ideje',
  'rangePicker.to': '-',
  'timepicker.ariaLabel': 'Időpontválasztó',
  'timepicker.clearAriaLabel': 'Idő törlése',
  'timepicker.hourAriaLabel': 'Óra',
  'timepicker.meridiemAriaLabel': 'DE/DU',
  'timepicker.minuteAriaLabel': 'Perc',
  'timepicker.placeholder': 'Válasszon időpontot',
  'timepicker.secondAriaLabel': 'Másodperc',
} as const satisfies Record<string, string>;

export default huHU;
