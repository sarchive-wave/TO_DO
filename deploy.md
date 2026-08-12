# Build / Deploy / Run

서버 빌드·배포·실행 방법. 포트/구성은 `infra.md`, DB는 `db.md` 참조.

## 사전 준비

| 대상 | 버전 |
|------|------|
| Python | 3.9+ |
| Node.js | 26+ (npm 포함) |
| PostgreSQL | 15+ (DB `todo_db`, 사용자 `sarchive` 준비) |

PostgreSQL 초기 준비 예시:
```bash
createdb todo_db
# 또는 psql에서: CREATE DATABASE todo_db OWNER sarchive;
```
> 테이블은 백엔드 최초 기동 시 자동 생성(`create_all` + `_run_migrations`)되고, 기본 카테고리는 seed로 삽입된다.

---

## 방법 A) 스크립트로 일괄 실행 (권장)

```bash
./start.sh     # 백엔드(8080) + 프론트엔드(5173) 백그라운드 기동
./stop.sh      # 두 서비스 종료
```

- `start.sh`: 8080/5173 사용 중이면 중복 실행 방지, `nohup`으로 띄워 **터미널을 닫아도 유지**. PID는 `logs/*.pid`, 로그는 `logs/*.log`에 기록(`logs.md` 참조).
- `stop.sh`: PID 파일로 종료 후, 남은 프로세스를 포트(8080/5173)로 정리.

---

## 방법 B) 다른 PC 최초 세팅

이 호스트(`192.168.2.126`)의 PostgreSQL에 접속하도록 자동 구성:
```bash
git pull
./setup.sh     # .env 생성 + venv 생성 + pip/npm 설치 (psycopg2-binary 포함)
./start.sh
```
`setup.sh`가 만드는 `.env`:
```env
DATABASE_URL=postgresql://sarchive:todo1234@192.168.2.126:5432/todo_db
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.2.126:5173
```

---

## 방법 C) 수동 실행

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt     # psycopg2-binary(PostgreSQL 드라이버) 포함
# backend/.env 준비 (DATABASE_URL, ALLOWED_ORIGINS)
uvicorn app.main:app --host 0.0.0.0 --port 8080
```
- API 문서: http://localhost:8080/docs

### Frontend
```bash
cd frontend
npm install
npm run dev                          # http://localhost:5173 (개발)
npm run build                        # 프로덕션 정적 빌드 → dist/
npm run preview                      # 빌드 결과 로컬 미리보기
```

---

## 의존성

**Backend** (`requirements.txt`)
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
pydantic==2.7.1
pydantic-settings==2.2.1
python-dotenv==1.0.1
psycopg2-binary==2.9.12
```

**Frontend**: React 18, MUI v5, @mui/x-date-pickers, react-router-dom v6, axios, dayjs, @dnd-kit, recharts (상세는 `frontend/package.json`).

---

## 배포 체크리스트

- [ ] PostgreSQL 기동 및 `todo_db` 접근 확인 (`psql`로 연결 테스트)
- [ ] `backend/.env`의 `DATABASE_URL`, `ALLOWED_ORIGINS` 정확한지 확인
- [ ] 백엔드 기동 후 `GET /health` → `{"status":"ok"}` 확인
- [ ] 프론트에서 목록 조회/등록 동작 확인
- [ ] 코드 변경 반영 필요 시 `./stop.sh && ./start.sh` 재기동

---

## 프로덕션 주의 (현재 개발 구성 기준)

- 프론트는 Vite **dev server**로 서빙 중. 실서비스에선 `npm run build` 산출물(`dist/`)을 정적 서버/Nginx로 서빙하고 `/api`를 백엔드로 프록시하는 구성 권장.
- 인증 없음(`auth.md`) → 외부 노출 시 네트워크 접근 통제 필수.
