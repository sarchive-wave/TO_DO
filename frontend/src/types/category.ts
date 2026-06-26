export interface Category {
  id: number;
  name: string;
  color: string;
  sort_order: number;
}

export interface CategoryRequest {
  name: string;
  color: string;
  sort_order?: number;
}
