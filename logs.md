# Logs

서비스 기동 시 남기는 서버 로그 정의.

## 위치

`start.sh` 기동 시 프로젝트 루트 `logs/`에 기록된다.

| 파일 | 내용 |
|------|------|
| `logs/backend.log` | 백엔드(Uvicorn/FastAPI) stdout·stderr |
| `logs/frontend.log` | 프론트엔드(Vite) stdout·stderr |
| `logs/backend.pid` | 백엔드 프로세스 PID (stop.sh가 사용) |
| `logs/frontend.pid` | 프론트엔드 프로세스 PID |

> `logs/`는 런타임 산출물이므로 git 추적 대상이 아니다(`.gitignore`).

---

## 실시간 확인

```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

---

## 로그 형식

### Backend (Uvicorn access log)
```
INFO:     127.0.0.1:57400 - "POST /api/v1/tasks HTTP/1.1" 201 Created
INFO:     127.0.0.1:57496 - "GET /api/v1/tasks?year=2026&month=8 HTTP/1.1" 200 OK
```
- 각 요청의 `클라이언트 - "메서드 경로 프로토콜" 상태코드 사유` 기록.
- 처리되지 않은 예외는 전역 핸들러가 500 JSON을 반환하며 트레이스백이 함께 남는다.

### Frontend (Vite)
- dev server 시작 배너, HMR 갱신, 빌드/컴파일 경고·에러.

---

## 상태코드 참고

| 코드 | 의미 (이 앱에서) |
|------|------------------|
| 200 | 조회/수정/토글/재정렬 성공 |
| 201 | 리소스 생성(POST) 성공 |
| 204 | 삭제 성공(본문 없음) |
| 400 | 카테고리 이름 중복 |
| 404 | task/category 없음 |
| 409 | 참조 task 있는 카테고리 삭제 시도 |
| 422 | 요청 바디 유효성 실패 |
| 500 | 서버 오류(공통 JSON 응답) |

정책 상세는 `backend.md`, `function.md` 참조.

---

## 운영 팁

- 서비스가 안 뜰 때: `logs/backend.log` 마지막 부분에서 DB 접속 실패(`psycopg2.OperationalError`)·포트 충돌 여부를 먼저 확인.
- 로그 파일은 append로 계속 커지므로 필요 시 주기적으로 비우거나 로테이션(`: > logs/backend.log`) 처리.
- 현재 파일 로깅은 `nohup` 리다이렉트에 의존한다. 구조화 로깅/레벨 조정이 필요하면 Uvicorn `--log-config` 도입을 검토(TBD).
