import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, LinearProgress, IconButton,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, Chip, Stack, Paper,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '../hooks/useTask';
import { useCategory } from '../hooks/useCategory';
import { useFilter } from '../hooks/useFilter';
import { calcStats } from '../utils/statsUtils';
import TaskTable from '../components/task/TaskTable';
import TaskFormModal from '../components/task/TaskFormModal';
import type { Task } from '../types/task';

const MainPage: React.FC = () => {
  const now = dayjs();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = parseInt(searchParams.get('year') ?? String(now.year()));
  const month = parseInt(searchParams.get('month') ?? String(now.month() + 1));

  const { tasks, loading, fetchTasks, createTask, updateTask, toggleComplete, deleteTask } = useTask();
  const { categories } = useCategory();
  const { filter, setFilter, filteredTasks } = useFilter(tasks);
  const stats = calcStats(filteredTasks);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks(year, month);
  }, [year, month, fetchTasks]);

  const navigateMonth = (delta: number) => {
    let y = year, m = month + delta;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setSearchParams({ year: String(y), month: String(m) });
  };

  const openAdd = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  const handleSubmit = async (req: { task_date: string; category_id: number; title: string }) => {
    if (editingTask) await updateTask(editingTask.id, req);
    else await createTask(req);
  };

  return (
    <Box>
      {/* 헤더: 년월 이동 + 통계 */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" onClick={() => navigateMonth(-1)}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={700} sx={{ minWidth: 150, textAlign: 'center' }}>
              {year}년 {month}월
            </Typography>
            <IconButton size="small" onClick={() => navigateMonth(1)}>
              <ChevronRightIcon />
            </IconButton>
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
        />
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        categories={categories}
        initialTask={editingTask}
      />
    </Box>
  );
};

export default MainPage;
