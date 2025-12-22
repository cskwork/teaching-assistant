require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const PORT = 3334;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Gemini TTS API 설정
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TTS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';

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

// TTS API 호출 함수
async function generateSpeech(text) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다');
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
              voiceName: 'Kore'
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

// TTS 엔드포인트
app.post('/tts', async (req, res) => {
  try {
    const { text, broadcast = true } = req.body;

    if (!text) {
      return res.status(400).json({ error: '텍스트가 필요합니다' });
    }

    console.log(`TTS 요청 받음: ${text.substring(0, 50)}...`);

    const wavBuffer = await generateSpeech(text);

    // WebSocket 클라이언트에 브로드캐스트 (기본 활성화)
    let broadcastedTo = 0;
    if (broadcast) {
      broadcastedTo = broadcastAudio(wavBuffer);
    }

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': wavBuffer.length
    });
    res.send(wavBuffer);

    console.log(`TTS 응답 전송 완료 (브로드캐스트: ${broadcastedTo}개 클라이언트)`);
  } catch (error) {
    console.error('TTS 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeyConfigured: !!GEMINI_API_KEY
  });
});

// HTTP 서버 시작
const server = app.listen(PORT, () => {
  console.log(`TTS 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`API 키 설정: ${GEMINI_API_KEY ? '✓' : '✗'}`);
});

// WebSocket 서버 설정 (실시간 스트리밍용)
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket 클라이언트 연결됨');

  ws.on('message', async (message) => {
    try {
      const { text } = JSON.parse(message.toString());
      console.log(`WebSocket TTS 요청: ${text.substring(0, 50)}...`);

      const wavBuffer = await generateSpeech(text);
      ws.send(wavBuffer);

      console.log('WebSocket TTS 응답 전송 완료');
    } catch (error) {
      console.error('WebSocket TTS 오류:', error);
      ws.send(JSON.stringify({ error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket 클라이언트 연결 종료');
  });
});
