# Infrastructure

포트, 서비스 구성, 네트워크 방향 정의.

## 서비스 구성도

```
┌─────────────┐   /api proxy   ┌──────────────┐   psycopg2    ┌──────────────┐
│  Frontend   │ ─────────────► │   Backend    │ ────────────► │  PostgreSQL  │
│  Vite dev   │  (5173→8080)   │  FastAPI     │  (5432)       │  todo_db     │
│  :5173      │ ◄───────────── │  Uvicorn     │ ◄──────────── │  :5432       │
└─────────────┘   JSON         │  :8080       │   rows        └──────────────┘
      ▲                        └──────────────┘
      │ 브라우저 접속
   사용자(사내망)
```

- 프론트엔드는 `/api` 요청을 Vite dev server proxy로 백엔드 8080에 전달 (`vite.config.ts`).
- 백엔드는 CORS 허용 오리진(`ALLOWED_ORIGINS`)만 수락.
- 세 서비스 모두 동일 호스트(개발 Mac, `192.168.2.126`)에서 구동. 다른 PC는 이 호스트의 백엔드/DB에 네트워크로 접속.

---

## 포트

| 서비스 | 포트 | 바인딩 | 비고 |
|--------|------|--------|------|
| Frontend (Vite) | 5173 | `0.0.0.0` | 개발 서버 (`npm run dev`) |
| Backend (FastAPI/Uvicorn) | 8080 | `0.0.0.0` | `uvicorn app.main:app` |
| PostgreSQL | 5432 | localhost/LAN | DB |

- `0.0.0.0` 바인딩이라 LAN 내 다른 기기에서 `http://192.168.2.126:5173`, `:8080` 접근 가능.

---

## 네트워크 / 접근

| 방향 | 출발 | 도착 | 프로토콜 |
|------|------|------|----------|
| 사용자 → 프론트 | 브라우저 | :5173 | HTTP |
| 프론트 → 백엔드 | Vite proxy | :8080 | HTTP (`/api`) |
| 백엔드 → DB | psycopg2 | :5432 | PostgreSQL |

- 인증 계층 없음 → 접근 통제는 사내망/방화벽에 의존 (`auth.md`).
- 공유 호스트 IP: `192.168.2.126` (다른 PC는 `setup.sh`가 이 IP로 `.env` 구성).

---

## 환경변수 (`backend/.env`)

| 키 | 예시 | 설명 |
|----|------|------|
| `DATABASE_URL` | `postgresql://sarchive:todo1234@localhost:5432/todo_db` | DB 접속 문자열 |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://192.168.2.126:5173` | CORS 허용 오리진(콤마 구분) |

- 기본값은 `config.py`에 있으나, 실제 값은 `.env`가 우선. `.env`는 git에 커밋하지 않음(`.gitignore`).

---

## 런타임 버전

| 대상 | 버전 |
|------|------|
| Python | 3.9 |
| Node.js | v26 |
| PostgreSQL | 15+ |

---

## 향후 고려 (TBD)

- 프로덕션 배포 시 Vite dev server 대신 정적 빌드 + Nginx 서빙, 리버스 프록시로 8080 은닉.
- DB 접속정보/시크릿 관리 방식 정립 (현재 평문 `.env`).
