# Notes: Claude Agent SDK Integration

## Key Learnings

### 1. Anthropic SDK Authentication
- OAuth 사용 시 API key 불필요
- `new Anthropic()` 만으로 초기화 가능 (기본 인증 자동 사용)
- API key 사용 시: `new Anthropic({ apiKey: 'xxx' })`

### 2. Streaming API Pattern
```javascript
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: systemPrompt,
  messages: conversationHistory
}).on('text', (text) => {
  // 각 토큰 도착 시 호출
  broadcastEvent({ type: 'text_delta', payload: { delta: text } });
});

await stream.finalMessage(); // 완료 대기
```

### 3. Conversation History 관리
- 수동으로 배열 관리 필요
- 형식: `[{ role: 'user'|'assistant', content: string }]`
- system prompt는 messages 배열이 아닌 별도 `system` 파라미터로 전달

### 4. SSE 통합
- 기존 `broadcastEvent()` 함수 재사용
- `text_delta` 이벤트로 스트리밍 텍스트 전송
- `text_done` 이벤트로 완료 신호
- `chat_message` 이벤트로 최종 메시지 (채팅 UI용)

### 5. System Prompt 로딩
```javascript
const SYSTEM_PROMPT_PATH = path.join(__dirname, '../temp/CLAUDE.md');
let systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');
```
- 서버 시작 시 한 번 로드
- 런타임 변경 시 서버 재시작 필요 (또는 reload 엔드포인트 추가)

## 구현된 엔드포인트

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/chat` | POST | Claude에 메시지 전송, 스트리밍 응답 |
| `/chat/reset` | POST | 대화 히스토리 초기화 |
| `/health` | GET | `claudeEnabled: true` 포함 |

## 개선 가능 사항
- [ ] 대화 히스토리 길이 제한 (컨텍스트 오버플로우 방지)
- [ ] 시스템 프롬프트 핫 리로드 엔드포인트
- [ ] 에러 발생 시 히스토리에서 실패한 메시지 제거
- [ ] 여러 세션 동시 지원 (세션 ID 기반)
