@echo off
title Farmacia API
cd /d "%~dp0FarmaciaAPI"

echo ============================================================
echo   FARMACIA API - iniciando...
echo ============================================================
echo.
echo  El navegador se abrira solo en unos segundos.
echo  Si no se abre, entra a mano a:  http://localhost:5239
echo.
echo  Para detener la API: pulsa Ctrl+C o cierra esta ventana.
echo ============================================================
echo.

start "" cmd /c "timeout /t 10 /nobreak > nul & start "" http://localhost:5239"

dotnet run --launch-profile http

echo.
echo La API se detuvo. Pulsa una tecla para cerrar.
pause > nul
