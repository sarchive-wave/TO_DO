import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, List, ListItem, ListItemText,
  IconButton, Chip, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category, CategoryRequest } from '../../types/category';
import CategoryFormModal from './CategoryFormModal';

// ── 개별 정렬 가능한 행 ──────────────────────────────────────────
interface RowProps {
  category: Category;
  onEdit: (cat: Category) => void;
  onDeleteClick: (cat: Category) => void;
}

const SortableCategoryRow: React.FC<RowProps> = ({ category, onEdit, onDeleteClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  return (
    <ListItem
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? '#F1F5F9' : 'white',
        zIndex: isDragging ? 10 : 'auto',
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => onEdit(category)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDeleteClick(category)} sx={{ color: '#EF4444' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      {/* 드래그 핸들 */}
      <IconButton
        size="small"
        sx={{ cursor: 'grab', color: '#CBD5E1', mr: 0.5, '&:active': { cursor: 'grabbing' } }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: category.color, flexShrink: 0 }} />
        <ListItemText primary={category.name} primaryTypographyProps={{ fontWeight: 500 }} />
        <Chip
          label={category.color}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, color: category.color, borderColor: category.color }}
        />
      </Box>
    </ListItem>
  );
};

// ── CategoryManager ──────────────────────────────────────────────
interface Props {
  categories: Category[];
  onCreate: (req: CategoryRequest) => Promise<unknown>;
  onUpdate: (id: number, req: CategoryRequest) => Promise<unknown>;
  onDelete: (id: number) => Promise<void>;
  onReorder: (ids: number[]) => Promise<void>;
}

const CategoryManager: React.FC<Props> = ({
  categories, onCreate, onUpdate, onDelete, onReorder,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    onReorder(reordered.map((c) => c.id));
  };

  const handleEdit = (cat: Category) => {
    setEditTarget(cat);
    setFormOpen(true);
  };

  const handleFormSubmit = async (req: CategoryRequest) => {
    if (editTarget) await onUpdate(editTarget.id, req);
    else await onCreate(req);
    setEditTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteError('');
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setDeleteError(e.response?.data?.detail ?? '삭제할 수 없습니다.');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>업무구분 목록</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => { setEditTarget(null); setFormOpen(true); }}
        >
          구분 추가
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <List disablePadding>
              {categories.length === 0 && (
                <ListItem>
                  <ListItemText secondary="등록된 업무구분이 없습니다." />
                </ListItem>
              )}
              {categories.map((cat, idx) => (
                <React.Fragment key={cat.id}>
                  {idx > 0 && <Divider />}
                  <SortableCategoryRow
                    category={cat}
                    onEdit={handleEdit}
                    onDeleteClick={(c) => { setDeleteTarget(c); setDeleteError(''); }}
                  />
                </React.Fragment>
              ))}
            </List>
          </SortableContext>
        </DndContext>
      </Paper>

      <CategoryFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={handleFormSubmit}
        initialCategory={editTarget}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>업무구분 삭제</DialogTitle>
        <DialogContent>
          {deleteError ? (
            <Alert severity="error">{deleteError}</Alert>
          ) : (
            <Typography>
              <strong>{deleteTarget?.name}</strong>을(를) 삭제하시겠습니까?
              <br />
              <Typography component="span" variant="caption" color="text.secondary">
                해당 업무구분을 사용하는 업무가 있으면 삭제할 수 없습니다.
              </Typography>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteTarget(null); setDeleteError(''); }} color="inherit">취소</Button>
          {!deleteError && (
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">삭제</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManager;
