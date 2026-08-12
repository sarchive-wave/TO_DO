# Business Logic & Feature Definitions

현재 코드(`backend/app`, `frontend/src`) 기준 핵심 비즈니스 로직 정의.

---

## 1. 월별 업무 조회

**Backend** (`task_service.get_tasks_by_month`)
```
입력: year(int), month(int)
범위: task_date BETWEEN (해당월 1일) AND (해당월 말일)
      말일 = calendar.monthrange(year, month)[1]
정렬: task_date DESC, sort_order ASC NULLS LAST, id ASC
출력: TaskResponse 리스트 (category name/color 조인 포함)
```

**Frontend** (`MainPage`, `useTask`)
- URL query `?year=&month=`로 상태 유지, 값 변경 시 `fetchTasks` 호출.
- 대시보드도 동일 파라미터를 공유.

---

## 2. 완료율 계산 (`utils/statsUtils.ts`)

```
완료율(%) = total === 0 ? 0 : Math.round(completed / total * 100)
```
- 메인 상단 통계, 대시보드 전체/구분/세분류 완료율에 동일 공식 적용.

---

## 3. 요일 자동 계산 (`utils/dateUtils.ts`)

```
DAY_LABELS = ['일','월','화','수','목','금','토']
getDayLabel(date) = DAY_LABELS[dayjs(date).day()]
getDayColor(date) = 일요일 '#EF4444' / 토요일 '#3B82F6' / 그 외 'inherit'
formatDate(date)  = 'MM/DD'
```

---

## 4. 날짜 그룹핑 (테이블)

`TaskTable`은 정렬된 목록에서 인접 행의 `task_date`를 비교해 **그룹의 첫 행**에만 날짜/요일을 렌더링한다.
```
isFirst = idx === 0 || tasks[idx-1].task_date !== task.task_date
isLast  = idx === last || tasks[idx+1].task_date !== task.task_date
```
그룹 첫 행 상단에 구분선을 그어 날짜 단위 시각 구분. (과거 rowSpan 방식은 폐기됨)

---

## 5. 드래그 정렬 (reorder)

**Frontend** (`@dnd-kit`)
- `TaskTable` / `CategoryManager`에서 드래그 종료 시 `arrayMove`로 새 순서 계산.
- 낙관적으로 로컬 순서를 즉시 반영한 뒤 API 호출.

**Backend**
- `PUT /tasks/reorder`, `PUT /categories/reorder`: 전달된 `ids` 순서대로 `sort_order`를 1부터 재할당.

---

## 6. 클라이언트 필터링 (`hooks/useFilter.ts`)

월별 전체 데이터를 로드한 뒤 프론트에서 `useMemo`로 필터 (서버 왕복 없음).
```
keyword          → title 부분일치(소문자 비교)
categoryId       → category_id 일치
completionStatus → completed / incomplete
todayOnly        → task_date === 오늘(YYYY-MM-DD)
```

---

## 7. 완료 토글 (낙관적 업데이트, `hooks/useTask.ts`)

```
1) 로컬 completed 즉시 반전
2) PATCH /tasks/{id}/complete 호출
3) 실패 시 상태 원복(롤백)
```

---

## 8. 세분류(sub_category) 관리

- 자유 입력값이며 `TaskFormModal`의 `Autocomplete`(freeSolo)로 입력/선택.
- 옵션 목록 = `GET /tasks/sub-categories` (사용 중인 값 distinct + 정렬).
- 자동완성 항목 옆 X → `DELETE /tasks/sub-categories/{name}`: 해당 값을 쓰는 task들의 `sub_category`를 NULL로 만들어 목록에서 제거.
- 업무 저장 후 옵션 목록을 재조회하여 신규 세분류를 즉시 반영.

---

## 9. Category 삭제 가드

**Backend** (`category_service.delete_category`)
```
참조 task_count = SELECT count(*) FROM task WHERE category_id = ?
count > 0 → CategoryInUseError → HTTP 409
count == 0 → 삭제
```
**Frontend**: 409 응답의 `detail` 메시지를 삭제 다이얼로그 Alert로 표시.

---

## 10. 기본 Category Seed (`seed.py`)

앱 startup 시 category가 0건이면 회의/교육/고객지원/문서작성/개인 5개를 삽입 (색상·순서는 `db.md` 참조).

---

## 11. 컬럼 자동 마이그레이션 (`main.py::_run_migrations`)

기존 task 테이블에 `sub_category` / `sort_order` / `memo` 컬럼이 없으면 `ALTER TABLE ADD COLUMN`으로 안전 추가. 앱 기동 시 1회 수행.

---

## 12. 에러 처리 정책

| 상황 | Backend | Frontend |
|------|---------|----------|
| Task 없음 | 404 | 요청 실패 처리 |
| Category 이름 중복 | 400 | 폼 Alert 메시지 |
| Category 삭제 시 참조 존재 | 409 | 삭제 다이얼로그 Alert |
| 요청 유효성 실패 | 422 | 필드 하단 helperText |
| 서버 오류 | 500 (공통 JSON) | 실패 처리 |

> 요청 유효성은 프론트(`TaskFormModal.validate`, `CategoryFormModal`)에서 1차 검사 후 서버 Pydantic이 2차 검사.
