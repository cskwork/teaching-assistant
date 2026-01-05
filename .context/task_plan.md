# Task Plan: Claude Agent SDK TypeScript Integration

## Goal
Integrate Anthropic Claude SDK into the existing TTS server (`server/index.js`) to enable AI-powered chat with streaming responses, using `temp/CLAUDE.md` as system prompt.

## User Decisions
- **Location**: Existing TTS server (`server/index.js`)
- **Flow**: Direct Claude call + event broadcast via existing SSE system
- **Model**: `claude-sonnet-4-20250514`
- **Streaming**: Yes
- **Frontend**: Update to call new `/chat` endpoint

## Phases
- [x] Phase 1: Add dependencies (`@anthropic-ai/sdk` to package.json)
- [x] Phase 2: Add `ANTHROPIC_API_KEY` to `.env`
- [x] Phase 3: Modify `server/index.js` (SDK import, system prompt, /chat endpoint)
- [x] Phase 4: Update frontend `sendUserChatMessage()` function
- [x] Phase 5: Install dependencies and test

## Key Files
| File | Action |
|------|--------|
| `server/package.json` | Add `@anthropic-ai/sdk` dependency |
| `.env` | Add `ANTHROPIC_API_KEY` |
| `server/index.js` | Add Claude SDK, `/chat` endpoint, system prompt loading |
| `server/public/index.html` | Update `sendUserChatMessage()` to POST to `/chat` |
| `temp/CLAUDE.md` | System prompt source (read-only) |

## Architecture
```
User Chat Input (Frontend)
       |
       v
POST /chat (new endpoint)
       |
       v
Load system prompt from temp/CLAUDE.md
       |
       v
Claude SDK streaming call
       |
       +---> broadcastEvent({ type: 'text_delta' })
       |
       v
broadcastEvent({ type: 'text_done' })
```

## Decisions Made
- Use existing `broadcastEvent()` for SSE streaming (reuse existing infra)
- Keep conversation history in memory (simple, no persistence needed yet)
- Add `/chat/reset` endpoint for clearing conversation

## Errors Encountered
- (none yet)

## Status
**COMPLETED** - All phases done

## Testing Instructions
1. Start the server (OAuth handles authentication automatically):
   ```bash
   cd server && npm run dev
   ```
2. Open http://localhost:3334 in browser
3. Type a message in the chat input and send
4. Verify streaming response appears in real-time
