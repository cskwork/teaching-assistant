@echo off
setlocal

:: Teaching Assistant 전체 시스템 시작 (Windows)
:: Excalidraw Canvas + TTS Server 동시 시작

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_DIR=%%~fI"
set "CANVAS_PORT=3333"
set "TTS_PORT=3334"
set "EXCALIDRAW_LOG=%PROJECT_DIR%\mcp-excalidraw-agent\excalidraw.log"
set "TTS_LOG=%PROJECT_DIR%\tts-server.log"

echo ======================================
echo Teaching Assistant 시스템 시작 (Windows)
echo ======================================
echo.

if not exist "%PROJECT_DIR%\.env" (
  echo 경고: .env 파일이 없습니다.
  echo GEMINI_API_KEY가 없으면 TTS는 비활성화됩니다.
)

echo 기존 프로세스 확인 중...
call :KillPort %CANVAS_PORT% "Excalidraw Canvas"
call :KillPort %TTS_PORT% "TTS Server"
echo 기존 프로세스 정리 완료
echo.

if not exist "%PROJECT_DIR%\transcripts" (
  mkdir "%PROJECT_DIR%\transcripts"
)

echo Excalidraw Canvas 시작 중... (포트 %CANVAS_PORT%)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_DIR%\scripts\start-canvas.ps1"
if errorlevel 1 (
  echo Excalidraw Canvas 시작 실패
  exit /b 1
)

echo TTS Server 시작 중... (포트 %TTS_PORT%)
start "" /b cmd /c "cd /d ""%PROJECT_DIR%\server"" && node index.js > ""%TTS_LOG%"" 2>&1"

echo TTS Server 시작 대기 중...
set "TTS_READY="
for /l %%i in (1,1,10) do (
  powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %TTS_PORT% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
  if not errorlevel 1 (
    set "TTS_READY=1"
    goto :TtsReady
  )
  timeout /t 1 /nobreak >nul
)
:TtsReady

echo.
echo ======================================
echo 시작 상태 확인
echo ======================================
call :CheckPort %CANVAS_PORT% "Excalidraw Canvas" "http://localhost:%CANVAS_PORT%"
call :CheckPort %TTS_PORT% "TTS Server" "http://localhost:%TTS_PORT%"
echo.
echo ======================================
echo 로그 파일
echo ======================================
echo Excalidraw: %EXCALIDRAW_LOG%
echo TTS Server: %TTS_LOG%
echo.
echo ======================================
echo 사용 방법
echo ======================================
echo 1. 브라우저에서 http://localhost:%TTS_PORT% 열기
echo 2. Claude Code에서 '/teach' 스킬 실행
echo 3. 질문하고 한국어 설명 + 그림 + 음성 학습
echo.
echo 트랜스크립트: %PROJECT_DIR%\transcripts\
echo.
echo 시스템 종료: 이 스크립트를 다시 실행하거나 포트 %CANVAS_PORT%, %TTS_PORT% 종료
echo ======================================
exit /b 0

:KillPort
set "PORT=%~1"
set "NAME=%~2"
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`) do (
  echo   - %NAME% (PID: %%P^) 종료 중...
  taskkill /PID %%P /F >nul 2>&1
)
exit /b 0

:CheckPort
set "PORT=%~1"
set "NAME=%~2"
set "URL=%~3"
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo %NAME%: 시작 실패
) else (
  echo %NAME%: %URL%
)
exit /b 0
