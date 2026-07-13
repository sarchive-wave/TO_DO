#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGDIR="$ROOT/logs"
mkdir -p "$LOGDIR"

# 이미 실행 중인지 확인
if lsof -ti:8080 > /dev/null 2>&1 || lsof -ti:5173 > /dev/null 2>&1; then
  echo "이미 실행 중입니다."
  echo "  Frontend : http://localhost:5173"
  echo "  Backend  : http://localhost:8080"
  exit 0
fi

echo "백엔드 시작 중..."
cd "$ROOT/backend"
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8080 > "$LOGDIR/backend.log" 2>&1 &
echo $! > "$LOGDIR/backend.pid"

echo "프론트엔드 시작 중..."
cd "$ROOT/frontend"
nohup npm run dev > "$LOGDIR/frontend.log" 2>&1 &
echo $! > "$LOGDIR/frontend.pid"

sleep 2
echo ""
echo "서비스 실행 중 (터미널 닫아도 유지됩니다)"
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8080"
echo ""
echo "종료: ./stop.sh"
echo "로그: tail -f logs/backend.log  /  tail -f logs/frontend.log"
