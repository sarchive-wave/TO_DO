import type { Task } from '../types/task';

export interface MonthStats {
  total: number;
  completed: number;
  rate: number;
}

export const calcStats = (tasks: Task[]): MonthStats => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, rate };
};

export const calcRowSpans = (tasks: Task[]): Map<number, number> => {
  const spanMap = new Map<number, number>();
  const dateGroups: Record<string, number[]> = {};

  tasks.forEach((task) => {
    if (!dateGroups[task.task_date]) dateGroups[task.task_date] = [];
    dateGroups[task.task_date].push(task.id);
  });

  Object.values(dateGroups).forEach((ids) => {
    ids.forEach((id, index) => {
      spanMap.set(id, index === 0 ? ids.length : 0);
    });
  });

  return spanMap;
};
