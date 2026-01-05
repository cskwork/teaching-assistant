# Changelog 2026-01-05

## Excalidraw Canvas 백그라운드 유지

- `scripts/start-canvas.ps1`에서 PowerShell Job 대신 분리된 프로세스로 실행해 포트 3333 유지

## Windows 시작 스크립트 추가

- `scripts/start-all.bat` 추가
- .env 확인 및 초기 생성 흐름 제공
- 포트 3333/3334 기존 프로세스 종료 후 서버 시작
- Excalidraw 및 TTS 로그 파일 경로 출력

## Windows 배치 스크립트 실행 오류 수정

- `scripts/start-all.bat` 줄바꿈을 CRLF로 정리하여 cmd.exe 실행 오류 예방
- `scripts/start-all.bat`에서 괄호 출력 중 파서 오류가 나지 않도록 닫는 괄호 이스케이프 처리

## Gemini API 키 없이 시작 가능

- `scripts/start-all.bat`, `scripts/start-all.sh`에서 .env 부재 시 경고만 출력하고 계속 실행
- `server/index.js`에서 키 미설정 시 TTS 비활성화 이벤트 및 503 응답 처리
- `server/public/index.html`에서 TTS 비활성화 표시 및 헬스 체크 반영
