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
