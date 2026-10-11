/**
 * ydsz-ui Composant intégré en français（fr-FR）。
 *
 * Les clés correspondent strictement à zh-CN.ts ;
 * les espaces réservés {placeholder} sont pris en charge.
 * Norme W3C French l10n.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\fr-FR.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Table de messages en français —— 法语 */
export const frFR = {
  // ===== Commun =====
  'common.confirm': 'Confirmer',
  'common.cancel': 'Annuler',
  'common.loading': 'Chargement...',
  'common.search': 'Rechercher',
  'common.reset': 'Réinitialiser',
  'common.submit': 'Soumettre',
  'common.close': 'Fermer',
  'common.more': 'Plus',
  'common.expand': 'Développer',
  'common.collapse': 'Réduire',
  'common.copy': 'Copier',
  'common.copied': 'Copié',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.add': 'Ajouter',
  'common.save': 'Enregistrer',
  'common.refresh': 'Actualiser',

  // ===== Tableau =====
  'table.empty': 'Aucune donnée',
  'table.loading': 'Chargement...',
  'table.total': '{count} enregistrements',
  'table.page': 'Page {page}',
  'table.filter.confirm': 'Filtrer',
  'table.filter.reset': 'Réinitialiser',
  'table.sort.asc': 'Croissant',
  'table.sort.desc': 'Décroissant',
  'table.selectAll': 'Tout sélectionner',
  'table.selectRow': 'Sélectionner cette ligne',
  'table.cancelSelect': 'Annuler la sélection',
  'table.expandedRow': 'Développer la ligne',
  'table.collapseRow': 'Réduire la ligne',
  'table.columnSetting': 'Paramètres des colonnes',

  // ===== Formulaire =====
  'form.validating': 'Validation en cours...',
  'form.submitting': 'Soumission en cours...',
  'form.required': 'Ce champ est obligatoire',
  'form.invalid': 'Format incorrect',
  'form.passwordMismatch': 'Les mots de passe ne correspondent pas',
  'form.validateSuccess': 'Validation réussie',
  'form.validateFailed': 'Échec de la validation, veuillez vérifier les saisies',

  // ===== Boîte de dialogue =====
  'dialog.close': 'Fermer',
  'dialog.confirm': 'Confirmer',
  'dialog.cancel': 'Annuler',
  'dialog.deleteConfirm': 'Confirmer la suppression ?',
  'dialog.deleteWarning': 'Cette action est irréversible',

  // ===== Téléversement =====
  'upload.drag': 'Cliquez ou glissez un fichier pour le téléverser',
  'upload.dragging': 'Relâchez pour téléverser',
  'upload.error': 'Échec du téléversement',
  'upload.success': 'Téléversement réussi',
  'upload.preview': 'Aperçu',
  'upload.remove': 'Supprimer',
  'upload.retry': 'Réessayer',
  'upload.maxSize': 'La taille du fichier dépasse la limite',
  'upload.maxCount': 'Le nombre de fichiers dépasse la limite',
  'upload.invalidFormat': 'Format de fichier non pris en charge',

  // ===== Pagination =====
  'pagination.page': '',
  'pagination.total': '{count} enregistrements au total',
  'pagination.size': '/ page',
  'pagination.jumpTo': 'Aller à',
  'pagination.prev': 'Précédent',
  'pagination.next': 'Suivant',
  'pagination.first': 'Premier',
  'pagination.last': 'Dernier',

  // ===== Sélecteur de date =====
  'datepicker.placeholder': 'Sélectionner une date',
  'datepicker.startPlaceholder': 'Date de début',
  'datepicker.endPlaceholder': 'Date de fin',
  'datepicker.today': 'Aujourd\'hui',
  'datepicker.yesterday': 'Hier',
  'datepicker.thisWeek': 'Cette semaine',
  'datepicker.thisMonth': 'Ce mois',
  'datepicker.thisYear': 'Cette année',
  'datepicker.clear': 'Effacer',
  'datepicker.confirm': 'Confirmer',
  'datepicker.mon': 'Lun',
  'datepicker.tue': 'Mar',
  'datepicker.wed': 'Mer',
  'datepicker.thu': 'Jeu',
  'datepicker.fri': 'Ven',
  'datepicker.sat': 'Sam',
  'datepicker.sun': 'Dim',
  'datepicker.jan': 'Jan',
  'datepicker.feb': 'Fév',
  'datepicker.mar': 'Mar',
  'datepicker.apr': 'Avr',
  'datepicker.may': 'Mai',
  'datepicker.jun': 'Juin',
  'datepicker.jul': 'Juil',
  'datepicker.aug': 'Août',
  'datepicker.sep': 'Sept',
  'datepicker.oct': 'Oct',
  'datepicker.nov': 'Nov',
  'datepicker.dec': 'Déc',

  // ===== Sélecteur =====
  'select.placeholder': 'Veuillez sélectionner',
  'select.search': 'Rechercher des options',
  'select.empty': 'Aucune option correspondante',
  'select.loading': 'Chargement...',
  'select.selectAll': 'Tout sélectionner',
  'select.clear': 'Effacer',
  'create.label': 'Créer « {value} »',

  // ===== Arborescence =====
  'tree.empty': 'Aucune donnée',
  'tree.loading': 'Chargement...',
  'tree.expandAll': 'Tout développer',
  'tree.collapseAll': 'Tout réduire',
  'tree.checkedAll': 'Tout cocher',
  'tree.uncheckedAll': 'Tout décocher',

  // ===== Notification =====
  'message.success': 'Succès',
  'message.error': 'Erreur',
  'message.warning': 'Avertissement',
  'message.info': 'Info',
  'notification.title': 'Notifications',
  'notification.empty': 'Aucune notification',
  'notification.markAllRead': 'Tout marquer comme lu',
  'notification.viewAll': 'Voir tout',

  // ===== État vide =====
  'empty.default': 'Aucune donnée',
  'empty.search': 'Aucun résultat trouvé',
  'empty.networkError': 'Erreur réseau',
  'empty.retry': 'Cliquer pour réessayer',
  'empty.created': 'Commencer la création',
  'empty.error': 'Échec du chargement',
  'empty.no-data': 'Aucune donnée',
  'empty.no-permission': 'Aucune autorisation',
  'empty.no-result': 'Aucun résultat correspondant',

  // ===== Thème =====
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
  'theme.system': 'Système',

  // ===== Langue =====
  'locale.switchLanguage': 'Changer de langue',
  'locale.currentLanguage': 'Langue actuelle',
} as const satisfies Record<string, string>;

export default frFR;
