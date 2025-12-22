#!/bin/bash

# Teaching Assistant 전체 시스템 시작 스크립트
# Excalidraw Canvas + TTS Server 동시 시작

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "======================================"
echo "Teaching Assistant 시스템 시작"
echo "======================================"
echo ""

# .env 파일 확인
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "⚠️  경고: .env 파일이 없습니다."
    echo "   GEMINI_API_KEY를 설정해주세요."
    echo ""
    read -p ".env.example을 생성하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > "$PROJECT_DIR/.env" << EOF
# Gemini API Key for TTS
GEMINI_API_KEY=your_api_key_here
EOF
        echo "✓ .env 파일이 생성되었습니다. API 키를 입력해주세요."
        exit 0
    fi
fi

# Node.js 의존성 확인
if [ ! -d "$PROJECT_DIR/server/node_modules" ]; then
    echo "📦 TTS 서버 의존성 설치 중..."
    cd "$PROJECT_DIR/server"
    npm install
    echo "✓ 의존성 설치 완료"
    echo ""
fi

# 기존 프로세스 종료
echo "🔍 기존 프로세스 확인 중..."

# Excalidraw Canvas (포트 3333)
CANVAS_PID=$(lsof -ti:3333 || echo "")
if [ -n "$CANVAS_PID" ]; then
    echo "  - Excalidraw Canvas (PID: $CANVAS_PID) 종료 중..."
    kill -9 $CANVAS_PID 2>/dev/null || true
    sleep 1
fi

# TTS Server (포트 3334)
TTS_PID=$(lsof -ti:3334 || echo "")
if [ -n "$TTS_PID" ]; then
    echo "  - TTS Server (PID: $TTS_PID) 종료 중..."
    kill -9 $TTS_PID 2>/dev/null || true
    sleep 1
fi

echo "✓ 기존 프로세스 정리 완료"
echo ""

# 트랜스크립트 디렉토리 생성
mkdir -p "$PROJECT_DIR/transcripts"

# Excalidraw Canvas 시작
echo "🎨 Excalidraw Canvas 시작 중... (포트 3333)"
screen -dmS excalidraw-canvas bash -c "bash /Users/danny/Documents/PARA/Projects/mcp-excalidraw/start-canvas.sh 2>&1 | tee $PROJECT_DIR/excalidraw.log"

sleep 2

# TTS Server 시작
echo "🔊 TTS Server 시작 중... (포트 3334)"
screen -dmS tts-server bash -c "cd $PROJECT_DIR/server && \
    node index.js 2>&1 | tee $PROJECT_DIR/tts-server.log"

sleep 2

# 상태 확인
echo ""
echo "======================================"
echo "시작 상태 확인"
echo "======================================"

# Excalidraw 상태
if lsof -ti:3333 > /dev/null 2>&1; then
    echo "✓ Excalidraw Canvas: http://localhost:3333"
else
    echo "✗ Excalidraw Canvas: 시작 실패"
fi

# TTS Server 상태
if lsof -ti:3334 > /dev/null 2>&1; then
    echo "✓ TTS Server: http://localhost:3334"
else
    echo "✗ TTS Server: 시작 실패"
fi

echo ""
echo "======================================"
echo "Screen 세션 정보"
echo "======================================"
echo "Excalidraw Canvas: screen -r excalidraw-canvas"
echo "TTS Server: screen -r tts-server"
echo ""
echo "로그 파일:"
echo "  - Excalidraw: $PROJECT_DIR/excalidraw.log"
echo "  - TTS Server: $PROJECT_DIR/tts-server.log"
echo ""
echo "======================================"
echo "사용 방법"
echo "======================================"
echo "1. 브라우저에서 http://localhost:3334 열기"
echo "2. Claude Code에서 '/teach' 스킬 실행"
echo "3. 질문하고 한국어 설명 + 그림 + 음성 학습!"
echo ""
echo "트랜스크립트: $PROJECT_DIR/transcripts/"
echo ""
echo "시스템 종료: killall screen 또는 개별 screen 세션 종료"
echo "======================================"
