# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

엑셀로 관리하던 월별 업무 To-Do를 웹으로 전환한 **개인 업무 관리 시스템**.
월별 업무 등록/수정/완료 관리, 업무구분·세분류별 통계 대시보드, 드래그 정렬을 제공한다.

- 인증 없는 단일 사용자용 앱 (사내 네트워크 공유). 상세는 `auth.md` 참조.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite + Material UI v5 |
| Backend | Python 3.9 + FastAPI + SQLAlchemy 2.0 + Pydantic v2 |
| Database | PostgreSQL 15+ (`todo_db`) |
| 통신 | REST API (`/api/v1/`), Vite dev proxy로 `/api` → 백엔드 |

---

## 디렉토리 구조

```
to_do/
├── frontend/                # React + TypeScript + Vite
│   └── src/
│       ├── api/             # axios API 클라이언트 (apiClient, taskApi, categoryApi)
│       ├── components/      # task/, category/, common/ UI 컴포넌트
│       ├── hooks/           # useTask, useCategory, useFilter
│       ├── pages/           # MainPage, DashboardPage, SettingsPage
│       ├── types/           # TypeScript 인터페이스
│       └── utils/           # dateUtils, statsUtils
├── backend/                 # FastAPI
│   └── app/
│       ├── main.py          # 앱 진입점, CORS, 라우터 등록, 컬럼 마이그레이션
│       ├── database.py      # SQLAlchemy 엔진/세션
│       ├── config.py        # 환경변수 (.env)
│       ├── seed.py          # 기본 Category 5개 초기 데이터
│       ├── models/          # Category, Task ORM 모델
│       ├── schemas/         # Pydantic 요청/응답 스키마 (common, task, category)
│       ├── routers/         # tasks, categories API 라우터
│       └── services/        # task_service, category_service 비즈니스 로직
├── logs/                    # 서버 로그 (start.sh 기동 시 생성)
├── start.sh / stop.sh       # 서비스 일괄 실행/종료
├── setup.sh                 # 다른 PC 환경 설정 자동화
└── *.md                     # 문서 (아래 표 참조)
```

---

## 빠른 실행

```bash
./start.sh      # 백엔드(8090) + 프론트엔드(5173) 백그라운드 기동
./stop.sh       # 종료
```

- Frontend: http://localhost:5173
- Backend API 문서: http://localhost:8090/docs
- 상세 실행/배포는 `deploy.md`, 포트/구성은 `infra.md` 참조.

---

## API 규칙

- Prefix: `/api/v1/`
- 공통 응답: `{ success, data, message }` (`schemas/common.py`의 `ApiResponse`)
- 완료 토글: `PATCH /api/v1/tasks/{id}/complete`
- Category 삭제 시 참조 Task 있으면 `409 Conflict`
- 전체 엔드포인트는 `backend.md` 참조.

---

## 문서 맵

| 파일 | 내용 |
|------|------|
| `CLAUDE.md` | 전체 아키텍처/개요 (이 파일) |
| `front.md` | 프론트엔드 UI/UX 명세 |
| `backend.md` | 백엔드 API 명세 |
| `function.md` | 비즈니스 로직/기능 정의 |
| `auth.md` | 권한·계정 관리 (현재 미구현, 스텁) |
| `deploy.md` | 빌드·배포·실행 방법 |
| `infra.md` | 포트·서비스 구성 |
| `db.md` | 테이블/ERD/컬럼/인덱스/관계 |
| `logs.md` | 서버 로그 |
