from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.category import CategoryRequest, CategoryReorderRequest, CategoryResponse
from app.schemas.common import ApiResponse
from app.services import category_service
from app.services.category_service import CategoryInUseError, CategoryNotFoundError, DuplicateCategoryNameError

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("", response_model=ApiResponse[list[CategoryResponse]])
def get_categories(db: Session = Depends(get_db)):
    categories = category_service.get_all_categories(db)
    return ApiResponse.ok([CategoryResponse.model_validate(c) for c in categories])


@router.post("", response_model=ApiResponse[CategoryResponse], status_code=status.HTTP_201_CREATED)
def create_category(request: CategoryRequest, db: Session = Depends(get_db)):
    try:
        category = category_service.create_category(db, request)
        return ApiResponse.ok(CategoryResponse.model_validate(category))
    except DuplicateCategoryNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/reorder", response_model=ApiResponse[list[CategoryResponse]])
def reorder_categories(request: CategoryReorderRequest, db: Session = Depends(get_db)):
    categories = category_service.reorder_categories(db, request.ids)
    return ApiResponse.ok([CategoryResponse.model_validate(c) for c in categories])


@router.put("/{category_id}", response_model=ApiResponse[CategoryResponse])
def update_category(category_id: int, request: CategoryRequest, db: Session = Depends(get_db)):
    try:
        category = category_service.update_category(db, category_id, request)
        return ApiResponse.ok(CategoryResponse.model_validate(category))
    except CategoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DuplicateCategoryNameError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    try:
        category_service.delete_category(db, category_id)
    except CategoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except CategoryInUseError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
