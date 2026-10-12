@echo off
setlocal
cd /d "%~dp0.."
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -m nfc_agent
) else (
  py -3 -m nfc_agent
)
