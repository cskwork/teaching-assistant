# CLAUDE

<insight>
- Windows용 시작 스크립트는 start-canvas.ps1로 Excalidraw를 띄우고 TTS는 백그라운드 로그 리디렉션으로 실행한다.
- Windows에서 .bat 파일이 LF만 사용하면 cmd.exe가 줄 첫 글자를 누락해 실행 오류가 발생할 수 있어 CRLF가 필요하다.
- GEMINI_API_KEY가 없으면 TTS는 비활성화 상태로 처리하고 텍스트 스트리밍은 유지한다.
- 배치 파일의 괄호 블록 안에서 `)`를 출력하면 파서가 블록 종료로 인식하므로 `^)`로 이스케이프해야 한다.
- PowerShell Start-Job은 스크립트 종료 시 작업이 종료되므로 서버는 Start-Process로 분리 실행해야 한다.
</insight>
