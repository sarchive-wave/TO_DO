import { useState, useCallback } from 'react';
import { taskApi } from '../api/taskApi';
import type { Task, TaskCreateRequest, TaskUpdateRequest } from '../types/task';

const sortTasks = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) =>
    a.task_date < b.task_date ? -1 : a.task_date > b.task_date ? 1 : a.id - b.id
  );

export const useTask = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const data = await taskApi.getByMonth(year, month);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (request: TaskCreateRequest) => {
    const newTask = await taskApi.create(request);
    setTasks((prev) => sortTasks([...prev, newTask]));
  };

  const updateTask = async (id: number, request: TaskUpdateRequest) => {
    const updated = await taskApi.update(id, request);
    setTasks((prev) => sortTasks(prev.map((t) => (t.id === id ? updated : t))));
  };

  const toggleComplete = async (id: number) => {
    // 낙관적 업데이트: 클릭 즉시 UI 반영
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    try {
      await taskApi.toggleComplete(id);
    } catch {
      // 실패 시 롤백
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  const deleteTask = async (id: number) => {
    await taskApi.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, fetchTasks, createTask, updateTask, toggleComplete, deleteTask };
};
