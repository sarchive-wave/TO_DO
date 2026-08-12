# Backend API Specification

> 데이터베이스 설계(테이블/ERD/컬럼/인덱스/관계)는 `db.md`에서 관리한다. 이 문서는 **API 명세만** 다룬다.

## 기술 스택

- Python 3.9
- FastAPI 0.111 / Uvicorn 0.29 (ASGI)
- SQLAlchemy 2.0 (ORM, `Mapped` 스타일)
- Pydantic v2 + pydantic-settings (유효성 검사/환경설정)
- PostgreSQL (psycopg2-binary)

---

## 패키지 구조

```
backend/app/
├── main.py              # FastAPI 앱, CORS, 라우터 등록, 컬럼 마이그레이션, 예외 핸들러
├── database.py          # SQLAlchemy 엔진, 세션, get_db 의존성
├── config.py            # .env 환경변수 (database_url, allowed_origins)
├── seed.py              # 기본 Category 5개 초기 데이터
├── models/
│   ├── category.py      # Category ORM
│   └── task.py          # Task ORM
├── schemas/
│   ├── common.py        # ApiResponse[T] 공통 스키마 (ok)
│   ├── category.py      # CategoryRequest / CategoryReorderRequest / CategoryResponse
│   └── task.py          # TaskCreateRequest / TaskUpdateRequest / TaskReorderRequest / TaskResponse
├── routers/
│   ├── tasks.py         # Task API
│   └── categories.py    # Category API
└── services/
    ├── task_service.py      # Task 비즈니스 로직
    └── category_service.py  # Category 비즈니스 로직
```

---

## 공통 응답 형식

성공 (`ApiResponse.ok`):
```json
{ "success": true, "data": { }, "message": null }
```

실패 (전역 예외 핸들러, `main.py`):
```json
{ "success": false, "data": null, "message": "서버 오류가 발생했습니다." }
```

- 도메인 에러는 `HTTPException`으로 상태코드 + `detail` 반환 (예: 404, 409).
- 일부 엔드포인트(`DELETE`)는 `204 No Content`로 본문 없음.

---

## Task API

| Method | Endpoint | 설명 | 성공 코드 |
|--------|----------|------|-----------|
| GET | `/api/v1/tasks?year={y}&month={m}` | 월별 업무 목록 | 200 |
| POST | `/api/v1/tasks` | 업무 추가 | 201 |
| GET | `/api/v1/tasks/sub-categories` | 세분류 목록 (distinct, 정렬) | 200 |
| DELETE | `/api/v1/tasks/sub-categories/{name}` | 세분류 일괄 해제(해당 값을 NULL로) | 200 |
| PUT | `/api/v1/tasks/reorder` | 표시 순서 재정렬 | 200 |
| PUT | `/api/v1/tasks/{id}` | 업무 수정 | 200 |
| PATCH | `/api/v1/tasks/{id}/complete` | 완료 상태 토글 | 200 |
| DELETE | `/api/v1/tasks/{id}` | 업무 삭제 | 204 |

> 라우트 순서 주의: `/reorder`, `/sub-categories`는 `/{id}`보다 **먼저** 선언되어야 경로 충돌이 없다 (현재 `tasks.py`에 반영됨).

### GET `/api/v1/tasks`
- Query: `year` (int, 필수), `month` (int, 필수)
- 정렬: `task_date DESC, sort_order ASC NULLS LAST, id ASC`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_date": "2026-08-12",
      "category_id": 1,
      "category_name": "회의",
      "category_color": "#3B82F6",
      "sub_category": "AI ECO 센터",
      "title": "14시 시너지어스 미팅",
      "completed": true,
      "memo": null,
      "created_at": "2026-08-12T13:10:27",
      "updated_at": "2026-08-12T13:10:27"
    }
  ],
  "message": null
}
```

### POST `/api/v1/tasks`
```json
{
  "task_date": "2026-08-12",
  "category_id": 1,
  "sub_category": "AI ECO 센터",
  "title": "14시 시너지어스 미팅",
  "memo": "회의실 3층"
}
```
- `sub_category`, `memo`는 선택. 존재하지 않는 `category_id` → `404`.

### PUT `/api/v1/tasks/reorder`
```json
{ "ids": [12, 8, 5, 3] }
```
- 전달된 순서대로 `sort_order`를 1부터 재할당.

### PUT `/api/v1/tasks/{id}`
- POST와 동일한 바디. 없는 task → `404`, 없는 category → `404`.

### PATCH `/api/v1/tasks/{id}/complete`
- 완료/미완료 토글, 수정된 Task 반환. 없는 task → `404`.

### DELETE `/api/v1/tasks/{id}` → `204`

### GET `/api/v1/tasks/sub-categories`
- 사용 중인 세분류 문자열 목록 (중복 제거 + 오름차순).

### DELETE `/api/v1/tasks/sub-categories/{name}`
- 해당 세분류를 쓰는 모든 task의 `sub_category`를 `NULL`로 설정 (자동완성 목록에서 제거 용도).

---

## Category API

| Method | Endpoint | 설명 | 성공 코드 |
|--------|----------|------|-----------|
| GET | `/api/v1/categories` | 전체 목록 (sort_order 오름차순) | 200 |
| POST | `/api/v1/categories` | 추가 | 201 |
| PUT | `/api/v1/categories/reorder` | 순서 재정렬 | 200 |
| PUT | `/api/v1/categories/{id}` | 수정 | 200 |
| DELETE | `/api/v1/categories/{id}` | 삭제 | 204 |

### POST / PUT `/api/v1/categories`
```json
{ "name": "회의", "color": "#3B82F6", "sort_order": 1 }
```
- `sort_order` 생략 시 서버가 마지막 순서로 자동 부여.
- 이름 중복 → `400 Bad Request`.

### PUT `/api/v1/categories/reorder`
```json
{ "ids": [5, 1, 6, 9] }
```

### DELETE `/api/v1/categories/{id}`
- 없는 category → `404`.
- 참조하는 Task가 1건 이상이면 → `409 Conflict` ("해당 업무구분을 사용하는 업무가 N건 존재합니다.").

---

## 기타 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 헬스체크 `{ "status": "ok" }` |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |

---

## 에러 코드 정책

| 상황 | 상태코드 |
|------|----------|
| 리소스 없음 (task/category) | 404 Not Found |
| 이름 중복 (category) | 400 Bad Request |
| 참조 존재 상태의 category 삭제 | 409 Conflict |
| 요청 바디 유효성 실패 | 422 Unprocessable Entity (FastAPI 기본) |
| 처리되지 않은 서버 오류 | 500 (공통 JSON 응답) |
