from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class TaskCreateRequest(BaseModel):
    task_date: date = Field(..., description="업무 날짜")
    category_id: int = Field(..., description="업무구분 ID")
    sub_category: Optional[str] = Field(None, max_length=100, description="세분류")
    title: str = Field(..., min_length=1, max_length=200, description="할 일")


class TaskUpdateRequest(BaseModel):
    task_date: date = Field(..., description="업무 날짜")
    category_id: int = Field(..., description="업무구분 ID")
    sub_category: Optional[str] = Field(None, max_length=100, description="세분류")
    title: str = Field(..., min_length=1, max_length=200, description="할 일")


class TaskResponse(BaseModel):
    id: int
    task_date: date
    category_id: int
    category_name: str
    category_color: str
    sub_category: Optional[str] = None
    title: str
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
