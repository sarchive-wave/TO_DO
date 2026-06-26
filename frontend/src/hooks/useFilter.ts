import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import type { Task } from '../types/task';

export interface FilterState {
  keyword: string;
  categoryId: number | null;
  completionStatus: 'all' | 'completed' | 'incomplete';
  todayOnly: boolean;
}

const initialFilter: FilterState = {
  keyword: '',
  categoryId: null,
  completionStatus: 'all',
  todayOnly: false,
};

export const useFilter = (tasks: Task[]) => {
  const [filter, setFilter] = useState<FilterState>(initialFilter);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter.keyword && !task.title.toLowerCase().includes(filter.keyword.toLowerCase()))
        return false;
      if (filter.categoryId !== null && task.category_id !== filter.categoryId)
        return false;
      if (filter.completionStatus === 'completed' && !task.completed) return false;
      if (filter.completionStatus === 'incomplete' && task.completed) return false;
      if (filter.todayOnly && task.task_date !== dayjs().format('YYYY-MM-DD')) return false;
      return true;
    });
  }, [tasks, filter]);

  return { filter, setFilter, filteredTasks };
};
