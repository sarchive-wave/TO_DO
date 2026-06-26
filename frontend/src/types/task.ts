export interface Task {
  id: number;
  task_date: string;
  category_id: number;
  category_name: string;
  category_color: string;
  sub_category: string | null;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateRequest {
  task_date: string;
  category_id: number;
  sub_category?: string;
  title: string;
}

export interface TaskUpdateRequest {
  task_date: string;
  category_id: number;
  sub_category?: string;
  title: string;
}
