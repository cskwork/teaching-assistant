#!/bin/bash
# Excalidraw 캔버스 서버 시작 스크립트
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXCALIDRAW_ROOT="/Users/danny/Documents/PARA/Projects/mcp-excalidraw"
PORT=3333

# 기존 서버 종료
EXISTING_PID=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$EXISTING_PID" ]; then
    echo "Stopping existing server (PID: $EXISTING_PID)..."
    kill $EXISTING_PID 2>/dev/null
    sleep 1
fi

cd "$EXCALIDRAW_ROOT/mcp_excalidraw"
echo "Installing dependencies..."
npm install
echo "Building project..."
if npm run build; then
    export PORT
    echo "Starting Excalidraw canvas at http://localhost:$PORT (background)"
    # 셸 종료와 무관하게 동작하도록 분리된 screen 세션에서 실행
    screen -dmS excalidraw_server bash -c "node dist/server.js > '$EXCALIDRAW_ROOT/excalidraw.log' 2>&1"
    SERVER_PID=$!
    echo "Server PID: $SERVER_PID"
    disown

    # 서버 준비 대기
    echo "Waiting for server to start..."
    for i in {1..10}; do
        if lsof -i :$PORT >/dev/null; then
            echo "Server is running at http://localhost:$PORT"
            exit 0
        fi
        sleep 1
    done

    echo "Server failed to start within 10 seconds. Check excalidraw.log for details."
    exit 1
else
    echo "Build failed. Check output above."
    exit 1
fi
