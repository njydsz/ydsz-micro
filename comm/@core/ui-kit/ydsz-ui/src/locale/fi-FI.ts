/**
 * ydsz-ui Komponentti sisrakennettu teksti suomeksi（fi-FI）。
 *
 * Avaimet vastaavat tarkasti zh-CN.ts;
 * {placeholder}-paikkamerkit tuetaan.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\fi-FI.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Suomenkielinen viestitaulukko —— 芬兰语 */
export const fiFI = {
  // ===== Yleinen =====
  'common.confirm': 'Vahvista',
  'common.cancel': 'Peruuta',
  'common.loading': 'Ladataan...',
  'common.search': 'Etsi',
  'common.reset': 'Palauta',
  'common.submit': 'Lähetä',
  'common.close': 'Sulje',
  'common.more': 'Lisää',
  'common.expand': 'Laajenna',
  'common.collapse': 'Tiivistä',
  'common.copy': 'Kopioi',
  'common.copied': 'Kopioitu',
  'common.delete': 'Poista',
  'common.edit': 'Muokkaa',
  'common.add': 'Lisää',
  'common.save': 'Tallenna',
  'common.refresh': 'Päivitä',
  'common.required': 'Pakollinen',
  'common.preview': 'Esikatselu',
  'common.clear': 'Tyhjennä',
  'common.retry': 'Yritä uudelleen',
  'common.searchPlaceholder': 'Etsi...',

  // ===== Taulukko =====
  'table.empty': 'Ei tietoja',
  'table.loading': 'Ladataan...',
  'table.total': '{count} tietuetta',
  'table.page': 'Sivu {page}',
  'table.filter.confirm': 'Suodata',
  'table.filter.reset': 'Palauta',
  'table.sort.asc': 'Nouseva',
  'table.sort.desc': 'Laskeva',
  'table.selectAll': 'Valitse kaikki',
  'table.selectRow': 'Valitse rivi',
  'table.cancelSelect': 'Peruuta valinta',
  'table.expandedRow': 'Laajenna rivi',
  'table.collapseRow': 'Tiivistä rivi',
  'table.columnSetting': 'Sarakeasetukset',
  'table.editCell': 'Muokkaa solua',
  'table.sortHint': 'Napsauta lajitaksesi, Shift+napsauta monilajittelua varten',
  'table.resizeColumn': 'Vedä muuttaaksesi sarakkeen leveyttä',
  'table.dragColumn': 'Vedä muuttaaksesi sarakkeiden järjestystä',

  // ===== Valinta =====
  'select.placeholder': 'Valitse',
  'select.search': 'Etsi vaihtoehtoja',
  'select.empty': 'Ei vastaavia vaihtoehtoja',
  'select.loading': 'Ladataan...',
  'select.selectAll': 'Valitse kaikki',
  'select.clear': 'Tyhjennä',
  'select.removeTag': 'Poista',
  'create.label': 'Luo "{value}"',

  // ===== Lomake =====
  'form.validating': 'Vahvistetaan...',
  'form.submitting': 'Lähetetään...',
  'form.required': 'Tämä kenttä on pakollinen',
  'form.invalid': 'Virheellinen muoto',
  'form.passwordMismatch': 'Salasanat eivät täsmää',
  'form.validateSuccess': 'Vahvistus onnistui',
  'form.validateFailed': 'Vahvistus epäonnistui, tarkista syötteet',

  // ===== Valintaikkuna =====
  'dialog.close': 'Sulje',
  'dialog.confirm': 'Vahvista',
  'dialog.cancel': 'Peruuta',
  'dialog.deleteConfirm': 'Vahvista poisto?',
  'dialog.deleteWarning': 'Tätä toimintoa ei voi peruuttaa',

  // ===== Laatikko =====
  'drawer.ariaLabel': 'Laatikko',
  'drawer.close': 'Sulje',
  'drawer.closeAriaLabel': 'Sulje laatikko',
  'drawer.confirm': 'Vahvista',
  'drawer.cancel': 'Peruuta',

  // ===== Sivutus =====
  'pagination.page': 'Sivu',
  'pagination.total': 'Yhteensä {count} tietuetta',
  'pagination.size': '/ sivu',
  'pagination.jumpTo': 'Siirry',
  'pagination.prev': 'Edellinen',
  'pagination.next': 'Seuraava',
  'pagination.first': 'Ensimmäinen',
  'pagination.last': 'Viimeinen',

  // ===== Päivämäärävalitsin =====
  'datepicker.placeholder': 'Valitse päivämäärä',
  'datepicker.startPlaceholder': 'Alkamispäivä',
  'datepicker.endPlaceholder': 'Päättymispäivä',
  'datepicker.today': 'Tänään',
  'datepicker.yesterday': 'Eilen',
  'datepicker.thisWeek': 'Tällä viikolla',
  'datepicker.thisMonth': 'Tässä kuussa',
  'datepicker.thisYear': 'Tänä vuonna',
  'datepicker.clear': 'Tyhjennä',
  'datepicker.confirm': 'Vahvista',
  'datepicker.openCalendar': 'Avaa kalenteri',
  'datepicker.previousMonth': 'Edellinen kuukausi',
  'datepicker.nextMonth': 'Seuraava kuukausi',

  // ===== Tyhjä tila =====
  'empty.default': 'Ei tietoja',
  'empty.search': 'Tuloksia ei löytynyt',
  'empty.networkError': 'Verkkovirhe',
  'empty.retry': 'Napsauta yrittääksesi uudelleen',
  'empty.created': 'Aloita luominen',
  'empty.error': 'Lataus epäonnistui',
  'empty.no-data': 'Ei tietoja',
  'empty.no-permission': 'Ei oikeutta',
  'empty.no-result': 'Ei vastaavia tuloksia',

  // ===== Viesti =====
  'message.success': 'Onnistui',
  'message.error': 'Virhe',
  'message.warning': 'Varoitus',
  'message.info': 'Tiedot',
  'message.closeAriaLabel': 'Sulje viesti',

  // ===== Ilmoitus =====
  'notification.title': 'Ilmoitukset',
  'notification.empty': 'Ei ilmoituksia',
  'notification.markAllRead': 'Merkitse kaikki luetuiksi',
  'notification.viewAll': 'Näytä kaikki',
  'notification.closeAriaLabel': 'Sulje ilmoitus',
  'notification.region': 'Ilmoitukset',

  // ===== Toast =====
  'toast.region': 'Ilmoitukset',

  // ===== Lataus =====
  'upload.drag': 'Napsauta tai vedä tähän alueeseen ladataksesi',
  'upload.dragging': 'Vapauta ladataksesi',
  'upload.error': 'Lataus epäonnistui',
  'upload.success': 'Lataus onnistui',
  'upload.preview': 'Esikatselu',
  'upload.remove': 'Poista',
  'upload.retry': 'Yritä uudelleen',
  'upload.maxSize': 'Tiedoston koko ylittää rajan',
  'upload.maxCount': 'Tiedostojen määrä ylittää rajan',
  'upload.invalidFormat': 'Tiedostomuotoa ei tueta',
  'upload.clickToUpload': 'Napsauta ladataksesi',
  'upload.dragTipPrefix': 'Vedä tiedosto tähän tai ',

  // ===== Lataus =====
  'fileUpload.clickToUpload': 'Napsauta tai vetää ladataksi',
  'fileUpload.dragAndDrop': 'Vedä tiedostot tähän alueeseen',
  'fileUpload.fileSize': 'Koko',
  'upload.fileListAriaLabel': 'Luettelo ladatuista tiedostoista',

  // ===== Automaattinen täydennys =====
  'autoComplete.placeholder': 'Kirjoita avainsana',
  'autoComplete.emptyText': 'Ei vastaavia kohteita',
  'autoComplete.loadingText': 'Ladataan...',
  'autoComplete.clearAriaLabel': 'Tyhjennä syöte',

  // ===== Järjestysluettelo =====
  'orderList.moveToTop': 'Siirry alkuun',
  'orderList.moveUp': 'Siirry ylös',
  'orderList.moveDown': 'Siirry alas',
  'orderList.moveToBottom': 'Siirry loppuun',
  'orderList.filterPlaceholder': 'Etsi',
  'orderList.ariaLabel': 'Vetolajiteltava luettelo',
  'orderList.listAriaLabel': 'Lajitteluluettelo',

  // ===== Poistoluettelo =====
  'pickList.sourceLabel': 'Lähdeluettelo',
  'pickList.targetLabel': 'Kohdeluettelo',
  'pickList.moveToTarget': 'Siirry kohteeseen',
  'pickList.moveToSource': 'Paluu lähteeseen',
  'pickList.moveAllToTarget': 'Siirrä kaikki kohteeseen',
  'pickList.moveAllToSource': 'Palauta kaikki lähteeseen',
  'pickList.filterPlaceholder': 'Etsi',

  // ===== QR-koodi =====
  'qrCode.download': 'Lataa QR-koodi',
  'qrCode.generateFailed': 'QR-koodin luominen epäonnistui',
  'qrCode.ariaLabel': 'QR-koodi {value}',
  'qrCode.hint.url': 'Skannaa avataksesi linkin',
  'qrCode.hint.text': 'Skannaa QR-koodi',
  'qrCode.hint.vcard': 'Skannaa lisätäksesi yhteystiedon',
  'qrCode.hint.download': 'Skannaa ladataksesi tiedoston',
  'qrCode.hint.wifi': 'Skannaa yhdistääksesi WiFi-verkkoon',

  // ===== Cascader / PinInput / Mention =====
  'cascader.ariaLabel': 'Kaskadivalitsin',
  'cascader.searchPlaceholder': 'Etsi...',
  'common.clearAriaLabel': 'Tyhjennä syöte',
  'mention.ariaLabel': 'Mainintasyöte',
  'mention.optionsAriaLabel': 'Mainintaosdotukset',
  'mention.placeholder': 'Kirjoita @ mainitaksesi',
  'pinInput.ariaLabel': 'Vahvistuskoodi',
  'pinInput.groupAriaLabel': 'Vahvistuskoodin numerot',
  'pinInput.itemAriaLabel': 'Vahvistuskoodin {index}. numero',
  'pinInput.sendAriaLabel': 'Lähetä vahvistuskoodi',
  'pinInput.sendingAriaLabel': 'Lähettää vahvistuskoodia',
  'popconfirm.defaultTitle': 'Vahvista tämä toiminto?',

  // ===== Värivalitsin =====
  'colorPicker.ariaLabel': 'Värivalitsin',
  'colorPicker.clear': 'Tyhjennä väri',
  'colorPicker.custom': 'Mukautettu',
  'colorPicker.presets': 'Esiasetukset',
  'colorPicker.saturationAriaLabel': 'Kylläisyyden valitsin',
  'colorPicker.unselected': 'Ei valittu',

  // ===== Kuva =====
  'image.closeAriaLabel': 'Sulje esikatselu',
  'image.itemAriaLabel': 'Kuva {index}',
  'image.nextAriaLabel': 'Seuraava kuva',
  'image.prevAriaLabel': 'Edellinen kuva',
  'image.previewAlt': 'Kuvan esikatselu {index}',
  'image.previewAriaLabel': 'Kuvan esikatselu',
  'image.switchAriaLabel': 'Kuvan vaihtaja',
  'image.zoomInAriaLabel': 'Lähennä',
  'image.zoomOutAriaLabel': 'Loitonna',
  'image.rotateLeftAriaLabel': 'Kierrä vasemmalle',
  'image.rotateRightAriaLabel': 'Kierrä oikealle',
  'image.resetTransformAriaLabel': 'Palauta zoomaus ja kierto',

  // ===== Tunnistesyoite =====
  'inputTags.ariaLabel': 'Tunnistesyöte ({count} tunnistetta)',
  'inputTags.placeholder': 'Kirjoita tunniste',
  'inputTags.removeAriaLabel': 'Poista tunniste {tag}',
  'inputTags.tagAriaLabel': 'Tunniste: {tag}',

  // ===== Aikavalitsin =====
  'calendar.monthOption': '{month}',
  'calendar.selectMonthAriaLabel': 'Valitse kuukausi',
  'calendar.selectYearAriaLabel': 'Valitse vuosi',
  'calendar.yearOption': '{year}',
  'datepicker.yearMonth': '{month}.{year}',
  'pagination.sizeOption': '{size} / sivu',
  'rangePicker.ariaLabel': 'Päivämääräaluevalitsin',
  'rangePicker.endTimePlaceholder': 'Päättymisaika',
  'rangePicker.startTimePlaceholder': 'Alkamisaika',
  'rangePicker.to': '-',
  'timepicker.ariaLabel': 'Aikavaliappain',
  'timepicker.clearAriaLabel': 'Tyhjennä aika',
  'timepicker.hourAriaLabel': 'Tunnit',
  'timepicker.meridiemAriaLabel': 'AM/PM',
  'timepicker.minuteAriaLabel': 'Minuutit',
  'timepicker.placeholder': 'Valitse aika',
  'timepicker.secondAriaLabel': 'Sekunnit',
} as const satisfies Record<string, string>;

export default fiFI;
