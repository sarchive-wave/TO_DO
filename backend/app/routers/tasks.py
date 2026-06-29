from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.task import TaskCreateRequest, TaskUpdateRequest, TaskResponse, TaskReorderRequest
from app.services import task_service
from app.services.task_service import TaskNotFoundError, CategoryNotFoundError

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("", response_model=ApiResponse[list[TaskResponse]])
def get_tasks(year: int, month: int, db: Session = Depends(get_db)):
    tasks = task_service.get_tasks_by_month(db, year, month)
    return ApiResponse.ok(tasks)


@router.post("", response_model=ApiResponse[TaskResponse], status_code=status.HTTP_201_CREATED)
def create_task(request: TaskCreateRequest, db: Session = Depends(get_db)):
    try:
        task = task_service.create_task(db, request)
        return ApiResponse.ok(task)
    except CategoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/sub-categories", response_model=ApiResponse[list[str]])
def get_sub_categories(db: Session = Depends(get_db)):
    from sqlalchemy import distinct
    from app.models.task import Task as TaskModel
    results = db.query(distinct(TaskModel.sub_category)).filter(TaskModel.sub_category.isnot(None)).all()
    return ApiResponse.ok(sorted([r[0] for r in results if r[0]]))


@router.delete("/sub-categories/{name}", response_model=ApiResponse[None])
def delete_sub_category(name: str, db: Session = Depends(get_db)):
    from app.models.task import Task as TaskModel
    db.query(TaskModel).filter(TaskModel.sub_category == name).update({"sub_category": None})
    db.commit()
    return ApiResponse.ok(None)


@router.put("/reorder", response_model=ApiResponse[None])
def reorder_tasks(request: TaskReorderRequest, db: Session = Depends(get_db)):
    task_service.reorder_tasks(db, request.ids)
    return ApiResponse.ok(None)


@router.put("/{task_id}", response_model=ApiResponse[TaskResponse])
def update_task(task_id: int, request: TaskUpdateRequest, db: Session = Depends(get_db)):
    try:
        task = task_service.update_task(db, task_id, request)
        return ApiResponse.ok(task)
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except CategoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{task_id}/complete", response_model=ApiResponse[TaskResponse])
def toggle_complete(task_id: int, db: Session = Depends(get_db)):
    try:
        task = task_service.toggle_complete(db, task_id)
        return ApiResponse.ok(task)
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    try:
        task_service.delete_task(db, task_id)
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
