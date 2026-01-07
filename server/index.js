require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');

// Claude Agent SDK (ES module - 동적 import 사용)
let queryFn = null;
async function getQueryFn() {
  if (!queryFn) {
    const sdk = await import('@anthropic-ai/claude-agent-sdk');
    queryFn = sdk.query;
  }
  return queryFn;
}

const app = express();
const PORT = 3334;
let wss;
const sseClients = new Set();
let activeTextStream = null;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function sendSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastEvent(event) {
  const payload = {
    ...event,
    ts: Date.now()
  };

  sseClients.forEach((res) => {
    sendSse(res, payload);
  });
}

function stopTextStream() {
  if (!activeTextStream) {
    return;
  }
  clearInterval(activeTextStream.interval);
  clearTimeout(activeTextStream.timeout);
  activeTextStream = null;
}

function streamTextEvents(text, durationSeconds) {
  if (!text) {
    return;
  }
  stopTextStream();

  const source = text.replace(/\s+/g, ' ').trim();
  if (!source) {
    return;
  }

  let index = 0;
  const total = source.length;
  const durationMs = durationSeconds ? Math.max(1400, durationSeconds * 1000) : null;
  const targetSteps = durationMs
    ? Math.max(18, Math.min(240, Math.round(durationMs / 90)))
    : null;
  const step = targetSteps ? Math.max(1, Math.ceil(total / targetSteps)) : (total > 160 ? 4 : 3);
  const steps = Math.max(1, Math.ceil(total / step));
  const interval = durationMs
    ? Math.max(50, Math.round(durationMs / steps))
    : (total > 160 ? 90 : 120);

  activeTextStream = {};
  activeTextStream.interval = setInterval(() => {
    const slice = source.slice(index, index + step);
    index += step;
    const progress = Math.min(100, Math.round((index / total) * 100));

    broadcastEvent({
      type: 'text_delta',
      payload: {
        delta: slice,
        progress
      }
    });

    if (index >= total) {
      stopTextStream();
      broadcastEvent({ type: 'text_done' });
    }
  }, interval);

  activeTextStream.timeout = setTimeout(() => {
    stopTextStream();
    broadcastEvent({ type: 'text_done' });
  }, Math.max(2500, interval * (steps + 6)));
}

// Gemini TTS API 설정
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TTS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';
const TTS_DISABLED_MESSAGE = 'GEMINI_API_KEY가 설정되지 않아 TTS가 비활성화되었습니다';

// Claude API 설정 (Agent SDK 사용 - API 키 불필요)
let systemPrompt = '';
let conversationHistory = [];

// 시스템 프롬프트 로드
const SYSTEM_PROMPT_PATH = path.join(__dirname, '../temp/CLAUDE.md');
function loadSystemPrompt() {
  try {
    systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');
    console.log('시스템 프롬프트 로드 완료: temp/CLAUDE.md');
  } catch (err) {
    console.warn('시스템 프롬프트 로드 실패:', err.message);
    systemPrompt = 'You are a helpful teaching assistant. Respond in Korean.';
  }
}
loadSystemPrompt();

// Base64 PCM을 WAV로 변환하는 함수
function pcmToWav(base64Pcm) {
  const pcmBuffer = Buffer.from(base64Pcm, 'base64');
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const fileSize = 36 + dataSize;

  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(fileSize, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataSize, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}

function getWavDurationSeconds(wavBuffer) {
  const dataSize = Math.max(0, wavBuffer.length - 44);
  const bytesPerSample = 2;
  const sampleRate = 24000;
  const numChannels = 1;
  const totalSamples = dataSize / (bytesPerSample * numChannels);
  if (!Number.isFinite(totalSamples) || totalSamples <= 0) {
    return null;
  }
  return totalSamples / sampleRate;
}

function handleTtsDisabled(text) {
  broadcastEvent({
    type: 'audio_status',
    payload: {
      state: 'disabled',
      message: TTS_DISABLED_MESSAGE
    }
  });

  if (text) {
    setTimeout(() => {
      streamTextEvents(text);
    }, 120);
  }
}

// TTS API 호출 함수
async function generateSpeech(text) {
  if (!GEMINI_API_KEY) {
    const error = new Error(TTS_DISABLED_MESSAGE);
    error.code = 'TTS_DISABLED';
    throw error;
  }

  const response = await fetch(GEMINI_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text }]
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Callirrhoe'
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API 오류: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const base64Audio = data.candidates[0].content.parts[0].inlineData.data;
  return pcmToWav(base64Audio);
}

// 연결된 모든 WebSocket 클라이언트에 오디오 브로드캐스트
function broadcastAudio(wavBuffer) {
  let clientCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(wavBuffer);
      clientCount++;
    }
  });
  console.log(`오디오 브로드캐스트: ${clientCount}개 클라이언트`);
  return clientCount;
}

// 에이전트 이벤트 스트림 (SSE)
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  sendSse(res, { type: 'connected' });
  sseClients.add(res);

  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// 에이전트 이벤트 수신 (외부 오케스트레이터용)
app.post('/events', (req, res) => {
  const { type, payload } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'type이 필요합니다' });
  }

  broadcastEvent({ type, payload });
  return res.json({ ok: true });
});

// TTS 엔드포인트
app.post('/tts', async (req, res) => {
  try {
    const { text, broadcast = true } = req.body;

    if (!text) {
      return res.status(400).json({ error: '텍스트가 필요합니다' });
    }

    if (!GEMINI_API_KEY) {
      console.warn('TTS 비활성화: GEMINI_API_KEY 없음');
      handleTtsDisabled(text);
      return res.status(503).json({ error: TTS_DISABLED_MESSAGE });
    }

    console.log(`TTS 요청 받음: ${text.substring(0, 50)}...`);
    broadcastEvent({
      type: 'audio_status',
      payload: {
        state: 'requested',
        preview: text.substring(0, 80)
      }
    });

    const wavBuffer = await generateSpeech(text);
    const durationSeconds = getWavDurationSeconds(wavBuffer);

    // WebSocket 클라이언트에 브로드캐스트 (기본 활성화)
    let broadcastedTo = 0;
    if (broadcast) {
      broadcastedTo = broadcastAudio(wavBuffer);
    }

    broadcastEvent({
      type: 'audio_status',
      payload: {
        state: 'ready',
        bytes: wavBuffer.length,
        clients: broadcastedTo
      }
    });

    setTimeout(() => {
      streamTextEvents(text, durationSeconds);
    }, 120);

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': wavBuffer.length
    });
    res.send(wavBuffer);

    console.log(`TTS 응답 전송 완료 (브로드캐스트: ${broadcastedTo}개 클라이언트)`);
  } catch (error) {
    console.error('TTS 오류:', error);
    broadcastEvent({
      type: 'audio_status',
      payload: {
        state: 'error',
        message: error.message
      }
    });
    res.status(500).json({ error: error.message });
  }
});

// Claude Chat 엔드포인트 (Agent SDK 사용)
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '메시지가 필요합니다' });
    }

    console.log(`Chat 요청 받음: ${message.substring(0, 50)}...`);

    // 사용자 메시지 브로드캐스트
    broadcastEvent({
      type: 'chat_message',
      payload: { role: 'user', text: message }
    });

    // Claude Agent SDK query() 사용
    const query = await getQueryFn();
    let fullResponse = '';

    for await (const msg of query({
      prompt: message,
      options: {
        allowedTools: [],
        permissionMode: 'bypassPermissions',
        systemPrompt: systemPrompt ? {
          type: 'preset',
          preset: 'default',
          append: systemPrompt
        } : undefined
      }
    })) {
      // 텍스트 응답 스트리밍
      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            fullResponse += block.text;
            broadcastEvent({
              type: 'text_delta',
              payload: { delta: block.text, progress: null }
            });
          }
        }
      }
    }

    // 완료 브로드캐스트
    broadcastEvent({ type: 'text_done' });
    broadcastEvent({
      type: 'chat_message',
      payload: { role: 'agent', text: fullResponse }
    });

    console.log(`Chat 응답 완료: ${fullResponse.length}자`);

    // TTS 자동 생성 (비동기로 처리하여 응답 지연 방지)
    if (GEMINI_API_KEY && fullResponse.trim()) {
      (async () => {
        try {
          broadcastEvent({
            type: 'audio_status',
            payload: { state: 'generating', message: 'TTS 생성 중...' }
          });
          const wavBuffer = await generateSpeech(fullResponse);
          const clientCount = broadcastAudio(wavBuffer);
          broadcastEvent({
            type: 'audio_status',
            payload: { state: 'playing', message: `재생 중 (${clientCount}개 클라이언트)` }
          });
          console.log(`Chat TTS 브로드캐스트 완료: ${clientCount}개 클라이언트`);
        } catch (err) {
          console.error('Chat TTS 오류:', err.message);
          broadcastEvent({
            type: 'audio_status',
            payload: { state: 'error', message: err.message }
          });
        }
      })();
    }

    res.json({ ok: true, response: fullResponse });
  } catch (error) {
    console.error('Chat 오류:', error);
    broadcastEvent({
      type: 'chat_error',
      payload: { message: error.message }
    });
    res.status(500).json({ error: error.message });
  }
});

// 대화 초기화 엔드포인트
app.post('/chat/reset', (req, res) => {
  conversationHistory = [];
  console.log('대화 히스토리 초기화됨');
  res.json({ ok: true, message: '대화가 초기화되었습니다' });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeyConfigured: !!GEMINI_API_KEY,
    ttsEnabled: !!GEMINI_API_KEY,
    claudeEnabled: true
  });
});

// HTTP 서버 시작
const server = app.listen(PORT, () => {
  console.log(`TTS 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`API 키 설정: ${GEMINI_API_KEY ? '✓' : '✗'}`);
});

// WebSocket 서버 설정 (실시간 스트리밍용)
wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket 클라이언트 연결됨');

  ws.on('message', async (message) => {
    try {
      const { text } = JSON.parse(message.toString());
      if (!text) {
        ws.send(JSON.stringify({ error: '텍스트가 필요합니다' }));
        return;
      }

      if (!GEMINI_API_KEY) {
        console.warn('TTS 비활성화: GEMINI_API_KEY 없음');
        handleTtsDisabled(text);
        ws.send(JSON.stringify({ error: TTS_DISABLED_MESSAGE }));
        return;
      }

      console.log(`WebSocket TTS 요청: ${text.substring(0, 50)}...`);

      broadcastEvent({
        type: 'audio_status',
        payload: {
          state: 'requested',
          preview: text.substring(0, 80)
        }
      });

      const wavBuffer = await generateSpeech(text);
      const durationSeconds = getWavDurationSeconds(wavBuffer);
      ws.send(wavBuffer);

      broadcastEvent({
        type: 'audio_status',
        payload: {
          state: 'ready',
          bytes: wavBuffer.length
        }
      });

      setTimeout(() => {
        streamTextEvents(text, durationSeconds);
      }, 120);

      console.log('WebSocket TTS 응답 전송 완료');
    } catch (error) {
      console.error('WebSocket TTS 오류:', error);
      broadcastEvent({
        type: 'audio_status',
        payload: {
          state: 'error',
          message: error.message
        }
      });
      ws.send(JSON.stringify({ error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket 클라이언트 연결 종료');
  });
});
