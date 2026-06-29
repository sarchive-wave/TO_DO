import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography, Divider,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';

const DRAWER_WIDTH = 220;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: '업무 현황', path: '/', icon: <AssignmentIcon fontSize="small" /> },
    { label: '대시보드', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: '업무구분 관리', path: '/settings/categories', icon: <CategoryIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: '#1E293B',
            color: '#F1F5F9',
            borderRight: 'none',
          },
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <AssignmentIcon sx={{ color: '#60A5FA' }} />
          <Typography variant="h6" fontWeight={700} color="#F1F5F9" noWrap>
            업무 관리
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: '#334155' }} />
        <List sx={{ pt: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1, borderRadius: 1, mb: 0.5,
                '&.Mui-selected': { backgroundColor: '#2563EB', '&:hover': { backgroundColor: '#1D4ED8' } },
                '&:hover': { backgroundColor: '#334155' },
              }}
            >
              <ListItemIcon sx={{ color: '#94A3B8', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ color: '#F1F5F9', fontSize: 14 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, backgroundColor: '#F8FAFC', minHeight: '100vh' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
