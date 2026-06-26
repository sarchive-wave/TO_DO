import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Checkbox, Chip, IconButton, Box, Typography, Menu, MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Task } from '../../types/task';
import { formatDate, getDayLabel, getDayColor } from '../../utils/dateUtils';
import { calcRowSpans } from '../../utils/statsUtils';

interface Props {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const TaskTable: React.FC<Props> = ({ tasks, onToggleComplete, onEdit, onDelete }) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const rowSpans = calcRowSpans(tasks);

  const openMenu = (e: React.MouseEvent<HTMLElement>, task: Task) => {
    setMenuAnchor(e.currentTarget);
    setSelectedTask(task);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setSelectedTask(null);
  };

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
            <col style={{ width: 72 }} />   {/* 날짜 */}
            <col style={{ width: 52 }} />   {/* 요일 */}
            <col style={{ width: 100 }} />  {/* 업무구분 */}
            <col style={{ width: 90 }} />   {/* 세분류 */}
            <col />                         {/* 할 일 (나머지) */}
            <col style={{ width: 60 }} />   {/* 완료 */}
            <col style={{ width: 40 }} />   {/* 더보기 */}
          </colgroup>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
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
            {tasks.map((task) => {
              const span = rowSpans.get(task.id) ?? 0;

              return (
                <TableRow
                  key={task.id}
                  sx={{ '&:hover': { backgroundColor: '#F8FAFC' }, backgroundColor: 'white' }}
                >
                  {span > 0 && (
                    <TableCell
                      rowSpan={span}
                      sx={{ verticalAlign: 'top', pt: 1.5, borderRight: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}
                    >
                      <Typography variant="body2" fontWeight={500} color="#374151">
                        {formatDate(task.task_date)}
                      </Typography>
                    </TableCell>
                  )}
                  {span > 0 && (
                    <TableCell
                      rowSpan={span}
                      align="center"
                      sx={{ verticalAlign: 'top', pt: 1.5, borderRight: '1px solid #F1F5F9' }}
                    >
                      <Typography variant="body2" fontWeight={600} color={getDayColor(task.task_date)}>
                        {getDayLabel(task.task_date)}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
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
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={task.completed ? '#94A3B8' : '#64748B'}
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {task.sub_category ?? ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? '#94A3B8' : '#1E293B',
                      }}
                    >
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.5 }}>
                    <Checkbox
                      checked={task.completed}
                      onChange={() => onToggleComplete(task.id)}
                      size="small"
                      sx={{ color: '#CBD5E1', '&.Mui-checked': { color: '#2563EB' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <IconButton size="small" onClick={(e) => openMenu(e, task)} sx={{ color: '#94A3B8' }}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem onClick={() => { selectedTask && onEdit(selectedTask); closeMenu(); }}>
          수정
        </MenuItem>
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
