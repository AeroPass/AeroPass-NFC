@echo off
echo Instalando Agente NFC como servicio de Windows...

REM Descargar NSSM si no existe
where nssm >nul 2>nul
if %errorlevel% neq 0 (
    echo NSSM no encontrado, descargando...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'"
    powershell -Command "Expand-Archive -Path 'nssm.zip' -DestinationPath 'nssm'"
    set PATH=%PATH%;%CD%\nssm\nssm-2.24\win64
)

REM Instalar el servicio
nssm install AgenteNFC "%CD%\agente_nfc.exe"
nssm set AgenteNFC AppDirectory "%CD%"
nssm set AgenteNFC Start SERVICE_AUTO_START
nssm set AgenteNFC AppExit Default Restart
nssm set AgenteNFC AppRestartDelay 5000

REM Iniciar servicio
nssm start AgenteNFC

echo Servicio AgenteNFC instalado y en ejecución.
pause

