#!/bin/bash

echo "서비스 종료 중..."

# 포트 8080 (백엔드)
BACKEND=$(lsof -ti:8080)
if [ -n "$BACKEND" ]; then
  kill $BACKEND 2>/dev/null
  echo "  백엔드 종료 (port 8080)"
else
  echo "  백엔드 실행 중 아님"
fi

# 포트 5173 (프론트엔드)
FRONTEND=$(lsof -ti:5173)
if [ -n "$FRONTEND" ]; then
  kill $FRONTEND 2>/dev/null
  echo "  프론트엔드 종료 (port 5173)"
else
  echo "  프론트엔드 실행 중 아님"
fi

echo "완료"
