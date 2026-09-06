/**
 * 错误码 → English mapping table
 *
 * <p>English user-facing error messages keyed by backend business error codes
 * ({@code YdszResponse.code} values, e.g. {@code A01051}). Keys are strictly
 * typed by {@link ErrorCode} derived from the auto-generated registry in
 * @ydsz/request.
 *
 * <p>Unmatched codes fall back to the backend {@code message}/{@code error}
 * fields in the response interceptor.
 *
 * @path comm/locales/errors/en-US.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ErrorCode } from './types';

/**
 * Core error code → English message map
 */
export const EN_US_MESSAGES: Readonly<Partial<Record<ErrorCode, string>>> = {
  // ==================== Success ====================
  A00000: 'Operation successful',

  // ==================== A01 Parameter / Business ====================
  A01051: 'Operation failed',
  A01052: 'Invalid request parameters, please check your input',
  A01053: 'Parameter value is invalid',
  A01054: 'Invalid request format',
  A01055: 'Current business state does not allow this operation',
  A01056: 'Operation violates business rules',
  A01057: 'Business processing failed, please try again later',
  A01058: 'Method not allowed',
  A01059: 'Duplicate submission is not allowed',
  A01060: 'Invalid flow state',
  A01061: 'Data has been modified, please refresh and retry',
  A01062: 'Data already exists, cannot be created again',
  A01063: 'Related data does not exist, operation rejected',
  A01064: 'Required field cannot be empty',
  A01065: 'Data validation failed',

  // ==================== A02 Authentication ====================
  A02051: 'Unauthorized, please login first',
  A02052: 'You are not logged in, please login first',
  A02053: 'Session expired, please login again',
  A02054: 'Authentication failed, please check your credentials',
  A02055: 'Account has been disabled, please contact administrator',
  A02056: 'Account is logged in on another device',

  // ==================== A03 Authorization / Permission ====================
  A03051: 'No permission to access this resource',
  A03052: 'Insufficient permissions to perform this operation',
  A03053: 'Access denied',
  A03054: 'Role mismatch',

  // ==================== A04 Data / Resource ====================
  A04051: 'Requested resource not found',
  A04052: 'Resource conflict',
  A04053: 'Data not found',
  A04054: 'Resource not found',
  A04055: 'Data already exists',
  A04056: 'Data conflict, please refresh and retry',
  A04057: 'Too many requests, please try again later',
  A04058: 'Operation too frequent, please slow down',
  A04059: 'Operation frequency limit exceeded',
  A04060: 'Rate limit exceeded, please try again later',
  A04061: 'File upload failed, please try again',
  A04062: 'File download failed, please try again',
  A04063: 'Unsupported file type',
  A04064: 'File size exceeds the limit',

  // ==================== A05 Batch operations ====================
  A05001: 'Batch operation partially succeeded, please review failed items',

  // ==================== A07 Idempotency ====================
  A07001: 'Request already processed, do not resubmit',

  // ==================== B01 System errors ====================
  B01051: 'Internal system error, please try again later',
  B01052: 'System error, please contact technical support',
  B01053: 'Database operation error',
  B01054: 'Service temporarily unavailable, please try again later',
  B01055: 'Network error, please check your connection',
  B01056: 'Cache service error',
  B01057: 'Message queue service error',
  B01058: 'Storage service error',
  B01059: 'Infrastructure service unavailable',
  B01060: 'Service is circuit-breaking, please try again later',
  B01061: 'System resource exhausted, please try again later',
  B01062: 'Service degraded, features may be limited',

  // ==================== B02 External services ====================
  B02051: 'Bad gateway, please try again later',
  B02052: 'Gateway timeout, please try again later',
  B02053: 'External service error',
  B02054: 'External service timeout',
  B02055: 'External service rejected the request',
  B02056: 'Notification delivery failed',

  // ==================== Security module ====================
  C01051: 'Access denied by security policy',
  C01052: 'Authentication required',
  C01053: 'Session expired, please login again',
  C01054: 'Permission denied',
  C01061: 'No access permission for this menu',
  C01062: 'No permission for this button',
  C01063: 'No access permission for this API',
  C01064: 'No data view permission',
  C01065: 'No column view permission',
  C01071: 'Password is not strong enough',
  C01072: 'New password matches a previous password',
  C01081: 'Internal signature verification failed',

  // ==================== UserInfo: accounts ====================
  B30001: 'User not found',
  B30002: 'Incorrect password',
  B30003: 'User has been disabled',
  B30005: 'Username already exists',
  B30007: 'Captcha invalid or expired',
  B30008: 'Please enter the captcha',
  B30009: 'Two-factor authentication not bound',
  B30010: 'Old password is incorrect',
  B30011: 'New password must differ from the old password',
  B30012: 'Password is not strong enough',
  B30013: 'Cannot reuse a recently used password',
  B30014: 'Two-factor authentication already bound',

  // ==================== UserInfo: OAuth / Token ====================
  A20001: 'Not logged in or token is invalid',
  A20003: 'Token is invalid',
  A20108: 'Two-factor authentication required',
  A20109: 'Invalid two-factor authentication code',
  A20110: 'Account is locked, please try again later',
  A20120: 'Sensitive operation requires secondary verification',
  A20121: 'Verification expired, please verify again',
  A20122: 'Verification password incorrect',
  A20123: 'Secondary authentication required',
  A20124: 'Secondary authentication expired',
  A20125: 'Account not activated, please verify email or phone',
  A20126: 'Account has been suspended',
  A20127: 'Account has been deactivated permanently',
  A20128: 'Session limit for this device type reached',
  A20129: 'Request is missing required signature parameters',
  A20130: 'Invalid request signature',
  A20131: 'Request signature has expired',
  A20132: 'Request security risk detected (nonce reuse)',
  A20133: 'Account has been banned',
  A20134: 'Account has been permanently banned',
  B30016: 'Authorization code invalid or expired',
  B30017: 'Invalid client ID',
  B30018: 'Redirect URI mismatch',
  B30019: 'IP is temporarily blocked due to too many failed login attempts',
  B30020: 'PKCE verification failed',

  // ==================== UserInfo: imports ====================
  B30021: 'Import file is empty',
  B30022: 'Import file contains no valid data',
  B30023: 'Import size exceeds the limit',
  B30024: 'Username field is empty in imported data',
  B30025: 'Real name field is empty in imported data',
  B30026: 'Password field is empty in imported data',
  B30027: 'Username already exists in imported data',
  B30028: 'Imported data validation failed',
  B30029: 'Leader user in imported data does not exist',
  B30030: 'Failed to read import file',

  // ==================== UserInfo: departments / roles / menus ====================
  B30101: 'Department not found',
  B30102: 'Cannot delete department with child departments',
  B30103: 'Cannot delete department with users',
  B30104: 'Department code already exists',
  B30105: 'Company not found',
  B30106: 'Company code already exists',
  B32001: 'Role not found',
  B32002: 'Role code already exists',
  B32003: 'Built-in role cannot be deleted',
  B32004: 'Cannot delete role with assigned users',
  B32005: 'Permission not found',
  B32006: 'Menu not found',
  B32007: 'Position not found',
  B32008: 'Position code already exists',
  B32009: 'Language not found',
  B32010: 'Language code already exists',
  B32011: 'Cannot delete menu with child menus',

  // ==================== UserInfo: registration / password recovery ====================
  B33001: 'Self-registration is not enabled',
  B33002: 'Verification code expired or invalid',
  B33003: 'Verification code requested too frequently',
  B33004: 'Account not found for password recovery',
  B33005: 'Phone number does not match the account',
  B33006: 'Account is not locked, no need to unlock',
  B33007: 'Account unlock failed, verification info mismatch',
  B33008: 'Unlock verification code expired or invalid',

  // ==================== UserInfo: organization / auth ====================
  B34001: 'Social authentication is not enabled',
  B34002: 'Unsupported social platform',
  B34003: 'This social account is already bound to another user',
  B34004: 'Social account not bound',
  B34005: 'Social authentication failed',
  B34006: 'Social authentication CSRF verification failed',
  B35001: 'LDAP sync is not enabled',
  B35002: 'LDAP sync is already in progress',
  B35003: 'LDAP sync failed',
  B35004: 'LDAP connection failed',
  B36001: 'SCIM service is not enabled',
  B36002: 'SCIM authentication failed',
  B36003: 'SCIM user not found',
  B36004: 'SCIM filter expression parse error',
  B36005: 'SCIM PATCH operation is invalid',
  B37001: 'SAML configuration is incomplete',
  B37002: 'SAML response is invalid',
  B37003: 'SAML signature is missing',
  B37004: 'SAML signature verification failed',
  B37005: 'SAML assertion has expired',
  B37006: 'SAML assertion is not yet valid',
  B37007: 'SAML audience mismatch',
  B37008: 'SAML SSO initiation failed',
  B38001: 'OIDC configuration is invalid',
  B38002: 'OIDC nonce invalid or already used',
  B38003: 'OIDC ID Token issuance failed',
  B39001: 'WebAuthn is not enabled',
  B39002: 'WebAuthn challenge has expired',
  B39003: 'WebAuthn challenge type mismatch',
  B39004: 'WebAuthn challenge user mismatch',
  B39005: 'WebAuthn client data is invalid',
  B39006: 'WebAuthn signature verification failed',
  B39007: 'WebAuthn credential not found',
  B39008: 'WebAuthn credential already exists',
  B39009: 'WebAuthn credential does not belong to current user',
  B39010: 'WebAuthn credential limit reached',

  // ==================== Workflow module ====================
  B70001: 'Workflow template not found',
  B70002: 'Workflow template code already exists',
  B70003: 'Deployed template cannot be deleted',
  B70004: 'Workflow definition not found',
  B70005: 'BPMN file parsing failed',
  B70006: 'BPMN file contains unsupported elements',
  B71001: 'Workflow instance not found',
  B71002: 'Workflow instance status is invalid',
  B71003: 'Workflow instance already finished',
  B72001: 'Task not found',
  B72002: 'No permission to handle this task',
  B72003: 'Task already handled',
  B72004: 'Approver already exists, cannot add again',
  B72005: 'Illegal state transition',
  B73001: 'Delegation authorization not found',
  B73002: 'Delegation authorization expired',
  B74001: 'Workflow category not found',
  B74002: 'Workflow category code already exists',
  B74003: 'Workflow comment not found',
  B74004: 'Workflow attachment not found',
  B75001: 'SLA rule not found',
  B75002: 'Task exceeded SLA deadline',
  B75003: 'Urging too frequent',

  // ==================== Workflow: AI Agent node ====================
  B76001: 'AI Agent not found or not enabled',
  B76002: 'AI Agent call timed out',
  B76003: 'AI Agent output format is invalid',
  B76004: 'AI Agent call error',

  // ==================== System module: configuration ====================
  B90001: 'System configuration item not found',
  B90002: 'Configuration key name already exists',
  B90003: 'Configuration key name format is invalid',
  B90004: 'Parameter error',
  B90005: 'Configuration value is too long',
  B90006: 'Configuration value format is invalid',
  B90007: 'Batch update limit exceeded',
  B90008: 'Invalid value type',
  B90009: 'Configuration export failed',
  B91007: 'Cannot delete dictionary type with existing items',

  // ==================== Message module ====================
  B91001: 'Message template not found',
  B91002: 'Message template code already exists',
  B91003: 'Message template is pending audit',
  B91004: 'Message template audit rejected',
  B91005: 'Message template variable missing',
  B91101: 'Notification record not found',
  B91102: 'Message log not found',
  B91103: 'Message delivery failed',
  B91104: 'Message recall failed',
  B91201: 'Message channel not configured',
  B91202: 'Message channel delivery failed',
  B91203: 'Route rule not found',
  B91204: 'Message channel has been blocked',
  B91301: 'Message batch not found',
  B91302: 'This batch is currently running',
  B91303: 'Canary batch not found',
  B91401: 'Unsubscribe token is invalid',
  B91402: 'User preference not found',
  B91403: 'Feedback record not found',
  B91501: 'Message channel not enabled',
  B91502: 'Message send rate exceeded',
  B91503: 'Message send dimension limit exceeded',
  B91504: 'Message send frequency limit exceeded',
  B91505: 'Message send quota exhausted',
  B91506: 'User has unsubscribed from this message type',
  B91507: 'Currently in do-not-disturb period',
  B91508: 'Deferred send limit exceeded',
  B91509: 'Message already sent (duplicate)',
  B91510: 'Message channel suppressed',

  // ==================== Cronjob module: scheduled tasks ====================
  B92001: 'Scheduled job not found',
  B92002: 'Job code already exists',
  B92003: 'Job is already running',
  B92004: 'Job handler not found',
  B92005: 'Invalid cron expression',
  B92101: 'DAG not found',
  B92102: 'Cycle detected in DAG, please check node dependencies',
  B92103: 'DAG instance not found',
  B92104: 'DAG node not found',
  B92201: 'Job execution history not found',
  B92202: 'Job version not found',
  B92203: 'Job execution log not found',
  B92301: 'Alert rule not found',
  B92302: 'Webhook configuration not found',
  B92303: 'Connector not found',
  B92304: 'Webhook delivery failed',

  // ==================== LiteRule engine ====================
  B93001: 'Rule not found',
  B93002: 'Rule code already exists',
  B93003: 'Rule expression syntax error',
  B93004: 'Rule status is invalid',
  B93005: 'Illegal state transition',
  B93101: 'Rule pack not found',
  B93102: 'Rule version not found',
  B93103: 'Rule pack already installed',
  B93201: 'Rule chain not found',
  B93202: 'Decision table not found',
  B93203: 'AB test policy not found',
  B93301: 'Test case not found',
  B93302: 'DSL script parse error',
  B93303: 'Variable definition not found',
  B93401: 'Rule engine model invocation failed',

  // ==================== Agent module: AI Agent ====================
  B94001: 'Agent not found',
  B94002: 'Agent code already exists',
  B94003: 'Unsupported Agent type',
  B94004: 'Agent execution failed',
  B94005: 'Agent workflow contains a cycle',
  B94101: 'Conversation not found',
  B94102: 'Conversation memory overflow',
  B94201: 'LLM call failed',
  B94202: 'LLM response format is invalid',
  B94203: 'LLM token limit exceeded',
  B94204: 'LLM provider not configured',
  B94251: 'Daily token quota exhausted',
  B94252: 'Monthly budget exhausted',
  B94301: 'Knowledge base retrieval failed',
  B94302: 'Tool not found',
  B94303: 'Tool execution failed',
  B94304: 'Prompt template not found',
  B94305: 'Prompt template code already exists',
  B94306: 'Content was rejected by safety guardrail',
  B94401: 'Trace record not found',
  B94402: 'Trace record is empty',

  // ==================== System: multi-tenancy ====================
  B95001: 'Tenant plan not found',
  B95002: 'Tenant plan code already exists',
  B96001: 'Entity version not found',

  // ==================== Unknown / fallback ====================
  C99999: 'Unknown error, please contact technical support',
};

/**
 * Look up the English error message for a given error code.
 *
 * @param code - The backend business error code
 * @returns The matching English message, or {@code undefined} if not found
 */
export function getEnUsMessage(code: ErrorCode): string | undefined {
  return EN_US_MESSAGES[code];
}
