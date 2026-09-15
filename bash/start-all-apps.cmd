@echo off
setlocal
cd /d D:\Code\open\ydsz-micro
start "YDSZ-main-5600"      cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/main-web run dev"
start "YDSZ-userinfo-5601"  cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/userinfo-web run dev"
start "YDSZ-system-5602"    cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/system-web run dev"
start "YDSZ-message-5604"   cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/message-web run dev"
start "YDSZ-cronjob-5605"   cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/cronjob-web run dev"
start "YDSZ-workflow-5606"  cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/workflow-web run dev"
start "YDSZ-nextwiki-5607"  cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/nextwiki-web run dev"
start "YDSZ-literule-5608"  cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/literule-web run dev"
start "YDSZ-agent-5610"     cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/agent-web run dev"
start "YDSZ-generator-5609" cmd /k "cd /d D:\Code\open\ydsz-micro && pnpm -F @ydsz/generator-web run dev"
endlocal
