from sqlalchemy.orm import Session

from app.models.category import Category


DEFAULT_CATEGORIES = [
    {"name": "회의",     "color": "#3B82F6", "sort_order": 1},
    {"name": "교육",     "color": "#10B981", "sort_order": 2},
    {"name": "고객지원", "color": "#F59E0B", "sort_order": 3},
    {"name": "문서작성", "color": "#8B5CF6", "sort_order": 4},
    {"name": "개인",     "color": "#6B7280", "sort_order": 5},
]


def run_seed(db: Session) -> None:
    if db.query(Category).count() == 0:
        db.add_all([Category(**c) for c in DEFAULT_CATEGORIES])
        db.commit()
        print("기본 업무구분 5개가 초기화되었습니다.")
