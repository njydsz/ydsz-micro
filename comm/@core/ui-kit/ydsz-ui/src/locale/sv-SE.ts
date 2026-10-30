/**
 * ydsz-ui Komponent inbyggd svensk text（sv-SE）。
 *
 * Nycklar motsvarar exakt zh-CN.ts;
 * {placeholder}-platshållare stöds.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\sv-SE.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Svensk meddelandetabell —— 瑞典语 */
export const svSE = {
  // ===== Allmänt =====
  'common.confirm': 'Bekräfta',
  'common.cancel': 'Avbryt',
  'common.loading': 'Laddar...',
  'common.search': 'Sök',
  'common.reset': 'Återställ',
  'common.submit': 'Skicka',
  'common.close': 'Stäng',
  'common.more': 'Mer',
  'common.expand': 'Expandera',
  'common.collapse': 'Dölj',
  'common.copy': 'Kopiera',
  'common.copied': 'Kopierad',
  'common.delete': 'Ta bort',
  'common.edit': 'Redigera',
  'common.add': 'Lägg till',
  'common.save': 'Spara',
  'common.refresh': 'Uppdatera',
  'common.required': 'Obligatoriskt',
  'common.preview': 'Förhandsgranska',
  'common.clear': 'Rensa',
  'common.retry': 'Försök igen',
  'common.searchPlaceholder': 'Sök...',

  // ===== Tabell =====
  'table.empty': 'Inga data',
  'table.loading': 'Laddar...',
  'table.total': '{count} poster',
  'table.page': 'Sida {page}',
  'table.filter.confirm': 'Filtrera',
  'table.filter.reset': 'Återställ',
  'table.sort.asc': 'Stigande',
  'table.sort.desc': 'Fallande',
  'table.selectAll': 'Markera allt',
  'table.selectRow': 'Markera rad',
  'table.cancelSelect': 'Avbryt markering',
  'table.expandedRow': 'Expandera rad',
  'table.collapseRow': 'Dölj rad',
  'table.columnSetting': 'Kolumninställningar',
  'table.editCell': 'Redigera cell',
  'table.sortHint': 'Klicka för att sortera, Shift+klick för multipelsortering',
  'table.resizeColumn': 'Dra för att ändra kolumnbredd',
  'table.dragColumn': 'Dra för att ändra kolumnordning',

  // ===== Välj =====
  'select.placeholder': 'Välj',
  'select.search': 'Sök alternativ',
  'select.empty': 'Inga matchande alternativ',
  'select.loading': 'Laddar...',
  'select.selectAll': 'Markera allt',
  'select.clear': 'Rensa',
  'select.removeTag': 'Ta bort',
  'create.label': 'Skapa "{value}"',

  // ===== Formulär =====
  'form.validating': 'Validerar...',
  'form.submitting': 'Skickar...',
  'form.required': 'Detta fält är obligatoriskt',
  'form.invalid': 'Ogiltigt format',
  'form.passwordMismatch': 'Lösenorden stämmer inte överens',
  'form.validateSuccess': 'Validering lyckades',
  'form.validateFailed': 'Validering misslyckades, kontrollera inmatningen',

  // ===== Dialog =====
  'dialog.close': 'Stäng',
  'dialog.confirm': 'Bekräfta',
  'dialog.cancel': 'Avbryt',
  'dialog.deleteConfirm': 'Bekräfta borttagning?',
  'dialog.deleteWarning': 'Denna åtgärd kan inte ångras',

  // ===== Låda =====
  'drawer.ariaLabel': 'Låda',
  'drawer.close': 'Stäng',
  'drawer.closeAriaLabel': 'Stäng låda',
  'drawer.confirm': 'Bekräfta',
  'drawer.cancel': 'Avbryt',

  // ===== Paginering =====
  'pagination.page': 'Sida',
  'pagination.total': 'Totalt {count} poster',
  'pagination.size': '/ sida',
  'pagination.jumpTo': 'Gå till',
  'pagination.prev': 'Föregående',
  'pagination.next': 'Nästa',
  'pagination.first': 'Första',
  'pagination.last': 'Sista',

  // ===== Datumväljare =====
  'datepicker.placeholder': 'Välj datum',
  'datepicker.startPlaceholder': 'Startdatum',
  'datepicker.endPlaceholder': 'Slutdatum',
  'datepicker.today': 'Idag',
  'datepicker.yesterday': 'Igår',
  'datepicker.thisWeek': 'Denna vecka',
  'datepicker.thisMonth': 'Denna månad',
  'datepicker.thisYear': 'Detta år',
  'datepicker.clear': 'Rensa',
  'datepicker.confirm': 'Bekräfta',
  'datepicker.openCalendar': 'Öppna kalender',
  'datepicker.previousMonth': 'Föregående månad',
  'datepicker.nextMonth': 'Nästa månad',

  // ===== Tomt tillstånd =====
  'empty.default': 'Inga data',
  'empty.search': 'Inga resultat hittades',
  'empty.networkError': 'Nätverksfel',
  'empty.retry': 'Klicka för att försöka igen',
  'empty.created': 'Börja skapa',
  'empty.error': 'Laddning misslyckades',
  'empty.no-data': 'Inga data',
  'empty.no-permission': 'Ingen behörighet',
  'empty.no-result': 'Inga matchande resultat',

  // ===== Meddelande =====
  'message.success': 'Lyckades',
  'message.error': 'Fel',
  'message.warning': 'Varning',
  'message.info': 'Info',
  'message.closeAriaLabel': 'Stäng meddelande',

  // ===== Avisering =====
  'notification.title': 'Aviseringar',
  'notification.empty': 'Inga aviseringar',
  'notification.markAllRead': 'Markera alla som lästa',
  'notification.viewAll': 'Visa alla',
  'notification.closeAriaLabel': 'Stäng avisering',
  'notification.region': 'Aviseringar',

  // ===== Toast =====
  'toast.region': 'Aviseringar',

  // ===== Uppladdning =====
  'upload.drag': 'Klicka eller dra fil till detta område för att ladda upp',
  'upload.dragging': 'Släpp för att ladda upp',
  'upload.error': 'Uppladdning misslyckades',
  'upload.success': 'Uppladdning lyckades',
  'upload.preview': 'Förhandsgranska',
  'upload.remove': 'Ta bort',
  'upload.retry': 'Försök igen',
  'upload.maxSize': 'Filstorleken överskrider gränsen',
  'upload.maxCount': 'Antalet filer överskrider gränsen',
  'upload.invalidFormat': 'Filformatet stöds inte',
  'upload.clickToUpload': 'Klicka för att ladda upp',
  'upload.dragTipPrefix': 'Dra fil hit eller ',

  // ===== Uppladdning / Fil =====
  'fileUpload.clickToUpload': 'Klicka eller dra för att ladda upp',
  'fileUpload.dragAndDrop': 'Dra filer till detta område',
  'fileUpload.fileSize': 'Storlek',
  'upload.fileListAriaLabel': 'Lista över uppladdade filer',

  // ===== Autokomplettera =====
  'autoComplete.placeholder': 'Ange ett sökord',
  'autoComplete.emptyText': 'Inga matchande objekt',
  'autoComplete.loadingText': 'Laddar...',
  'autoComplete.clearAriaLabel': 'Rensa inmatning',

  // ===== Ordningslista =====
  'orderList.moveToTop': 'Flytta till toppen',
  'orderList.moveUp': 'Flytta upp',
  'orderList.moveDown': 'Flytta ner',
  'orderList.moveToBottom': 'Flytta till botten',
  'orderList.filterPlaceholder': 'Sök',
  'orderList.ariaLabel': 'Dragbar sorteringslista',
  'orderList.listAriaLabel': 'Sorteringslista',

  // ===== Väljelista =====
  'pickList.sourceLabel': 'Källista',
  'pickList.targetLabel': 'Mållista',
  'pickList.moveToTarget': 'Flytta till mål',
  'pickList.moveToSource': 'Flytta tillbaka till källa',
  'pickList.moveAllToTarget': 'Flytta allt till mål',
  'pickList.moveAllToSource': 'Flytta allt tillbaka till källa',
  'pickList.filterPlaceholder': 'Sök',

  // ===== QR-kod =====
  'qrCode.download': 'Ladda ner QR-kod',
  'qrCode.generateFailed': 'Det gick inte att skapa QR-kod',
  'qrCode.ariaLabel': 'QR-kod {value}',
  'qrCode.hint.url': 'Skanna för att öppna länken',
  'qrCode.hint.text': 'Skanna QR-koden',
  'qrCode.hint.vcard': 'Skanna för att lägga till kontakt',
  'qrCode.hint.download': 'Skanna för att ladda ner filen',
  'qrCode.hint.wifi': 'Skanna för att ansluta till WiFi',

  // ===== Cascader / PinInput / Mention =====
  'cascader.ariaLabel': 'Kaskadsväljare',
  'cascader.searchPlaceholder': 'Sök...',
  'common.clearAriaLabel': 'Rensa inmatning',
  'mention.ariaLabel': 'Nämnarinmatning',
  'mention.optionsAriaLabel': 'Nämnarförslag',
  'mention.placeholder': 'Skriv @ för att nämna',
  'pinInput.ariaLabel': 'Verifieringskod',
  'pinInput.groupAriaLabel': 'Siffror i verifieringskoden',
  'pinInput.itemAriaLabel': 'Siffra {index} i verifieringskoden',
  'pinInput.sendAriaLabel': 'Skicka verifieringskod',
  'pinInput.sendingAriaLabel': 'Skickar verifieringskod',
  'popconfirm.defaultTitle': 'Bekräfta denna åtgärd?',

  // ===== Färgväljare =====
  'colorPicker.ariaLabel': 'Färgväljare',
  'colorPicker.clear': 'Rensa färg',
  'colorPicker.custom': 'Anpassad',
  'colorPicker.presets': 'Förinställningar',
  'colorPicker.saturationAriaLabel': 'Mättnadsväljare',
  'colorPicker.unselected': 'Ej vald',

  // ===== Bild =====
  'image.closeAriaLabel': 'Stäng förhandsvisning',
  'image.itemAriaLabel': 'Bild {index}',
  'image.nextAriaLabel': 'Nästa bild',
  'image.prevAriaLabel': 'Föregående bild',
  'image.previewAlt': 'Förhandsvisning bild {index}',
  'image.previewAriaLabel': 'Bildförhandsvisning',
  'image.switchAriaLabel': 'Bildväxlare',
  'image.zoomInAriaLabel': 'Zooma in',
  'image.zoomOutAriaLabel': 'Zooma ut',
  'image.rotateLeftAriaLabel': 'Rotera vänster',
  'image.rotateRightAriaLabel': 'Rotera höger',
  'image.resetTransformAriaLabel': 'Återställ zoom och rotation',

  // ===== Inmatningsetiketter =====
  'inputTags.ariaLabel': 'Etikettinmatning ({count} etiketter)',
  'inputTags.placeholder': 'Ange en etikett',
  'inputTags.removeAriaLabel': 'Ta bort etikett {tag}',
  'inputTags.tagAriaLabel': 'Etikett: {tag}',

  // ===== Tidsväljare / Områdesväljare =====
  'calendar.monthOption': '{month}',
  'calendar.selectMonthAriaLabel': 'Välj månad',
  'calendar.selectYearAriaLabel': 'Välj år',
  'calendar.yearOption': '{year}',
  'datepicker.yearMonth': '{month}/{year}',
  'pagination.sizeOption': '{size} / sida',
  'rangePicker.ariaLabel': 'Datumområdesväljare',
  'rangePicker.endTimePlaceholder': 'Sluttid',
  'rangePicker.startTimePlaceholder': 'Starttid',
  'rangePicker.to': 'till',
  'timepicker.ariaLabel': 'Tidsväljare',
  'timepicker.clearAriaLabel': 'Rensa tid',
  'timepicker.hourAriaLabel': 'Timmar',
  'timepicker.meridiemAriaLabel': 'AM/PM',
  'timepicker.minuteAriaLabel': 'Minuter',
  'timepicker.placeholder': 'Välj tid',
  'timepicker.secondAriaLabel': 'Sekunder',
} as const satisfies Record<string, string>;

export default svSE;
