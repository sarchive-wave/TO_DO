#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGDIR="$ROOT/logs"

echo "서비스 종료 중..."

# pid 파일로 종료
for SERVICE in backend frontend; do
  PID_FILE="$LOGDIR/$SERVICE.pid"
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill "$PID" 2>/dev/null; then
      echo "  $SERVICE 종료 (PID $PID)"
    fi
    rm -f "$PID_FILE"
  fi
done

# 혹시 남은 프로세스 포트로 정리
for PORT in 8080 5173; do
  LEFTOVER=$(lsof -ti:$PORT)
  if [ -n "$LEFTOVER" ]; then
    kill $LEFTOVER 2>/dev/null
    echo "  포트 $PORT 정리"
  fi
done

echo "완료"
