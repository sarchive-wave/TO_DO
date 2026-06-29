import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, LinearProgress,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, Chip, Stack, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '../hooks/useTask';
import { useCategory } from '../hooks/useCategory';
import { useFilter } from '../hooks/useFilter';
import { taskApi } from '../api/taskApi';
import { calcStats } from '../utils/statsUtils';
import TaskTable from '../components/task/TaskTable';
import TaskFormModal from '../components/task/TaskFormModal';
import type { Task } from '../types/task';

const MainPage: React.FC = () => {
  const now = dayjs();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = parseInt(searchParams.get('year') ?? String(now.year()));
  const month = parseInt(searchParams.get('month') ?? String(now.month() + 1));

  const { tasks, loading, fetchTasks, createTask, updateTask, toggleComplete, deleteTask, reorderTasks } = useTask();
  const { categories } = useCategory();
  const { filter, setFilter, filteredTasks } = useFilter(tasks);
  const stats = calcStats(filteredTasks);

  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    taskApi.getSubCategories().then(setSubCategoryOptions).catch(() => {});
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks(year, month);
  }, [year, month, fetchTasks]);

  const yearOptions = Array.from({ length: 10 }, (_, i) => now.year() - 4 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const openAdd = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  const handleSubmit = async (req: { task_date: string; category_id: number; title: string }) => {
    if (editingTask) await updateTask(editingTask.id, req);
    else await createTask(req);
    taskApi.getSubCategories().then(setSubCategoryOptions).catch(() => {});
  };

  return (
    <Box>
      {/* 헤더: 년월 이동 + 통계 */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              value={year}
              size="small"
              onChange={(e) => setSearchParams({ year: String(e.target.value), month: String(month) })}
              sx={{ fontWeight: 700, fontSize: 18, '.MuiSelect-select': { py: 0.8 } }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>{y}년</MenuItem>
              ))}
            </Select>
            <Select
              value={month}
              size="small"
              onChange={(e) => setSearchParams({ year: String(year), month: String(e.target.value) })}
              sx={{ fontWeight: 700, fontSize: 18, '.MuiSelect-select': { py: 0.8 } }}
            >
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m}>{m}월</MenuItem>
              ))}
            </Select>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            업무 추가
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1}>
            <Chip label={`전체 ${stats.total}`} size="small" variant="outlined" />
            <Chip label={`완료 ${stats.completed}`} size="small" color="primary" variant="outlined" />
            <Chip
              label={`완료율 ${stats.rate}%`}
              size="small"
              color={stats.rate === 100 && stats.total > 0 ? 'success' : 'default'}
            />
          </Stack>
          <Box sx={{ flexGrow: 1, minWidth: 150 }}>
            <LinearProgress
              variant="determinate"
              value={stats.rate}
              sx={{ height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' }}
            />
          </Box>
        </Box>
      </Paper>

      {/* 필터 바 */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="업무 검색..."
            value={filter.keyword}
            onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>업무구분</InputLabel>
            <Select
              value={filter.categoryId ?? ''}
              label="업무구분"
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  categoryId: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            >
              <MenuItem value="">전체</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>완료상태</InputLabel>
            <Select
              value={filter.completionStatus}
              label="완료상태"
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  completionStatus: e.target.value as 'all' | 'completed' | 'incomplete',
                }))
              }
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="completed">완료</MenuItem>
              <MenuItem value="incomplete">미완료</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filter.todayOnly}
                onChange={(e) => setFilter((f) => ({ ...f, todayOnly: e.target.checked }))}
              />
            }
            label={<Typography variant="body2">오늘만</Typography>}
          />
        </Box>
      </Paper>

      {/* 업무 테이블 */}
      {loading ? (
        <LinearProgress sx={{ borderRadius: 1 }} />
      ) : (
        <TaskTable
          tasks={filteredTasks}
          onToggleComplete={toggleComplete}
          onEdit={openEdit}
          onDelete={deleteTask}
          onReorder={reorderTasks}
        />
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        categories={categories}
        subCategoryOptions={subCategoryOptions}
        onSubCategoryDeleted={(name) => setSubCategoryOptions((prev) => prev.filter((s) => s !== name))}
        initialTask={editingTask}
      />
    </Box>
  );
};

export default MainPage;
