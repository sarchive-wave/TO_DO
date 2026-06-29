from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class TaskCreateRequest(BaseModel):
    task_date: date = Field(..., description="업무 날짜")
    category_id: int = Field(..., description="업무구분 ID")
    sub_category: Optional[str] = Field(None, max_length=100, description="세분류")
    title: str = Field(..., min_length=1, max_length=200, description="할 일")
    memo: Optional[str] = Field(None, max_length=1000, description="메모")


class TaskUpdateRequest(BaseModel):
    task_date: date = Field(..., description="업무 날짜")
    category_id: int = Field(..., description="업무구분 ID")
    sub_category: Optional[str] = Field(None, max_length=100, description="세분류")
    title: str = Field(..., min_length=1, max_length=200, description="할 일")
    memo: Optional[str] = Field(None, max_length=1000, description="메모")


class TaskReorderRequest(BaseModel):
    ids: List[int] = Field(..., description="표시 순서대로 나열한 Task ID 목록")


class TaskResponse(BaseModel):
    id: int
    task_date: date
    category_id: int
    category_name: str
    category_color: str
    sub_category: Optional[str] = None
    title: str
    completed: bool
    sort_order: Optional[int] = None
    memo: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
