from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.task import TaskCreateRequest, TaskUpdateRequest, TaskResponse
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
