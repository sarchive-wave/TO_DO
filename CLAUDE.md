# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

엑셀로 관리하던 월별 업무 To-Do를 웹으로 전환한 개인 업무 관리 시스템.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite + Material UI v5 |
| Backend | Python 3.9+ + FastAPI + SQLAlchemy 2.0 |
| Database | SQLite (추후 PostgreSQL 전환 가능, `.env`만 수정) |
| 통신 | REST API (`/api/v1/`) |

---

## 디렉토리 구조

```
to_do/
├── frontend/                # React + TypeScript + Vite
│   └── src/
│       ├── api/             # axios API 호출
│       ├── components/      # 재사용 UI 컴포넌트
│       ├── hooks/           # useTask, useCategory, useFilter
│       ├── pages/           # MainPage, SettingsPage
│       ├── types/           # TypeScript 인터페이스
│       └── utils/           # 날짜, 요일, 완료율 계산
├── backend/                 # FastAPI
│   └── app/
│       ├── main.py          # 앱 진입점, CORS, 라우터 등록
│       ├── database.py      # SQLAlchemy 엔진 및 세션
│       ├── config.py        # 환경변수 (.env)
│       ├── seed.py          # 기본 Category 5개 초기 데이터
│       ├── models/          # SQLAlchemy ORM 모델
│       ├── schemas/         # Pydantic 요청/응답 스키마
│       ├── routers/         # API 엔드포인트
│       └── services/        # 비즈니스 로직
├── CLAUDE.md                # 전체 아키텍처 (이 파일)
├── front.md                 # Frontend UI/UX 명세
├── backend.md               # Backend API/DB 명세
└── function.md              # 비즈니스 로직 정의
```

---

## 실행 명령어

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

- API 문서: http://localhost:8080/docs
- DB 파일: `backend/data/todo.db` (자동 생성)

### Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
npm run build                   # 프로덕션 빌드
```

---

## 포트

| 서비스 | 포트 |
|--------|------|
| Frontend (Vite) | 5173 |
| Backend (FastAPI) | 8080 |

---

## API 규칙

- Prefix: `/api/v1/`
- 공통 응답: `{ success, data, message }`
- 완료 토글: `PATCH /api/v1/tasks/{id}/complete`
- Category 삭제 시 Task 참조 있으면 `409 Conflict`

---

## DB 전환 (SQLite → PostgreSQL)

`backend/.env` 한 줄만 변경:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/todo
```

---

## 명세 파일 참조

| 파일 | 내용 |
|------|------|
| `front.md` | 화면 레이아웃, 컴포넌트 구조, 스타일 가이드 |
| `backend.md` | DB 스키마, API 엔드포인트 전체 목록 |
| `function.md` | rowSpan 계산, 낙관적 업데이트, 필터링 로직 |
