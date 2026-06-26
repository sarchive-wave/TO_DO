import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, IconButton, Typography, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import axios from 'axios';
import type { Category, CategoryRequest } from '../../types/category';

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (req: CategoryRequest) => Promise<void>;
  initialCategory?: Category | null;
}

const CategoryFormModal: React.FC<Props> = ({ open, onClose, onSubmit, initialCategory }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialCategory?.name ?? '');
    setColor(initialCategory?.color ?? PRESET_COLORS[0]);
    setNameError('');
    setSubmitError('');
  }, [open, initialCategory]);

  const handleSubmit = async () => {
    if (!name.trim()) { setNameError('업무구분명을 입력해주세요.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit({ name: name.trim(), color });
      onClose();
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const msg = e.response?.data?.detail ?? e.response?.data?.message;
        setSubmitError(msg ?? '저장에 실패했습니다. 서버 연결을 확인해주세요.');
      } else {
        setSubmitError('저장에 실패했습니다. 서버 연결을 확인해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        {initialCategory ? '업무구분 수정' : '업무구분 추가'}
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {submitError && <Alert severity="error" sx={{ py: 0.5 }}>{submitError}</Alert>}
          <TextField
            label="업무구분명 *"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(''); }}
            fullWidth
            size="small"
            error={!!nameError}
            helperText={nameError}
            inputProps={{ maxLength: 50 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              색상 선택
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setColor(c)}
                  sx={{
                    width: 30, height: 30, borderRadius: '50%',
                    backgroundColor: c, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: color === c ? '2px solid #1E293B' : '2px solid transparent',
                    transition: 'border 0.1s',
                  }}
                >
                  {color === c && <CheckIcon sx={{ fontSize: 16, color: 'white' }} />}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">취소</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {initialCategory ? '수정' : '추가'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryFormModal;
