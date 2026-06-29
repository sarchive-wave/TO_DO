import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.routers import tasks, categories
from app.seed import run_seed

# SQLite DB 파일 저장 디렉토리 생성
os.makedirs("./data", exist_ok=True)

# 테이블 자동 생성
Base.metadata.create_all(bind=engine)


def _run_migrations():
    """기존 DB에 없는 컬럼을 안전하게 추가하는 마이그레이션."""
    with engine.connect() as conn:
        existing = [row[1] for row in conn.execute(
            __import__("sqlalchemy").text("PRAGMA table_info(task)")
        )]
        if "sub_category" not in existing:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE task ADD COLUMN sub_category VARCHAR(100)"
            ))
            conn.commit()
        if "sort_order" not in existing:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE task ADD COLUMN sort_order INTEGER"
            ))
            conn.commit()
        if "memo" not in existing:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE task ADD COLUMN memo VARCHAR(1000)"
            ))
            conn.commit()


_run_migrations()

app = FastAPI(
    title="업무 관리 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(tasks.router)
app.include_router(categories.router)


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "data": None, "message": "서버 오류가 발생했습니다."},
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}
