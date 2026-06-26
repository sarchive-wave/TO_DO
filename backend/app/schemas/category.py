from typing import Optional, List

from pydantic import BaseModel, Field


class CategoryRequest(BaseModel):
    name: str = Field(..., max_length=50, description="업무구분명")
    color: str = Field(..., description="HEX 색상코드 (예: #3B82F6)")
    sort_order: Optional[int] = None


class CategoryReorderRequest(BaseModel):
    ids: List[int] = Field(..., description="정렬 순서대로 나열한 Category ID 목록")


class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str
    sort_order: int

    model_config = {"from_attributes": True}
