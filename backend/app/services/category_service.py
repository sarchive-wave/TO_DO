from typing import List

from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryRequest


class CategoryInUseError(Exception):
    pass


class CategoryNotFoundError(Exception):
    pass


class DuplicateCategoryNameError(Exception):
    pass


def get_all_categories(db: Session) -> list[Category]:
    return db.query(Category).order_by(Category.sort_order.asc()).all()


def create_category(db: Session, request: CategoryRequest) -> Category:
    if db.query(Category).filter(Category.name == request.name).first():
        raise DuplicateCategoryNameError(f"이미 존재하는 업무구분명입니다: {request.name}")

    sort_order = request.sort_order if request.sort_order is not None else db.query(Category).count() + 1
    category = Category(name=request.name, color=request.color, sort_order=sort_order)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category_id: int, request: CategoryRequest) -> Category:
    category = _find_category(db, category_id)

    duplicate = db.query(Category).filter(
        Category.name == request.name, Category.id != category_id
    ).first()
    if duplicate:
        raise DuplicateCategoryNameError(f"이미 존재하는 업무구분명입니다: {request.name}")

    category.name = request.name
    category.color = request.color
    if request.sort_order is not None:
        category.sort_order = request.sort_order

    db.commit()
    db.refresh(category)
    return category


def reorder_categories(db: Session, ids: List[int]) -> list:
    """전달된 ID 순서대로 sort_order를 1부터 재할당."""
    for order, cat_id in enumerate(ids, start=1):
        db.query(Category).filter(Category.id == cat_id).update({"sort_order": order})
    db.commit()
    return get_all_categories(db)


def delete_category(db: Session, category_id: int) -> None:
    from app.models.task import Task
    category = _find_category(db, category_id)

    task_count = db.query(Task).filter(Task.category_id == category_id).count()
    if task_count > 0:
        raise CategoryInUseError(f"해당 업무구분을 사용하는 업무가 {task_count}건 존재합니다.")

    db.delete(category)
    db.commit()


def _find_category(db: Session, category_id: int) -> Category:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise CategoryNotFoundError(f"업무구분을 찾을 수 없습니다. id={category_id}")
    return category
