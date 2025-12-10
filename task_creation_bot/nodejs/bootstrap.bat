@echo off
setlocal enabledelayedexpansion
set APP_ID=%APP_ID%
set APP_SECRET=%APP_SECRET%
set BASE_DOMAIN=%BASE_DOMAIN%
if "%BASE_DOMAIN%"=="" set BASE_DOMAIN=https://open.feishu.cn
call npm install
call npm run dev
