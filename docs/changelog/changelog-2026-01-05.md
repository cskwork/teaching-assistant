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

## TalkingHead 캐릭터 전환 추가

- `server/public/index.html`에 캐릭터 선택 UI와 로컬 저장 추가
- 아바타 로딩 상태 표시 및 실패 시 이전 캐릭터로 복구
- 커스텀 캐릭터 추가 프롬프트 지원
- 기본 프리셋 캐릭터 5종 추가
- 캐릭터 1, 4 프리셋 제거 및 기본 캐릭터를 캐릭터 2로 변경
- 기본 프리셋 이름을 역할 기반으로 정리
- 교사 · 차분 프리셋 제거 및 연구원 · 침착을 최상단으로 정렬

## 사용자 채팅 입력 추가

- 라이브 에이전트 세션 아래에 텍스트 입력 UI 추가
- `/events`로 사용자 메시지 전송 및 진행 로그 반영
