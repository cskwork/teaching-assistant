# Changelog 2026-01-07

## 채팅 응답 마크다운 렌더링 추가

- `server/public/index.html` 수정
- marked.js CDN 추가하여 마크다운 파싱 지원
- `addChatMessage` 함수에서 `textContent` 대신 `marked.parse()`로 HTML 렌더링
- 코드 블록, 리스트, 강조 텍스트 등 마크다운 요소 CSS 스타일 추가

## Excalidraw 자동 드로잉 통합

- `server/index.js` 수정: 채팅 시 MCP 도구 활성화
  - `batch_create_elements`, `create_from_mermaid`, `delete_element`, `query_elements` 도구 허용
  - `tool_use`, `tool_result` 이벤트 처리하여 드로잉 진행 상황 브로드캐스트
  - Excalidraw 서버 헬스체크 추가 (30초 주기)
  - `/health` 엔드포인트에 `excalidrawEnabled` 상태 추가
- `prompts/visual-teaching.md` 생성: 시각적 교육 시스템 프롬프트
  - 시각화 토픽 자동 감지 규칙
  - Excalidraw 도구 사용 가이드
  - 색상 코딩 및 레이아웃 지침
- `server/public/index.html` 수정: 드로잉 이벤트 UI 처리 강화
  - 도구 실행 상태 표시 ("batch_create_elements 실행 중...")
  - 드로잉 이벤트 시 즉시 캔버스 새로고침
