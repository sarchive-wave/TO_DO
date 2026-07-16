import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Box, IconButton, FormHelperText, Autocomplete, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { taskApi } from '../../api/taskApi';
import type { Category } from '../../types/category';
import type { Task, TaskCreateRequest } from '../../types/task';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (req: TaskCreateRequest) => Promise<void>;
  categories: Category[];
  subCategoryOptions: string[];
  onSubCategoryDeleted: (name: string) => void;
  initialTask?: Task | null;
}

const TaskFormModal: React.FC<Props> = ({ open, onClose, onSubmit, categories, subCategoryOptions, onSubCategoryDeleted, initialTask }) => {
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [dateOpen, setDateOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [subCategory, setSubCategory] = useState('');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<{ date?: string; category?: string; subCategory?: string; title?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialTask) {
      setDate(dayjs(initialTask.task_date));
      setCategoryId(initialTask.category_id);
      setSubCategory(initialTask.sub_category ?? '');
      setTitle(initialTask.title);
      setMemo(initialTask.memo ?? '');
    } else {
      setDate(dayjs());
      setCategoryId(categories[0]?.id ?? '');
      setSubCategory('');
      setTitle('');
      setMemo('');
    }
    setErrors({});
  }, [open, initialTask, categories]);

  const validate = () => {
    const next: typeof errors = {};
    if (!date || !date.isValid()) next.date = '날짜를 선택해주세요.';
    if (!categoryId) next.category = '업무구분을 선택해주세요.';
    if (!subCategory.trim()) next.subCategory = '세분류를 입력해주세요.';
    if (!title.trim()) next.title = '할 일을 입력해주세요.';
    else if (title.length > 200) next.title = '200자 이내로 입력해주세요.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        task_date: date!.format('YYYY-MM-DD'),
        category_id: categoryId as number,
        sub_category: subCategory.trim() || undefined,
        title: title.trim(),
        memo: memo.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        {initialTask ? '업무 수정' : '업무 추가'}
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              label="날짜 *"
              value={date}
              onChange={setDate}
              format="YYYY-MM-DD"
              open={dateOpen}
              onClose={() => setDateOpen(false)}
              slotProps={{
                textField: {
                  error: !!errors.date,
                  helperText: errors.date,
                  size: 'small',
                  onClick: () => setDateOpen(true),
                  sx: { cursor: 'pointer', '& input': { cursor: 'pointer' }, flex: 1 },
                },
              }}
            />
            <FormControl sx={{ flex: 1 }} size="small" error={!!errors.category}>
              <InputLabel>업무구분 *</InputLabel>
              <Select
                value={categoryId}
                label="업무구분 *"
                onChange={(e) => setCategoryId(e.target.value as number)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
                      {cat.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>
          </Box>
          <Autocomplete
            freeSolo
            key={`${initialTask?.id ?? 'new'}-${open}`}
            options={subCategoryOptions}
            value={subCategory}
            inputValue={subCategory}
            onChange={(_, value) => setSubCategory(typeof value === 'string' ? value : '')}
            onInputChange={(_, value) => setSubCategory(value)}
            sx={{ '& .MuiAutocomplete-clearIndicator': { visibility: subCategory ? 'visible' : 'hidden' } }}
            renderOption={(props, option) => (
              <Box
                component="li"
                {...props}
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 0.5 }}
              >
                <span>{option}</span>
                <Tooltip title="목록에서 삭제">
                  <IconButton
                    size="small"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      taskApi.deleteSubCategory(option).then(() => onSubCategoryDeleted(option));
                    }}
                    sx={{ color: '#CBD5E1', '&:hover': { color: '#EF4444' }, ml: 1, flexShrink: 0 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="세분류 *"
                size="small"
                placeholder="입력하거나 목록에서 선택"
                error={!!errors.subCategory}
                helperText={errors.subCategory}
                inputProps={{ ...params.inputProps, maxLength: 100 }}
              />
            )}
          />
          <TextField
            label="할 일 *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
            error={!!errors.title}
            helperText={errors.title}
            inputProps={{ maxLength: 200 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
          <TextField
            label="메모"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="추가 메모 (선택사항)"
            inputProps={{ maxLength: 1000 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">취소</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {initialTask ? '수정' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskFormModal;
