#!/bin/bash
# 다른 PC에서 git pull 후 이 스크립트를 실행하세요.
# 이 Mac(192.168.2.126)의 PostgreSQL에 연결하도록 설정합니다.

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== to_do 환경 설정 ==="

# .env 생성
cat > "$ROOT/backend/.env" <<EOF
DATABASE_URL=postgresql://sarchive:todo1234@192.168.2.126:5432/todo_db
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.2.126:5173
EOF
echo "✓ backend/.env 생성 완료"

# venv 없으면 생성
if [ ! -d "$ROOT/backend/venv" ]; then
  echo "가상환경 생성 중..."
  python3 -m venv "$ROOT/backend/venv"
  echo "✓ 가상환경 생성 완료"
fi

# 패키지 설치
source "$ROOT/backend/venv/bin/activate"
pip install -r "$ROOT/backend/requirements.txt" -q
pip install psycopg2-binary -q
echo "✓ 패키지 설치 완료"

# 프론트엔드 패키지 설치
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "프론트엔드 패키지 설치 중..."
  cd "$ROOT/frontend" && npm install -q
  echo "✓ npm 패키지 설치 완료"
fi

echo ""
echo "설정 완료! 이제 ./start.sh 로 서비스를 시작하세요."
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8080"
