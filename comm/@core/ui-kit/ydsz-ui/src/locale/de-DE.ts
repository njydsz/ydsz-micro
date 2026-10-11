/**
 * ydsz-ui Komponente eingebaut deutsche Texte（de-DE）。
 *
 * Schlüssel entsprechen exakt zh-CN.ts ;
 * {placeholder}-Platzhalter werden unterstützt.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\de-DE.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Deutsche Nachrichtentabelle —— 德语 */
export const deDE = {
  // ===== Allgemein =====
  'common.confirm': 'Bestätigen',
  'common.cancel': 'Abbrechen',
  'common.loading': 'Wird geladen...',
  'common.search': 'Suchen',
  'common.reset': 'Zurücksetzen',
  'common.submit': 'Absenden',
  'common.close': 'Schließen',
  'common.more': 'Mehr',
  'common.expand': 'Erweitern',
  'common.collapse': 'Reduzieren',
  'common.copy': 'Kopieren',
  'common.copied': 'Kopiert',
  'common.delete': 'Löschen',
  'common.edit': 'Bearbeiten',
  'common.add': 'Hinzufügen',
  'common.save': 'Speichern',
  'common.refresh': 'Aktualisieren',

  // ===== Tabelle =====
  'table.empty': 'Keine Daten',
  'table.loading': 'Wird geladen...',
  'table.total': '{count} Datensätze',
  'table.page': 'Seite {page}',
  'table.filter.confirm': 'Filtern',
  'table.filter.reset': 'Zurücksetzen',
  'table.sort.asc': 'Aufsteigend',
  'table.sort.desc': 'Absteigend',
  'table.selectAll': 'Alle auswählen',
  'table.selectRow': 'Diese Zeile auswählen',
  'table.cancelSelect': 'Auswahl aufheben',
  'table.expandedRow': 'Zeile erweitern',
  'table.collapseRow': 'Zeile reduzieren',
  'table.columnSetting': 'Spalteneinstellungen',

  // ===== Formular =====
  'form.validating': 'Validierung läuft...',
  'form.submitting': 'Wird gesendet...',
  'form.required': 'Dieses Feld ist erforderlich',
  'form.invalid': 'Ungültiges Format',
  'form.passwordMismatch': 'Passwörter stimmen nicht überein',
  'form.validateSuccess': 'Validierung bestanden',
  'form.validateFailed': 'Validierung fehlgeschlagen, bitte Eingaben prüfen',

  // ===== Dialog =====
  'dialog.close': 'Schließen',
  'dialog.confirm': 'Bestätigen',
  'dialog.cancel': 'Abbrechen',
  'dialog.deleteConfirm': 'Löschen bestätigen?',
  'dialog.deleteWarning': 'Dieser Vorgang kann nicht rückgängig gemacht werden',

  // ===== Hochladen =====
  'upload.drag': 'Klicken oder Datei hierher ziehen zum Hochladen',
  'upload.dragging': 'Zum Hochladen loslassen',
  'upload.error': 'Upload fehlgeschlagen',
  'upload.success': 'Upload erfolgreich',
  'upload.preview': 'Vorschau',
  'upload.remove': 'Entfernen',
  'upload.retry': 'Wiederholen',
  'upload.maxSize': 'Dateigröße überschreitet das Limit',
  'upload.maxCount': 'Dateianzahl überschreitet das Limit',
  'upload.invalidFormat': 'Nicht unterstütztes Dateiformat',

  // ===== Paginierung =====
  'pagination.page': '',
  'pagination.total': 'Insgesamt {count} Datensätze',
  'pagination.size': '/ Seite',
  'pagination.jumpTo': 'Gehe zu',
  'pagination.prev': 'Zurück',
  'pagination.next': 'Weiter',
  'pagination.first': 'Erste',
  'pagination.last': 'Letzte',

  // ===== Datumsauswahl =====
  'datepicker.placeholder': 'Datum auswählen',
  'datepicker.startPlaceholder': 'Startdatum',
  'datepicker.endPlaceholder': 'Enddatum',
  'datepicker.today': 'Heute',
  'datepicker.yesterday': 'Gestern',
  'datepicker.thisWeek': 'Diese Woche',
  'datepicker.thisMonth': 'Dieser Monat',
  'datepicker.thisYear': 'Dieses Jahr',
  'datepicker.clear': 'Löschen',
  'datepicker.confirm': 'Bestätigen',
  'datepicker.mon': 'Mo',
  'datepicker.tue': 'Di',
  'datepicker.wed': 'Mi',
  'datepicker.thu': 'Do',
  'datepicker.fri': 'Fr',
  'datepicker.sat': 'Sa',
  'datepicker.sun': 'So',
  'datepicker.jan': 'Jan',
  'datepicker.feb': 'Feb',
  'datepicker.mar': 'Mär',
  'datepicker.apr': 'Apr',
  'datepicker.may': 'Mai',
  'datepicker.jun': 'Jun',
  'datepicker.jul': 'Jul',
  'datepicker.aug': 'Aug',
  'datepicker.sep': 'Sep',
  'datepicker.oct': 'Okt',
  'datepicker.nov': 'Nov',
  'datepicker.dec': 'Dez',

  // ===== Auswahl =====
  'select.placeholder': 'Bitte auswählen',
  'select.search': 'Optionen suchen',
  'select.empty': 'Keine übereinstimmenden Optionen',
  'select.loading': 'Wird geladen...',
  'select.selectAll': 'Alle auswählen',
  'select.clear': 'Leeren',
  'create.label': '"{value}" erstellen',

  // ===== Baum =====
  'tree.empty': 'Keine Daten',
  'tree.loading': 'Wird geladen...',
  'tree.expandAll': 'Alle erweitern',
  'tree.collapseAll': 'Alle reduzieren',
  'tree.checkedAll': 'Alle markieren',
  'tree.uncheckedAll': 'Alle demarkieren',

  // ===== Benachrichtigung =====
  'message.success': 'Erfolg',
  'message.error': 'Fehler',
  'message.warning': 'Warnung',
  'message.info': 'Info',
  'notification.title': 'Benachrichtigungen',
  'notification.empty': 'Keine Benachrichtigungen',
  'notification.markAllRead': 'Alle als gelesen markieren',
  'notification.viewAll': 'Alle anzeigen',

  // ===== Leerer Zustand =====
  'empty.default': 'Keine Daten',
  'empty.search': 'Keine Ergebnisse gefunden',
  'empty.networkError': 'Netzwerkfehler',
  'empty.retry': 'Klicken zum Wiederholen',
  'empty.created': 'Erstellung starten',
  'empty.error': 'Laden fehlgeschlagen',
  'empty.no-data': 'Keine Daten',
  'empty.no-permission': 'Keine Berechtigung',
  'empty.no-result': 'Keine übereinstimmenden Ergebnisse',

  // ===== Thema =====
  'theme.light': 'Hell',
  'theme.dark': 'Dunkel',
  'theme.system': 'System',

  // ===== Sprache =====
  'locale.switchLanguage': 'Sprache wechseln',
  'locale.currentLanguage': 'Aktuelle Sprache',
} as const satisfies Record<string, string>;

export default deDE;
