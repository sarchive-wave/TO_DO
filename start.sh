#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "백엔드 시작 중..."
cd "$ROOT/backend"
source venv/bin/activate
uvicorn app.main:app --port 8080 &
BACKEND_PID=$!

echo "프론트엔드 시작 중..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "서비스 실행 중"
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8080"
echo ""
echo "종료하려면 Ctrl+C"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '서비스 종료'" SIGINT SIGTERM
wait
