# Business Logic & Feature Definitions

---

## 1. 월별 업무 조회

### Backend
```
입력: year(int), month(int)
처리: task_date BETWEEN 해당월 1일 AND 말일
정렬: task_date ASC, id ASC (같은 날짜 내 등록 순)
출력: TaskResponse 리스트
```

```java
// TaskRepository
List<Task> findByTaskDateBetweenOrderByTaskDateAscIdAsc(
    LocalDate startDate, LocalDate endDate
);

// TaskService
LocalDate start = LocalDate.of(year, month, 1);
LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());
```

### Frontend
- URL query param `?year=YYYY&month=M` 으로 상태 관리
- 페이지 마운트 시 또는 년/월 변경 시 API 호출
- 이전달: month - 1 (1월이면 전년 12월)
- 다음달: month + 1 (12월이면 다음년 1월)

---

## 2. 완료율 계산

```
완료율(%) = Math.round((완료 수 / 전체 수) * 100)
전체 수가 0이면 완료율 = 0 (0 나누기 방지)
```

```typescript
// utils/statsUtils.ts
export const calcCompletionRate = (total: number, completed: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};
```

---

## 3. 요일 자동 계산

```typescript
// utils/dateUtils.ts
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const getDayLabel = (dateStr: string): string => {
  return DAY_LABELS[dayjs(dateStr).day()];
};

export const getDayColor = (dateStr: string): string => {
  const day = dayjs(dateStr).day();
  if (day === 0) return '#EF4444'; // 일요일
  if (day === 6) return '#3B82F6'; // 토요일
  return 'inherit';
};
```

---

## 4. 테이블 날짜 행 병합 (rowSpan)

같은 날짜의 첫 번째 행에만 날짜 셀을 렌더링하고, 이후 행은 날짜 셀을 생략합니다.

```typescript
// utils/tableUtils.ts
export const calcRowSpans = (tasks: Task[]): Map<number, number> => {
  const spanMap = new Map<number, number>(); // taskId → rowSpan 값 (0이면 셀 미렌더링)
  const dateCount: Record<string, number[]> = {};

  tasks.forEach((task) => {
    if (!dateCount[task.taskDate]) dateCount[task.taskDate] = [];
    dateCount[task.taskDate].push(task.id);
  });

  Object.values(dateCount).forEach((ids) => {
    ids.forEach((id, index) => {
      spanMap.set(id, index === 0 ? ids.length : 0);
    });
  });

  return spanMap;
};
```

렌더링 시: `spanMap.get(task.id) === 0` 이면 날짜/요일 셀 미렌더링.

---

## 5. 클라이언트 필터링

월별 전체 데이터를 로드 후 프론트에서 필터 적용 (검색은 서버 왕복 없이 즉각 반응).

```typescript
// hooks/useFilter.ts
export const applyFilters = (
  tasks: Task[],
  filters: FilterState
): Task[] => {
  return tasks.filter((task) => {
    // 검색어: title에 포함 여부 (대소문자 무시)
    if (filters.keyword) {
      if (!task.title.toLowerCase().includes(filters.keyword.toLowerCase())) {
        return false;
      }
    }
    // 업무구분 필터
    if (filters.categoryId !== null) {
      if (task.categoryId !== filters.categoryId) return false;
    }
    // 완료 상태 필터
    if (filters.completionStatus === 'completed' && !task.completed) return false;
    if (filters.completionStatus === 'incomplete' && task.completed) return false;
    // 오늘만 보기
    if (filters.todayOnly) {
      const today = dayjs().format('YYYY-MM-DD');
      if (task.taskDate !== today) return false;
    }
    return true;
  });
};
```

---

## 6. 완료 상태 토글 (낙관적 업데이트)

UI 즉시 반영 → API 호출 → 실패 시 롤백.

```typescript
// hooks/useTask.ts
const toggleComplete = async (taskId: number) => {
  // 1. 로컬 상태 즉시 반전
  setTasks((prev) =>
    prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
  );
  try {
    // 2. API 호출
    await taskApi.toggleComplete(taskId);
  } catch {
    // 3. 실패 시 원복
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  }
};
```

---

## 7. Category 삭제 시 참조 Task 확인

```java
// CategoryService.java
public void deleteCategory(Long categoryId) {
    long taskCount = taskRepository.countByCategoryId(categoryId);
    if (taskCount > 0) {
        throw new CategoryInUseException(
            "해당 업무구분을 사용하는 업무가 " + taskCount + "건 존재합니다."
        );
    }
    categoryRepository.deleteById(categoryId);
}
```

- HTTP 409 Conflict 응답
- 프론트에서 "X건의 업무가 있어 삭제할 수 없습니다" 메시지 표시

---

## 8. 업무구분 추가 → 드롭다운 자동 반영

```typescript
// Category 추가 성공 후
const handleCategoryCreate = async (req: CategoryRequest) => {
  const newCategory = await categoryApi.create(req);
  setCategories((prev) => [...prev, newCategory]); // 전역 상태 즉시 반영
};
```

Category 목록은 앱 최상위(`App.tsx`)에서 로드 후 Context로 공유
→ 어디서든 추가/수정/삭제 시 드롭다운에 즉시 반영

---

## 9. 기본 Category Seed 데이터

```java
// DataInitializer.java  (@Component + CommandLineRunner)
// DB에 Category가 하나도 없을 때만 실행
if (categoryRepository.count() == 0) {
    List<Category> defaults = List.of(
        new Category("회의",     "#3B82F6", 1),
        new Category("교육",     "#10B981", 2),
        new Category("고객지원", "#F59E0B", 3),
        new Category("문서작성", "#8B5CF6", 4),
        new Category("개인",     "#6B7280", 5)
    );
    categoryRepository.saveAll(defaults);
}
```

---

## 10. 에러 처리 정책

| 상황 | Backend | Frontend |
|------|---------|----------|
| Task 없음 | 404 Not Found | "업무를 찾을 수 없습니다" toast |
| Category 삭제 시 Task 존재 | 409 Conflict | "X건의 업무가 있어 삭제할 수 없습니다" toast |
| 유효성 검사 실패 | 400 Bad Request + 필드별 메시지 | 입력 필드 하단 에러 텍스트 |
| 서버 오류 | 500 Internal Server Error | "서버 오류가 발생했습니다" toast |
| 네트워크 오류 | - | "연결을 확인해주세요" toast |

```typescript
// api/apiClient.ts - axios interceptor
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message ?? '서버 오류가 발생했습니다';
    showToast(message, 'error');
    return Promise.reject(error);
  }
);
```
