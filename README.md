# Teaching Assistant

Multi-modal teaching workflow combining visual (Excalidraw) and audio (Gemini TTS) learning with Claude Code.

## Features

- **Korean Language Instruction**: Fun, playful Korean teacher persona
- **Visual Learning**: Automatic diagram generation using Excalidraw MCP
- **Audio Learning**: Korean text-to-speech using Gemini API
- **Synchronized Output**: Visual and audio content generated in parallel
- **Session Transcripts**: Automatic recording of all teaching sessions
- **Chunked Delivery**: 3-5 sentence chunks for better comprehension

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude (Main Teacher)                     │
│         Fun, playful Korean instructor persona               │
│              Chunks: 3-5 sentences at a time                 │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
                  ▼                       ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   Drawing Subagent      │   │   Speaking Subagent     │
│   (Excalidraw MCP)      │   │   (TTS Express Server)  │
│   - Visualize concepts  │   │   - Korean audio        │
│   - Append drawings     │   │   - Stream to browser   │
│   - Color-coded         │   │   - Gemini API          │
└─────────────────────────┘   └─────────────────────────┘
```

## Setup

### Prerequisites

- Node.js 18+
- Claude Code CLI
- Excalidraw MCP server (already configured in `.mcp.json`)
- Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. **Configure API Key**:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

2. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Make Scripts Executable**:
   ```bash
   chmod +x scripts/*.sh
   ```

## Usage

### Start the System

```bash
./scripts/start-all.sh
```

This will:
- Start Excalidraw Canvas on port 3333
- Start TTS Server on port 3334
- Install dependencies if needed
- Create necessary directories

### Open Live Session UI

Open your browser to: `http://localhost:3334`

### Activate Teaching Mode

In Claude Code, run:
```
/teach
```

Or simply ask: "가르쳐줘", "설명해줘"

### Example Session

**You**: "재귀함수가 뭐예요?"

**Claude**:
1. Generates 3-5 Korean sentences explaining recursion
2. Creates Excalidraw diagram visualizing the concept
3. Sends text to TTS server for audio playback
4. Waits for both to complete
5. Continues with next chunk
6. Records entire session to transcript

## Project Structure

```
teaching-assistant/
├── .mcp.json                    # Excalidraw MCP config
├── .env.example                 # API key template
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
├── server/
│   ├── package.json             # Node.js dependencies
│   ├── index.js                 # Express TTS server
│   └── public/
│       └── index.html           # Audio player interface
├── scripts/
│   ├── start-canvas.sh          # Start Excalidraw (existing)
│   └── start-all.sh             # Start everything (new)
├── transcripts/                 # Session recordings
│   └── markdown-YYYY-MM-DD.md
└── docs/
    └── changelog/
        └── changelog-2024-12-22.md
```

## Components

### TTS Server (`server/index.js`)

Express server that:
- Accepts Korean text via POST `/tts`
- Calls Gemini TTS API
- Converts base64 PCM to WAV
- Streams audio via WebSocket
- Serves browser audio player
- Emits text streaming events for live UI updates

**Endpoints**:
- `GET /` - Live session interface
- `POST /tts` - Text-to-speech conversion
- `GET /health` - Server health check
- `GET /events` - Agent event stream (SSE)
- `POST /events` - Push agent event updates
- `POST /tts` emits `text_delta` and `text_done` events for streaming text
- `WebSocket` - Real-time audio streaming

### Teaching Skill (`~/.claude/skills/teach.md`)

Defines:
- Korean instructor persona
- 3-5 sentence chunking strategy
- Excalidraw visualization patterns
- TTS coordination
- Transcript recording format

### Live Session UI (`server/public/index.html`)

Browser interface with:
- Real-time progress indicators (text, drawing, audio)
- Event stream updates via SSE
- WebSocket audio playback
- Live chat panel unlocked after drawing completion
- Cropped Excalidraw preview rendered from `/api/elements`
- Preview zoom controls with mouse wheel support
- Preview pan with click-and-drag

## Color Coding

Excalidraw diagrams use consistent colors:
- **Purple (#667eea)**: Main concepts
- **Green (#51cf66)**: Examples/details
- **Red (#ff6b6b)**: Important/warnings
- **Orange (#ffa94d)**: Connections/relationships

## Transcripts

All sessions are recorded to:
```
transcripts/markdown-YYYY-MM-DD.md
```

Format:
```markdown
# Teaching Session - 2024-12-22

## Q: [User question]

## A (Chunk 1):
[Korean response]

---

## A (Chunk 2):
[Korean response]
```

## Troubleshooting

### TTS Server Won't Start

1. Check if port 3334 is available:
   ```bash
   lsof -ti:3334
   ```

2. Verify GEMINI_API_KEY is set:
   ```bash
   grep GEMINI_API_KEY .env
   ```

3. Check server logs:
   ```bash
   tail -f tts-server.log
   ```

### Excalidraw Not Connecting

1. Check if port 3333 is available:
   ```bash
   lsof -ti:3333
   ```

2. Verify MCP server is running:
   ```bash
   screen -r excalidraw-canvas
   ```

### No Audio Playing

1. Ensure browser is connected to WebSocket
2. Check browser console for errors
3. Verify Gemini API key is valid
4. Check server logs for TTS errors

## Screen Sessions

View running servers:
```bash
screen -ls
```

Attach to sessions:
```bash
screen -r excalidraw-canvas  # Excalidraw Canvas
screen -r tts-server          # TTS Server
```

Detach: `Ctrl-A`, then `D`

## Stop All Services

```bash
killall screen
```

Or stop individually:
```bash
screen -S excalidraw-canvas -X quit
screen -S tts-server -X quit
```

## API Reference

### Gemini TTS

**Endpoint**:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent
```

**Headers**:
```
x-goog-api-key: YOUR_API_KEY
Content-Type: application/json
```

**Body**:
```json
{
  "contents": [{
    "parts": [{ "text": "Korean text here" }]
  }],
  "generationConfig": {
    "responseModalities": ["AUDIO"],
    "speechConfig": {
      "voiceConfig": {
        "prebuiltVoiceConfig": {
          "voiceName": "Kore"
        }
      }
    }
  }
}
```

**Response**: Base64 PCM audio (24kHz, mono, 16-bit)

## Contributing

This is a personal teaching assistant project. Feel free to fork and customize.

## License

MIT
