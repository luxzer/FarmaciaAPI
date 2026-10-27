@echo off
title Farmacia - lanzador
cd /d "%~dp0"

echo ============================================================
echo   FARMACIA - levantando los dos proyectos
echo ============================================================
echo.
echo   1) FarmaciaAPI  ..  http://localhost:5239  (Swagger)
echo   2) FarmaciaWeb  ..  http://localhost:5120  (sitio Blazor)
echo.
echo   Se abriran dos ventanas, una por proyecto.
echo   El sitio necesita que la API este corriendo.
echo.
echo   Para detener todo: cierra las dos ventanas.
echo ============================================================
echo.

start "FarmaciaAPI" cmd /k "cd /d "%~dp0FarmaciaAPI" && dotnet run --launch-profile http"

echo Esperando a que la API arranque...
timeout /t 8 /nobreak > nul

start "FarmaciaWeb" cmd /k "cd /d "%~dp0FarmaciaWeb" && dotnet run --launch-profile http"

timeout /t 10 /nobreak > nul
start "" http://localhost:5120

echo.
echo Listo. El navegador se abrio en el sitio.
echo Esta ventana ya se puede cerrar.
timeout /t 5 /nobreak > nul
