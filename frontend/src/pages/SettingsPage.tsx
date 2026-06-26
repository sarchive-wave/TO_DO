import React from 'react';
import { Box, Typography, Breadcrumbs } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useCategory } from '../hooks/useCategory';
import CategoryManager from '../components/category/CategoryManager';

const SettingsPage: React.FC = () => {
  const { categories, createCategory, updateCategory, deleteCategory, reorderCategories } = useCategory();

  return (
    <Box>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        <Typography color="text.secondary" variant="body2">설정</Typography>
        <Typography color="text.primary" variant="body2" fontWeight={600}>업무구분 관리</Typography>
      </Breadcrumbs>
      <CategoryManager
        categories={categories}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
        onReorder={reorderCategories}
      />
    </Box>
  );
};

export default SettingsPage;
