$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Pythonw = Join-Path $ProjectRoot ".venv\Scripts\pythonw.exe"
if (-not (Test-Path $Pythonw)) {
    throw "No existe $Pythonw. Crea primero el entorno virtual e instala requirements.txt."
}
$TaskName = "AgenteNFC"
$Action = New-ScheduledTaskAction -Execute $Pythonw -Argument "-m nfc_agent" -WorkingDirectory $ProjectRoot
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Agente NFC local WebSocket" -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName
Write-Host "Tarea '$TaskName' registrada. Revisa los logs en el directorio de datos del agente."
