from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.task import Task
from app.schemas.task import TaskCreateRequest, TaskUpdateRequest, TaskResponse


class TaskNotFoundError(Exception):
    pass


class CategoryNotFoundError(Exception):
    pass


def get_tasks_by_month(db: Session, year: int, month: int) -> list[TaskResponse]:
    start = date(year, month, 1)
    # 해당 월의 마지막 날 계산
    if month == 12:
        end = date(year + 1, 1, 1).replace(day=1)
        import calendar
        end = date(year, month, calendar.monthrange(year, month)[1])
    else:
        import calendar
        end = date(year, month, calendar.monthrange(year, month)[1])

    tasks = (
        db.query(Task)
        .options(joinedload(Task.category))
        .filter(Task.task_date >= start, Task.task_date <= end)
        .order_by(Task.task_date.asc(), Task.id.asc())
        .all()
    )
    return [_to_response(t) for t in tasks]


def create_task(db: Session, request: TaskCreateRequest) -> TaskResponse:
    category = _find_category(db, request.category_id)
    task = Task(
        task_date=request.task_date,
        category_id=category.id,
        sub_category=request.sub_category,
        title=request.title,
        completed=False,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    # category 관계 로드
    db.refresh(task)
    task.category  # 접근하여 lazy load 트리거
    return _to_response(task)


def update_task(db: Session, task_id: int, request: TaskUpdateRequest) -> TaskResponse:
    task = _find_task(db, task_id)
    category = _find_category(db, request.category_id)
    task.task_date = request.task_date
    task.category_id = category.id
    task.sub_category = request.sub_category
    task.title = request.title
    db.commit()
    db.refresh(task)
    task.category
    return _to_response(task)


def toggle_complete(db: Session, task_id: int) -> TaskResponse:
    task = _find_task(db, task_id)
    task.completed = not task.completed
    db.commit()
    db.refresh(task)
    task.category
    return _to_response(task)


def delete_task(db: Session, task_id: int) -> None:
    task = _find_task(db, task_id)
    db.delete(task)
    db.commit()


def _to_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        task_date=task.task_date,
        category_id=task.category_id,
        category_name=task.category.name,
        category_color=task.category.color,
        sub_category=task.sub_category,
        title=task.title,
        completed=task.completed,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def _find_task(db: Session, task_id: int) -> Task:
    task = db.query(Task).options(joinedload(Task.category)).filter(Task.id == task_id).first()
    if not task:
        raise TaskNotFoundError(f"업무를 찾을 수 없습니다. id={task_id}")
    return task


def _find_category(db: Session, category_id: int) -> Category:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise CategoryNotFoundError(f"업무구분을 찾을 수 없습니다. id={category_id}")
    return category
