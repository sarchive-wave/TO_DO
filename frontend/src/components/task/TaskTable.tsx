import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Checkbox, Chip, IconButton, Box, Typography, Menu, MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types/task';
import { formatDate, getDayLabel, getDayColor } from '../../utils/dateUtils';

interface RowProps {
  task: Task;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onToggleComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onMenuOpen: (e: React.MouseEvent<HTMLElement>, task: Task) => void;
}

const SortableTaskRow: React.FC<RowProps> = ({
  task, isFirstInGroup, isLastInGroup, onToggleComplete, onEdit, onMenuOpen,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const groupBorderTop = isFirstInGroup ? '2px solid #CBD5E1' : undefined;
  const groupBorderBottom = isLastInGroup ? '1px solid #F1F5F9' : undefined;

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: isDragging ? '#F1F5F9' : 'white',
        '&:hover': { backgroundColor: '#F8FAFC' },
        '& td': { borderBottom: groupBorderBottom ?? '1px solid #F1F5F9' },
      }}
    >
      {/* 드래그 핸들 */}
      <TableCell sx={{ py: 0.5, px: 0.5, borderTop: groupBorderTop }}>
        <IconButton
          size="small"
          sx={{ cursor: 'grab', color: '#CBD5E1', '&:active': { cursor: 'grabbing' } }}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </TableCell>

      {/* 날짜 — 그룹 첫 행만 표시 */}
      <TableCell sx={{ borderTop: groupBorderTop, whiteSpace: 'nowrap', py: 1 }}>
        {isFirstInGroup && (
          <Typography variant="body2" fontWeight={500} color="#374151">
            {formatDate(task.task_date)}
          </Typography>
        )}
      </TableCell>

      {/* 요일 — 그룹 첫 행만 표시 */}
      <TableCell align="center" sx={{ borderTop: groupBorderTop, py: 1 }}>
        {isFirstInGroup && (
          <Typography variant="body2" fontWeight={600} color={getDayColor(task.task_date)}>
            {getDayLabel(task.task_date)}
          </Typography>
        )}
      </TableCell>

      <TableCell sx={{ borderTop: groupBorderTop, py: 1 }}>
        <Chip
          label={task.category_name}
          size="small"
          sx={{
            backgroundColor: task.category_color + '20',
            color: task.category_color,
            border: `1px solid ${task.category_color}50`,
            fontWeight: 500,
            fontSize: 11,
            height: 22,
          }}
        />
      </TableCell>

      <TableCell sx={{ borderTop: groupBorderTop, py: 1 }}>
        <Typography variant="body2" color={task.completed ? '#94A3B8' : '#64748B'}>
          {task.sub_category ?? ''}
        </Typography>
      </TableCell>

      <TableCell
        sx={{ borderTop: groupBorderTop, py: 1, cursor: 'pointer' }}
        onClick={() => onEdit(task)}
      >
        <Typography
          variant="body2"
          sx={{
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? '#94A3B8' : '#1E293B',
            '&:hover': { color: '#2563EB' },
          }}
        >
          {task.title}
        </Typography>
      </TableCell>

      <TableCell align="center" sx={{ borderTop: groupBorderTop, py: 0.5 }}>
        <Checkbox
          checked={task.completed}
          onChange={() => onToggleComplete(task.id)}
          size="small"
          sx={{ color: '#CBD5E1', '&.Mui-checked': { color: '#2563EB' } }}
        />
      </TableCell>

      <TableCell sx={{ borderTop: groupBorderTop, py: 0.5 }}>
        <IconButton size="small" onClick={(e) => onMenuOpen(e, task)} sx={{ color: '#94A3B8' }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

// ── TaskTable ────────────────────────────────────────────────────
interface Props {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
}

const TaskTable: React.FC<Props> = ({ tasks, onToggleComplete, onEdit, onDelete, onReorder }) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const openMenu = (e: React.MouseEvent<HTMLElement>, task: Task) => {
    setMenuAnchor(e.currentTarget);
    setSelectedTask(task);
  };
  const closeMenu = () => { setMenuAnchor(null); setSelectedTask(null); };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    onReorder(reordered.map((t) => t.id));
  };

  // 날짜 그룹에서 첫/마지막 행 계산
  const groupInfo = tasks.map((task, idx) => ({
    isFirst: idx === 0 || tasks[idx - 1].task_date !== task.task_date,
    isLast: idx === tasks.length - 1 || tasks[idx + 1].task_date !== task.task_date,
  }));

  if (tasks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
        <Typography>등록된 업무가 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 36 }} />   {/* 드래그 핸들 */}
            <col style={{ width: 72 }} />   {/* 날짜 */}
            <col style={{ width: 52 }} />   {/* 요일 */}
            <col style={{ width: 100 }} />  {/* 업무구분 */}
            <col style={{ width: 110 }} />  {/* 세분류 */}
            <col />                         {/* 할 일 */}
            <col style={{ width: 60 }} />   {/* 완료 */}
            <col style={{ width: 40 }} />   {/* 더보기 */}
          </colgroup>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              <TableCell sx={{ py: 1 }} />
              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13, py: 1, whiteSpace: 'nowrap' }}>날짜</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13, py: 1, whiteSpace: 'nowrap', textAlign: 'center' }}>요일</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13, py: 1, whiteSpace: 'nowrap' }}>업무구분</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13, py: 1, whiteSpace: 'nowrap' }}>세분류</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13, py: 1, whiteSpace: 'nowrap' }}>할 일</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', fontSize: 13, py: 1, whiteSpace: 'nowrap' }}>완료</TableCell>
              <TableCell sx={{ py: 1 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {tasks.map((task, idx) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    isFirstInGroup={groupInfo[idx].isFirst}
                    isLastInGroup={groupInfo[idx].isLast}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onMenuOpen={openMenu}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </TableBody>
        </Table>
      </TableContainer>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => { selectedTask && onDelete(selectedTask.id); closeMenu(); }}
          sx={{ color: '#EF4444' }}
        >
          삭제
        </MenuItem>
      </Menu>
    </>
  );
};

export default TaskTable;
