# Backend API / Database Specification

## 기술 스택
- Python 3.12+
- FastAPI
- SQLAlchemy 2.0 (ORM)
- Pydantic v2 (유효성 검사 + 스키마)
- SQLite (추후 PostgreSQL 전환 가능)
- Uvicorn (ASGI 서버)

---

## 데이터베이스 설계

### ERD

```
Category (1) ──── (N) Task
```

### Category 테이블

```sql
CREATE TABLE category (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       VARCHAR(50)  NOT NULL UNIQUE,
    color      VARCHAR(20)  NOT NULL DEFAULT '#6B7280',
    sort_order INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Task 테이블

```sql
CREATE TABLE task (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_date   DATE         NOT NULL,
    category_id INTEGER      NOT NULL REFERENCES category(id),
    title       VARCHAR(200) NOT NULL,
    completed   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_date ON task(task_date);
CREATE INDEX idx_task_category ON task(category_id);
```

**기본 데이터 (초기 seed)**
```
회의      → #3B82F6 (Blue)
교육      → #10B981 (Green)
고객지원  → #F59E0B (Amber)
문서작성  → #8B5CF6 (Purple)
개인      → #6B7280 (Gray)
```

---

## PostgreSQL 전환 방법

`.env`에서 아래 항목만 교체:

```env
# SQLite (현재)
DATABASE_URL=sqlite:///./data/todo.db

# PostgreSQL (전환 시)
DATABASE_URL=postgresql://user:password@localhost:5432/todo
```

---

## API 설계

### 공통 응답 형식

**성공**
```json
{
  "success": true,
  "data": { ... },
  "message": null
}
```

**실패**
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지"
}
```

---

### Task API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/tasks?year=2025&month=6` | 월별 업무 목록 |
| POST | `/api/v1/tasks` | 업무 추가 |
| PUT | `/api/v1/tasks/{id}` | 업무 수정 |
| PATCH | `/api/v1/tasks/{id}/complete` | 완료 상태 토글 |
| DELETE | `/api/v1/tasks/{id}` | 업무 삭제 |

#### GET `/api/v1/tasks`
**Query Parameters**: `year` (int, 필수), `month` (int, 필수)

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_date": "2025-06-02",
      "category_id": 1,
      "category_name": "회의",
      "category_color": "#3B82F6",
      "title": "주간 팀 미팅",
      "completed": true,
      "created_at": "2025-06-01T09:00:00",
      "updated_at": "2025-06-02T10:00:00"
    }
  ]
}
```

#### POST `/api/v1/tasks`
```json
{ "task_date": "2025-06-02", "category_id": 1, "title": "주간 팀 미팅" }
```

#### PUT `/api/v1/tasks/{id}`
```json
{ "task_date": "2025-06-02", "category_id": 2, "title": "수정된 할 일" }
```

#### PATCH `/api/v1/tasks/{id}/complete`
→ 완료/미완료 토글, 수정된 Task 반환

#### DELETE `/api/v1/tasks/{id}`
→ HTTP 204 No Content

---

### Category API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/categories` | 전체 목록 (sort_order 오름차순) |
| POST | `/api/v1/categories` | 추가 |
| PUT | `/api/v1/categories/{id}` | 수정 |
| DELETE | `/api/v1/categories/{id}` | 삭제 (Task 참조 시 409) |

---

## 패키지 구조

```
backend/
├── app/
│   ├── main.py              # FastAPI 앱, CORS, 라우터 등록
│   ├── database.py          # SQLAlchemy 엔진, 세션
│   ├── config.py            # 환경변수 설정
│   ├── seed.py              # 기본 Category 초기 데이터
│   ├── models/
│   │   ├── category.py      # Category ORM 모델
│   │   └── task.py          # Task ORM 모델
│   ├── schemas/
│   │   ├── common.py        # ApiResponse 공통 스키마
│   │   ├── category.py      # Category Pydantic 스키마
│   │   └── task.py          # Task Pydantic 스키마
│   ├── routers/
│   │   ├── tasks.py         # Task API 라우터
│   │   └── categories.py    # Category API 라우터
│   └── services/
│       ├── task_service.py      # Task 비즈니스 로직
│       └── category_service.py  # Category 비즈니스 로직
├── requirements.txt
└── .env
```

---

## .env 구성

```env
DATABASE_URL=sqlite:///./data/todo.db
ALLOWED_ORIGINS=http://localhost:5173
```
