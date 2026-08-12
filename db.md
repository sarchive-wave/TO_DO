# Database Specification

DB의 단일 원천(single source of truth). 테이블/ERD/컬럼/인덱스/관계를 여기서만 관리한다.

## 개요

| 항목 | 값 |
|------|-----|
| DBMS | PostgreSQL 15+ |
| Database | `todo_db` |
| 사용자 | `sarchive` |
| 호스트/포트 | `localhost:5432` (네트워크 공유 시 `192.168.2.126:5432`) |
| 접속 URL | `postgresql://sarchive:todo1234@localhost:5432/todo_db` |
| 테이블 | `category`, `task` (2개) |

> 스키마는 SQLAlchemy 모델에서 자동 생성(`Base.metadata.create_all`)되며,
> 신규 컬럼은 `main.py`의 `_run_migrations()`가 `ALTER TABLE ADD COLUMN`으로 안전 추가한다.

---

## ERD

```
┌──────────────────┐          ┌────────────────────────────┐
│     category     │ 1      N │            task            │
│──────────────────│──────────│────────────────────────────│
│ id (PK)          │◄─────────│ category_id (FK, NOT NULL) │
│ name (UNIQUE)    │          │ id (PK)                    │
│ color            │          │ task_date                  │
│ sort_order       │          │ sub_category (nullable)    │
│ created_at       │          │ title                      │
│ updated_at       │          │ completed                  │
└──────────────────┘          │ sort_order (nullable)      │
                              │ memo (nullable)            │
                              │ created_at / updated_at    │
                              └────────────────────────────┘
```

- 관계: `category (1) ── (N) task`, ON DELETE 제약 없음.
  애플리케이션 레벨에서 참조 task가 있으면 category 삭제를 막는다(409). `db.md` → `backend.md` DELETE 정책 참조.

---

## category 테이블

| 컬럼 | 타입 | NULL | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NOT NULL | `nextval(category_id_seq)` | PK, auto-increment |
| name | varchar(50) | NOT NULL | | **UNIQUE** |
| color | varchar(20) | NOT NULL | `'#6B7280'` | HEX 색상코드 |
| sort_order | integer | NOT NULL | `0` | 표시 순서 (오름차순) |
| created_at | timestamp | NOT NULL | `now()` | |
| updated_at | timestamp | NOT NULL | `now()` | onupdate 시 갱신 |

**인덱스/제약**
- `category_pkey` PRIMARY KEY (id)
- `category_name_key` UNIQUE (name)

---

## task 테이블

| 컬럼 | 타입 | NULL | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NOT NULL | `nextval(task_id_seq)` | PK, auto-increment |
| task_date | date | NOT NULL | | 업무 날짜 |
| category_id | integer | NOT NULL | | FK → category(id) |
| sub_category | varchar(100) | NULL | | 세분류(자유 입력·자동완성) |
| title | varchar(200) | NOT NULL | | 할 일 |
| completed | boolean | NOT NULL | `false` | 완료 여부 |
| sort_order | integer | NULL | | 드래그 정렬 순서(재정렬 시에만 채워짐) |
| memo | varchar(1000) | NULL | | 메모 |
| created_at | timestamp | NOT NULL | `now()` | |
| updated_at | timestamp | NOT NULL | `now()` | onupdate 시 갱신 |

**인덱스/제약**
- `task_pkey` PRIMARY KEY (id)
- `idx_task_date` btree (task_date)
- `idx_task_category_id` btree (category_id)
- `task_category_id_fkey` FOREIGN KEY (category_id) → category(id)

**조회 정렬 기준** (`get_tasks_by_month`)
```
task_date DESC, sort_order ASC NULLS LAST, id ASC
```

---

## 초기 데이터 (seed)

`seed.py` — category가 0건일 때만 아래 5개를 삽입한다.

| name | color | sort_order |
|------|-------|-----------|
| 회의 | #3B82F6 | 1 |
| 교육 | #10B981 | 2 |
| 고객지원 | #F59E0B | 3 |
| 문서작성 | #8B5CF6 | 4 |
| 개인 | #6B7280 | 5 |

> 운영 DB에서는 사용자가 카테고리를 추가/수정하여 실제 목록이 seed와 다를 수 있다.

---

## 마이그레이션 정책

- ORM 모델 기준 신규 테이블은 `create_all`로 자동 생성.
- 기존 테이블에 컬럼 추가가 필요하면 `main.py::_run_migrations()`에 조건부 `ALTER TABLE ADD COLUMN`을 추가한다.
  현재 대상: `sub_category`, `sort_order`, `memo`.
- 컬럼 삭제/타입 변경 등 파괴적 변경은 자동화하지 않으며 수동 SQL로 처리한다.

---

## 참고 쿼리

```sql
-- 월별 업무 수 / 완료 수
SELECT count(*) AS total, count(*) FILTER (WHERE completed) AS completed
FROM task
WHERE task_date BETWEEN '2026-08-01' AND '2026-08-31';

-- 카테고리별 통계
SELECT c.name, count(t.id) AS total, count(t.id) FILTER (WHERE t.completed) AS done
FROM category c LEFT JOIN task t ON t.category_id = c.id
GROUP BY c.id ORDER BY c.sort_order;
```
