# Frontend UI/UX Specification

## 기술 스택

- React 18 + TypeScript + Vite
- Material UI (MUI) v5 + `@mui/x-date-pickers` (Day.js 어댑터)
- React Router v6
- Axios (`/api` prefix, Vite proxy → 백엔드 8090)
- `@dnd-kit` (드래그 앤 드롭 정렬)
- Recharts (대시보드 도넛 차트)

---

## 라우팅

| Path | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | `MainPage` | 월별 업무 목록/필터/통계 |
| `/dashboard` | `DashboardPage` | 업무구분·세분류별 완료율 대시보드 |
| `/settings/categories` | `SettingsPage` | 업무구분 관리 |
| `*` | → `/` 리다이렉트 | |

모든 라우트는 `AppLayout`(좌측 사이드바 + 메인 영역) 하위에 중첩.

---

## 1. 메인 페이지 (`/`)

### 1-1. 헤더 (년월 이동 + 통계)
- 년/월 `Select` 드롭다운 (연도: 현재-4 ~ +5, 월: 1~12). 변경 시 URL `?year=&month=` 갱신.
- 통계 Chip: 전체 / 완료 / 완료율(%), 완료율 `LinearProgress` 바.
- `업무 추가 +` 버튼 → 등록 Modal.

### 1-2. 필터 바
| 요소 | 설명 |
|------|------|
| 검색창 | `title` 부분일치 (대소문자 무시, 프론트 필터) |
| 업무구분 드롭다운 | 전체 / 각 Category |
| 완료상태 드롭다운 | 전체 / 완료 / 미완료 |
| 오늘만 체크박스 | 오늘 날짜 업무만 |

### 1-3. 업무 테이블 (`TaskTable`)
```
┌────┬───────┬────┬──────────┬─────────┬──────────────┬──────┬───┐
│ ⠿ │ 날짜  │요일│ 업무구분 │ 세분류  │    할 일     │ 완료 │ ⋮ │
├────┼───────┼────┼──────────┼─────────┼──────────────┼──────┼───┤
│ ⠿ │ 08/12 │ 수 │ [회의]   │ AI센터  │ 시너지어스… │  ☑  │ ⋮ │
└────┴───────┴────┴──────────┴─────────┴──────────────┴──────┴───┘
```
| 컬럼 | 설명 |
|------|------|
| 드래그 핸들 | `@dnd-kit`으로 행 순서 변경 → `PUT /tasks/reorder` |
| 날짜/요일 | 같은 날짜 그룹의 **첫 행에만** 표시. 토=파랑, 일=빨강 |
| 업무구분 | Category name + color Chip |
| 세분류 | `sub_category` 텍스트 |
| 할 일 | 완료 시 취소선. 클릭 시 수정 Modal |
| 완료 | 체크박스, 클릭 즉시 반영(낙관적 업데이트) |
| ⋮ | 삭제 메뉴 |

---

## 2. 업무 추가/수정 Modal (`TaskFormModal`)

| 필드 | 유효성 |
|------|--------|
| 날짜 * | 필수, MUI DatePicker |
| 업무구분 * | 필수, color dot + name 드롭다운 |
| 세분류 * | 필수, `Autocomplete`(freeSolo) — 직접 입력 또는 기존 목록 선택, 목록 항목 개별 삭제 가능 |
| 할 일 * | 필수, 최대 200자, Enter 제출 |
| 메모 | 선택, 최대 1000자, multiline |

- 수정 모드: 기존 값 pre-fill, 버튼 "수정".
- 제출 중복 방지(`submitting` 가드).

---

## 3. 대시보드 (`/dashboard`, `DashboardPage`)

- 월 이동(`< >`) + 상단 통계 Chip.
- **도넛 차트**(Recharts): 업무구분별 업무 수 비중, 중앙에 전체 완료율(%).
  - 조각 클릭 → 우측 패널에 해당 구분의 **세분류별 완료율** 표시.
- 좌측 범례: 업무구분별 완료율 `LinearProgress` (구분 색상 적용).
- 데이터 없으면 "이 달에 등록된 업무가 없습니다." 안내.

---

## 4. 설정 (`/settings/categories`, `CategoryManager`)

- 업무구분 목록(색상 dot + 이름 + HEX Chip), `@dnd-kit` 드래그 순서 변경.
- `+ 구분 추가` / 행별 수정·삭제.
- 삭제 시 참조 업무가 있으면 서버 `409` → 다이얼로그에 에러 메시지 표시.
- 추가/수정 Modal(`CategoryFormModal`): 이름(최대 50자) + 프리셋 색상 10종 선택.

---

## 컴포넌트 트리

```
App (Theme, LocalizationProvider, Router)
└── AppLayout (좌측 Drawer 네비 + main Outlet)
    ├── MainPage
    │   ├── (헤더/필터 바 인라인)
    │   ├── TaskTable → SortableTaskRow
    │   └── TaskFormModal
    ├── DashboardPage (도넛 차트 + 세분류 패널)
    └── SettingsPage
        └── CategoryManager
            ├── SortableCategoryRow
            └── CategoryFormModal
```

---

## 상태 관리

| 상태 | 위치 | 설명 |
|------|------|------|
| 현재 년/월 | URL query param | 새로고침·페이지 이동 시 유지 |
| 필터 | `useFilter` (로컬) | 검색어/구분/완료상태/오늘만 |
| Task 목록 | `useTask` (서버 상태) | 월별 fetch + 낙관적 업데이트 |
| Category 목록 | `useCategory` (서버 상태) | 마운트 시 fetch |
| 세분류 옵션 | `MainPage` 로컬 state | `/tasks/sub-categories` |

> 전역 스토어(Redux 등) 없이 hook 단위로 서버 상태를 관리한다. Category는 페이지별 hook에서 개별 fetch.

---

## 스타일 가이드

| 항목 | 값 |
|------|----|
| Primary | `#2563EB` |
| 배경 | `#F8FAFC` |
| 사이드바 배경 | `#1E293B` |
| 테이블 hover | `#F8FAFC` |
| 완료 텍스트 | `#94A3B8` + 취소선 |
| 토요일 | `#3B82F6` / 일요일 `#EF4444` |
| 카드 테두리 | `1px solid #E2E8F0`, radius 2 |
| 폰트 | MUI 기본(Roboto), 버튼 `textTransform: none` |
