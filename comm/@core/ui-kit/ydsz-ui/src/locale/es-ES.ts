/**
 * ydsz-ui Textos integrados en español del componente（es-ES）。
 *
 * Las claves corresponden exactamente con zh-CN.ts;
 * se admitidos marcadores {placeholder}.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\es-ES.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Tabla de mensajes en español —— 西班牙语 */
export const esES = {
  // ===== Común =====
  'common.confirm': 'Confirmar',
  'common.cancel': 'Cancelar',
  'common.loading': 'Cargando...',
  'common.search': 'Buscar',
  'common.reset': 'Restablecer',
  'common.submit': 'Enviar',
  'common.close': 'Cerrar',
  'common.more': 'Más',
  'common.expand': 'Expandir',
  'common.collapse': 'Colapsar',
  'common.copy': 'Copiar',
  'common.copied': 'Copiado',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.add': 'Agregar',
  'common.save': 'Guardar',
  'common.refresh': 'Actualizar',

  // ===== Tabla =====
  'table.empty': 'No hay datos',
  'table.loading': 'Cargando...',
  'table.total': '{count} registros',
  'table.page': 'Página {page}',
  'table.filter.confirm': 'Filtrar',
  'table.filter.reset': 'Restablecer',
  'table.sort.asc': 'Ascendente',
  'table.sort.desc': 'Descendente',
  'table.selectAll': 'Seleccionar todo',
  'table.selectRow': 'Seleccionar esta fila',
  'table.cancelSelect': 'Cancelar selección',
  'table.expandedRow': 'Expandir fila',
  'table.collapseRow': 'Colapsar fila',
  'table.columnSetting': 'Configuración de columnas',

  // ===== Formulario =====
  'form.validating': 'Validando...',
  'form.submitting': 'Enviando...',
  'form.required': 'Este campo es obligatorio',
  'form.invalid': 'Formato incorrecto',
  'form.passwordMismatch': 'Las contraseñas no coinciden',
  'form.validateSuccess': 'Validación exitosa',
  'form.validateFailed': 'Validación fallida, revise las entradas',

  // ===== Cuadro de diálogo =====
  'dialog.close': 'Cerrar',
  'dialog.confirm': 'Confirmar',
  'dialog.cancel': 'Cancelar',
  'dialog.deleteConfirm': '¿Confirmar eliminación?',
  'dialog.deleteWarning': 'Esta acción no se puede deshacer',

  // ===== Subida =====
  'upload.drag': 'Haga clic o arrastre archivos a esta área para subir',
  'upload.dragging': 'Suelte para subir',
  'upload.error': 'Error al subir',
  'upload.success': 'Subida exitosa',
  'upload.preview': 'Vista previa',
  'upload.remove': 'Eliminar',
  'upload.retry': 'Reintentar',
  'upload.maxSize': 'El tamaño del archivo excede el límite',
  'upload.maxCount': 'La cantidad de archivos excede el límite',
  'upload.invalidFormat': 'Formato de archivo no compatible',

  // ===== Paginación =====
  'pagination.page': '',
  'pagination.total': '{count} registros en total',
  'pagination.size': '/ página',
  'pagination.jumpTo': 'Ir a',
  'pagination.prev': 'Anterior',
  'pagination.next': 'Siguiente',
  'pagination.first': 'Primera',
  'pagination.last': 'Última',

  // ===== Selector de fecha =====
  'datepicker.placeholder': 'Seleccionar fecha',
  'datepicker.startPlaceholder': 'Fecha de inicio',
  'datepicker.endPlaceholder': 'Fecha de fin',
  'datepicker.today': 'Hoy',
  'datepicker.yesterday': 'Ayer',
  'datepicker.thisWeek': 'Esta semana',
  'datepicker.thisMonth': 'Este mes',
  'datepicker.thisYear': 'Este año',
  'datepicker.clear': 'Borrar',
  'datepicker.confirm': 'Confirmar',
  'datepicker.mon': 'Lun',
  'datepicker.tue': 'Mar',
  'datepicker.wed': 'Mié',
  'datepicker.thu': 'Jue',
  'datepicker.fri': 'Vie',
  'datepicker.sat': 'Sáb',
  'datepicker.sun': 'Dom',
  'datepicker.jan': 'Ene',
  'datepicker.feb': 'Feb',
  'datepicker.mar': 'Mar',
  'datepicker.apr': 'Abr',
  'datepicker.may': 'May',
  'datepicker.jun': 'Jun',
  'datepicker.jul': 'Jul',
  'datepicker.aug': 'Ago',
  'datepicker.sep': 'Sep',
  'datepicker.oct': 'Oct',
  'datepicker.nov': 'Nov',
  'datepicker.dec': 'Dic',

  // ===== Selector =====
  'select.placeholder': 'Seleccione',
  'select.search': 'Buscar opciones',
  'select.empty': 'Sin opciones coincidentes',
  'select.loading': 'Cargando...',
  'select.selectAll': 'Seleccionar todo',
  'select.clear': 'Limpiar',
  'select.removeTag': 'Quitar',
  'create.label': 'Crear «{value}»',

    // ===== Árbol =====
  'tree.empty': 'No hay datos',
  'tree.loading': 'Cargando...',
  'tree.expandAll': 'Expandir todo',
  'tree.collapseAll': 'Colapsar todo',
  'tree.checkedAll': 'Marcar todo',
  'tree.uncheckedAll': 'Desmarcar todo',

  // ===== Notificación =====
  'message.success': 'Éxito',
  'message.error': 'Error',
  'message.warning': 'Advertencia',
  'message.info': 'Información',
  'notification.title': 'Notificaciones',
  'notification.empty': 'Sin notificaciones',
  'notification.markAllRead': 'Marcar todo como leído',
  'notification.viewAll': 'Ver todo',
  'notification.closeAriaLabel': 'Cerrar notificación',

  // ===== Toast =====
  'toast.region': 'Notificaciones',

  // ===== Estado vacío =====
  'empty.default': 'No hay datos',
  'empty.search': 'No se encontraron resultados',
  'empty.networkError': 'Error de red',
  'empty.retry': 'Clic para reintentar',
  'empty.created': 'Comenzar a crear',
  'empty.error': 'Error de carga',
  'empty.no-data': 'No hay datos',
  'empty.no-permission': 'Sin permiso',
  'empty.no-result': 'Sin resultados coincidentes',

  // ===== Tema =====
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
  'theme.system': 'Sistema',

  // ===== Idioma =====
  'locale.switchLanguage': 'Cambiar idioma',
  'locale.currentLanguage': 'Idioma actual',
} as const satisfies Record<string, string>;

export default esES;
