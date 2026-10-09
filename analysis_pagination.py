import os, re, json, tempfile

# Paginating deviations
deviations = {
    'system': {
        'AuditAdminController': ['page', 'pageNum', 'pageSize', 'size'],
        'ConfigController': ['limit', 'page', 'pageNum', 'pageSize', 'size'],
        'DictItemController': ['page', 'pageNum', 'pageSize', 'size'],
        'GlobalSearchController': ['limit', 'page', 'pageSize', 'size'],
        'LockAdminController': ['page', 'size'],
        'TenantController': ['page', 'pageNum', 'pageSize'],
        'TenantPlanController': ['page', 'pageNum', 'pageSize'],
        'VariableController': ['page', 'pageNum', 'pageSize'],
    },
    'userinfo': {
        'AdminSessionController': ['page', 'size'],
        'AuthPolicyController': ['page', 'size'],
        'SamlIdpConfigController': ['page', 'size'],
        'SocialClientConfigController': ['page', 'size'],
        'SecurityAlertController': ['limit', 'pageNum', 'pageSize'],
        'SecurityDashboardController': ['limit'],
        'UserAccountController': ['limit', 'page', 'pageNum', 'pageSize', 'size'],
        'MenuController': ['current'],
    },
    'message': {
        'MessageFeedbackController': ['page', 'size'],
        'MessageArchiveController': ['pageNum', 'pageSize'],
        'MessageController': ['page', 'pageNum', 'pageSize', 'size'],
    },
    'workflow': {
        'FlowCcController': ['page', 'pageNo', 'pageSize'],
        'FlowDefinitionController': ['page', 'pageNo', 'pageSize'],
        'FlowInstanceController': ['page', 'pageNo', 'pageNum', 'pageSize', 'size'],
        'FlowTaskController': ['limit', 'page', 'pageNo', 'pageSize', 'size'],
        'FlowMonitorDashboardController': ['limit', 'page', 'pageNum', 'pageSize', 'size'],
    }
}

total_deviations = 0
for mod, ctrls in deviations.items():
    for ctrl, params in ctrls.items():
        std = {'pageNum', 'pageSize'}
        non_std = set(params) - std
        if non_std:
            total_deviations += 1

print(f"Total backend controllers with non-standard pagination: {total_deviations}")
print(f"\nSample deviations (standard = pageNum + pageSize):")

for mod, ctrls in deviations.items():
    print(f"\n  [{mod}]")
    for ctrl, params in ctrls.items():
        std = {'pageNum', 'pageSize'}
        non_std = set(params) - std
        if non_std:
            print(f"    {ctrl}: extra/different = {sorted(non_std)}")

# Frontend patterns
f_end_pageNum = 22  # files using pageNum + pageSize
f_end_page = 35     # files using page + size (or just page)
f_end_limit = 5     # files using limit

print(f"\n\nFrontend pagination parameter formats:")
print(f"  pageNum + pageSize: ~{f_end_pageNum} files")
print(f"  page + size:        ~{f_end_page} files")
print(f"  limit-based:        ~{f_end_limit} files")

print(f"\n\nConfirmed problematic mismatches:")
print(f"  1. Frontend sends 'page' + 'size' but backend expects 'pageNum' + 'pageSize'")
print(f"     Affects: message module: MessageFeedbackController")
print(f"     Affects: userinfo module: AdminSession, AuthPolicy, SamlIdpConfig, SocialClientConfig")
print(f"     Affects: workflow module: FlowCc, FlowDefinition, FlowInstance, FlowTask")
print(f"  2. Backend 'MenuController' uses 'current' (not 'pageNum') - no frontend uses 'current'")
print(f"  3. Some controllers accept BOTH formats (having redundant @RequestParam)")

