/**
 * ydsz-ui Bileşen dahili Türkçe metin（tr-TR）。
 *
 * Anahtarlar tam olarak zh-CN.ts ile eşleşir;
 * {placeholder} yer tutucuları desteklenir.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\tr-TR.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Türkçe mesaj tablosu —— 土耳其语 */
export const trTR = {
  // ===== Genel =====
  'common.confirm': 'Onayla',
  'common.cancel': 'İptal',
  'common.loading': 'Yükleniyor...',
  'common.search': 'Ara',
  'common.reset': 'Sıfırla',
  'common.submit': 'Gönder',
  'common.close': 'Kapat',
  'common.more': 'Daha fazla',
  'common.expand': 'Genişlet',
  'common.collapse': 'Daralt',
  'common.copy': 'Kopyala',
  'common.copied': 'Kopyalandı',
  'common.delete': 'Sil',
  'common.edit': 'Düzenle',
  'common.add': 'Ekle',
  'common.save': 'Kaydet',
  'common.refresh': 'Yenile',
  'common.required': 'Zorunlu',
  'common.preview': 'Önizleme',
  'common.clear': 'Temizle',
  'common.retry': 'Tekrar dene',
  'common.searchPlaceholder': 'Ara...',

  // ===== Tablo =====
  'table.empty': 'Veri yok',
  'table.loading': 'Yükleniyor...',
  'table.total': '{count} kayıt',
  'table.page': 'Sayfa {page}',
  'table.filter.confirm': 'Filtrele',
  'table.filter.reset': 'Sıfırla',
  'table.sort.asc': 'Artan',
  'table.sort.desc': 'Azalan',
  'table.selectAll': 'Tümünü seç',
  'table.selectRow': 'Satırı seç',
  'table.cancelSelect': 'Seçimi iptal et',
  'table.expandedRow': 'Satırı genişlet',
  'table.collapseRow': 'Satırı daralt',
  'table.columnSetting': 'Sütun ayarları',
  'table.editCell': 'Hücreyi düzenle',
  'table.sortHint': 'Sıralamak için tıklayın, çoklu sıralama için Shift+tık',
  'table.resizeColumn': 'Sütunu yeniden boyutlandırmak için sürükleyin',
  'table.dragColumn': 'Sütunu yeniden sıralamak için sürükleyin',

  // ===== Seçim =====
  'select.placeholder': 'Seçiniz',
  'select.search': 'Seçenekleri ara',
  'select.empty': 'Eşleşen seçenek yok',
  'select.loading': 'Yükleniyor...',
  'select.selectAll': 'Tümünü seç',
  'select.clear': 'Temizle',
  'select.removeTag': 'Kaldır',
  'create.label': '"{value}" oluştur',

  // ===== Form =====
  'form.validating': 'Doğrulanıyor...',
  'form.submitting': 'Gönderiliyor...',
  'form.required': 'Bu alan zorunludur',
  'form.invalid': 'Geçersiz biçim',
  'form.passwordMismatch': 'Şifreler eşleşmiyor',
  'form.validateSuccess': 'Doğrulama başarılı',
  'form.validateFailed': 'Doğrulama başarısız, girişleri kontrol edin',

  // ===== İletişim Kutusu =====
  'dialog.close': 'Kapat',
  'dialog.confirm': 'Onayla',
  'dialog.cancel': 'İptal',
  'dialog.deleteConfirm': 'Silme işlemini onaylıyor musunuz?',
  'dialog.deleteWarning': 'Bu işlem geri alınamaz',

  // ===== Çekmece =====
  'drawer.ariaLabel': 'Çekmece',
  'drawer.close': 'Kapat',
  'drawer.closeAriaLabel': 'Çekmeciyi kapat',
  'drawer.confirm': 'Onayla',
  'drawer.cancel': 'İptal',

  // ===== Sayfalama =====
  'pagination.page': 'Sayfa',
  'pagination.total': 'Toplam {count} kayıt',
  'pagination.size': '/ sayfa',
  'pagination.jumpTo': 'Git',
  'pagination.prev': 'Önceki',
  'pagination.next': 'Sonraki',
  'pagination.first': 'İlk',
  'pagination.last': 'Son',

  // ===== Tarih Seçici =====
  'datepicker.placeholder': 'Tarih seçin',
  'datepicker.startPlaceholder': 'Başlangıç tarihi',
  'datepicker.endPlaceholder': 'Bitiş tarihi',
  'datepicker.today': 'Bugün',
  'datepicker.yesterday': 'Dün',
  'datepicker.thisWeek': 'Bu hafta',
  'datepicker.thisMonth': 'Bu ay',
  'datepicker.thisYear': 'Bu yıl',
  'datepicker.clear': 'Temizle',
  'datepicker.confirm': 'Onayla',
  'datepicker.openCalendar': 'Takvimi aç',
  'datepicker.previousMonth': 'Önceki ay',
  'datepicker.nextMonth': 'Sonraki ay',

  // ===== Boş Durum =====
  'empty.default': 'Veri yok',
  'empty.search': 'Sonuç bulunamadı',
  'empty.networkError': 'Ağ hatası',
  'empty.retry': 'Tekrar denemek için tıklayın',
  'empty.created': 'Oluşturmaya başla',
  'empty.error': 'Yükleme başarısız',
  'empty.no-data': 'Veri yok',
  'empty.no-permission': 'İzin yok',
  'empty.no-result': 'Eşleşen sonuç yok',

  // ===== Mesaj =====
  'message.success': 'Başarılı',
  'message.error': 'Hata',
  'message.warning': 'Uyarı',
  'message.info': 'Bilgi',
  'message.closeAriaLabel': 'Mesajı kapat',

  // Bildirim =====
  'notification.title': 'Bildirimler',
  'notification.empty': 'Bildirim yok',
  'notification.markAllRead': 'Tümünü okundu olarak işaretle',
  'notification.viewAll': 'Tümünü görüntüle',
  'notification.closeAriaLabel': 'Bildirimi kapat',
  'notification.region': 'Bildirimler',

  // ===== Toast =====
  'toast.region': 'Bildirimler',

  // ===== Yükleme =====
  'upload.drag': 'Yüklemek için tıklayın veya dosyayı bu alana sürükleyin',
  'upload.dragging': 'Yüklemek için bırakın',
  'upload.error': 'Yükleme başarısız',
  'upload.success': 'Yükleme başarılı',
  'upload.preview': 'Önizleme',
  'upload.remove': 'Kaldır',
  'upload.retry': 'Tekrar dene',
  'upload.maxSize': 'Dosya boyutu sınırı aşıyor',
  'upload.maxCount': 'Dosya sayısı sınırı aşıyor',
  'upload.invalidFormat': 'Desteklenmeyen dosya biçimi',
  'upload.clickToUpload': 'Yüklemek için tıklayın',
  'upload.dragTipPrefix': 'Dosyayı buraya sürükleyin veya ',

  // ===== Yükleme / Dosya Yükleme =====
  'fileUpload.clickToUpload': 'Yüklemek için tıklayın veya sürükleyin',
  'fileUpload.dragAndDrop': 'Dosyaları bu alana sürükleyin',
  'fileUpload.fileSize': 'Boyut',
  'upload.fileListAriaLabel': 'Yüklenen dosya listesi',

  // ===== Otomatik Tamamlama =====
  'autoComplete.placeholder': 'Anahtar kelime yazın',
  'autoComplete.emptyText': 'Eşleşen öğe yok',
  'autoComplete.loadingText': 'Yükleniyor...',
  'autoComplete.clearAriaLabel': 'Girişi temizle',

  // ===== Sıralama Listesi =====
  'orderList.moveToTop': 'En üste taşı',
  'orderList.moveUp': 'Yukarı taşı',
  'orderList.moveDown': 'Aşağı taşı',
  'orderList.moveToBottom': 'En alta taşı',
  'orderList.filterPlaceholder': 'Ara',
  'orderList.ariaLabel': 'Sürüklenebilir sıralama listesi',
  'orderList.listAriaLabel': 'Sıralama listesi',

  // ===== Seçim Listesi =====
  'pickList.sourceLabel': 'Kaynak liste',
  'pickList.targetLabel': 'Hedef liste',
  'pickList.moveToTarget': 'Hedefe taşı',
  'pickList.moveToSource': 'Kaynağa geri taşı',
  'pickList.moveAllToTarget': 'Tümünü hedefe taşı',
  'pickList.moveAllToSource': 'Tümünü kaynağa geri taşı',
  'pickList.filterPlaceholder': 'Ara',

  // ===== QR Kod =====
  'qrCode.download': 'QR kodu indir',
  'qrCode.generateFailed': 'QR kodu oluşturulamadı',
  'qrCode.ariaLabel': 'QR kodu {value}',
  'qrCode.hint.url': 'Bağlantıyı açmak için tarayın',
  'qrCode.hint.text': 'QR kodunu tarayın',
  'qrCode.hint.vcard': 'Kişi eklemek için tarayın',
  'qrCode.hint.download': 'Dosyayı indirmek için tarayın',
  'qrCode.hint.wifi': 'WiFi\'ye bağlanmak için tarayın',

  // ===== Cascader / PinInput / Mention =====
  'cascader.ariaLabel': 'Drtlı seçici',
  'cascader.searchPlaceholder': 'Ara...',
  'common.clearAriaLabel': 'Girişi temizle',
  'mention.ariaLabel': 'Bahsetme girişi',
  'mention.optionsAriaLabel': 'Bahsetme önerileri',
  'mention.placeholder': 'Bahsetmek için @ yazın',
  'pinInput.ariaLabel': 'Doğrulama kodu',
  'pinInput.groupAriaLabel': 'Doğrulama kodu rakamları',
  'pinInput.itemAriaLabel': 'Doğrulama kodunun {index}. basamağı',
  'pinInput.sendAriaLabel': 'Doğrulama kodu gönder',
  'pinInput.sendingAriaLabel': 'Doğrulama kodu gönderiliyor',
  'popconfirm.defaultTitle': 'Bu işlemi onaylıyor musunuz?',

  // ===== Renk Seçici =====
  'colorPicker.ariaLabel': 'Renk seçici',
  'colorPicker.clear': 'Rengi temizle',
  'colorPicker.custom': 'Özel',
  'colorPicker.presets': 'Ön ayarlar',
  'colorPicker.saturationAriaLabel': 'Doygunluk seçici',
  'colorPicker.unselected': 'Seçilmedi',

  // ===== Resim =====
  'image.closeAriaLabel': 'Önizlemeyi kapat',
  'image.itemAriaLabel': 'Resim {index}',
  'image.nextAriaLabel': 'Sonraki resim',
  'image.prevAriaLabel': 'Önceki resim',
  'image.previewAlt': 'Resim önizleme {index}',
  'image.previewAriaLabel': 'Resim önizleme',
  'image.switchAriaLabel': 'Resim değiştirici',
  'image.zoomInAriaLabel': 'Yakınlaştır',
  'image.zoomOutAriaLabel': 'Uzaklaştır',
  'image.rotateLeftAriaLabel': 'Sola döndür',
  'image.rotateRightAriaLabel': 'Sağa döndür',
  'image.resetTransformAriaLabel': 'Yakınlaştırma ve döndürmeyi sıfırla',

  // ===== Giriş Etiketleri =====
  'inputTags.ariaLabel': 'Etiket girişi ({count} etiket)',
  'inputTags.placeholder': 'Etiket girin',
  'inputTags.removeAriaLabel': '{tag} etiketini kaldır',
  'inputTags.tagAriaLabel': 'Etiket: {tag}',

  // ===== Zaman Seçici / Aralık Seçici =====
  'calendar.monthOption': '{month}',
  'calendar.selectMonthAriaLabel': 'Ay seçin',
  'calendar.selectYearAriaLabel': 'Yıl seçin',
  'calendar.yearOption': '{year}',
  'datepicker.yearMonth': '{month}/{year}',
  'pagination.sizeOption': '{size} / sayfa',
  'rangePicker.ariaLabel': 'Tarih aralığı seçici',
  'rangePicker.endTimePlaceholder': 'Bitiş saati',
  'rangePicker.startTimePlaceholder': 'Başlangıç saati',
  'rangePicker.to': '-',
  'timepicker.ariaLabel': 'Saat seçici',
  'timepicker.clearAriaLabel': 'Zamanı temizle',
  'timepicker.hourAriaLabel': 'Saat',
  'timepicker.meridiemAriaLabel': 'ÖÖ/ÖS',
  'timepicker.minuteAriaLabel': 'Dakika',
  'timepicker.placeholder': 'Saat seçin',
  'timepicker.secondAriaLabel': 'Saniye',
} as const satisfies Record<string, string>;

export default trTR;
