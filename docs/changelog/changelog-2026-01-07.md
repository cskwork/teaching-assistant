# Changelog 2026-01-07

## 채팅 응답 마크다운 렌더링 추가

- `server/public/index.html` 수정
- marked.js CDN 추가하여 마크다운 파싱 지원
- `addChatMessage` 함수에서 `textContent` 대신 `marked.parse()`로 HTML 렌더링
- 코드 블록, 리스트, 강조 텍스트 등 마크다운 요소 CSS 스타일 추가
