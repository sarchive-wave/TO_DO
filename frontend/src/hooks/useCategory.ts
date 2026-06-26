import { useState, useEffect, useCallback } from 'react';
import { categoryApi } from '../api/categoryApi';
import type { Category, CategoryRequest } from '../types/category';

export const useCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (request: CategoryRequest) => {
    const newCategory = await categoryApi.create(request);
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = async (id: number, request: CategoryRequest) => {
    const updated = await categoryApi.update(id, request);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const reorderCategories = async (ids: number[]) => {
    // 낙관적 업데이트: 드래그 순서 즉시 반영
    setCategories((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      return ids.map((id, idx) => ({ ...map.get(id)!, sort_order: idx + 1 }));
    });
    await categoryApi.reorder(ids);
  };

  const deleteCategory = async (id: number) => {
    await categoryApi.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return { categories, loading, createCategory, updateCategory, deleteCategory, reorderCategories };
};
