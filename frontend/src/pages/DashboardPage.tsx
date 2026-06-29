import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, IconButton, Chip, Stack,
  LinearProgress, Divider, Breadcrumbs,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTask } from '../hooks/useTask';

interface SubCategoryStat {
  name: string;
  total: number;
  completed: number;
  rate: number;
}

interface CategoryStat {
  category_id: number;
  category_name: string;
  category_color: string;
  total: number;
  completed: number;
  rate: number;
  sub_categories: SubCategoryStat[];
}

const buildStats = (tasks: ReturnType<typeof useTask>['tasks']): CategoryStat[] => {
  const map = new Map<number, CategoryStat>();

  for (const t of tasks) {
    if (!map.has(t.category_id)) {
      map.set(t.category_id, {
        category_id: t.category_id,
        category_name: t.category_name,
        category_color: t.category_color,
        total: 0, completed: 0, rate: 0,
        sub_categories: [],
      });
    }
    const stat = map.get(t.category_id)!;
    stat.total += 1;
    if (t.completed) stat.completed += 1;

    // 세분류 집계
    const subKey = t.sub_category || '(없음)';
    let sub = stat.sub_categories.find((s) => s.name === subKey);
    if (!sub) {
      sub = { name: subKey, total: 0, completed: 0, rate: 0 };
      stat.sub_categories.push(sub);
    }
    sub.total += 1;
    if (t.completed) sub.completed += 1;
  }

  // rate 계산
  for (const stat of map.values()) {
    stat.rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
    for (const sub of stat.sub_categories) {
      sub.rate = sub.total > 0 ? Math.round((sub.completed / sub.total) * 100) : 0;
    }
  }

  return Array.from(map.values());
};

// 도넛 중앙 텍스트
const DonutCenter = ({ cx, cy, rate }: { cx: number; cy: number; rate: number }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" fill="#1E293B" fontSize={28} fontWeight={700}>
      {rate}%
    </text>
    <text x={cx} y={cy + 16} textAnchor="middle" fill="#94A3B8" fontSize={13}>
      전체 완료율
    </text>
  </>
);

const DashboardPage: React.FC = () => {
  const now = dayjs();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = parseInt(searchParams.get('year') ?? String(now.year()));
  const month = parseInt(searchParams.get('month') ?? String(now.month() + 1));

  const { tasks, loading, fetchTasks } = useTask();
  const [selectedCat, setSelectedCat] = useState<CategoryStat | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks(year, month);
    setSelectedCat(null);
  }, [year, month, fetchTasks]);

  const navigateMonth = (delta: number) => {
    let y = year, m = month + delta;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setSearchParams({ year: String(y), month: String(m) });
  };

  const stats = buildStats(tasks);
  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t) => t.completed).length;
  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // 도넛 차트 데이터 (업무구분별 총 업무 수 기준 면적)
  const chartData = stats.map((s) => ({ name: s.category_name, value: s.total, stat: s }));

  const handlePieClick = (_: unknown, index: number) => {
    const cat = stats[index];
    setSelectedCat((prev) => (prev?.category_id === cat.category_id ? null : cat));
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 3, color: 'text.secondary' }}>
        <Typography color="text.secondary" variant="body2">대시보드</Typography>
        <Typography color="text.primary" variant="body2" fontWeight={600}>
          {year}년 {month}월 업무 현황
        </Typography>
      </Breadcrumbs>

      {/* 월 이동 */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" onClick={() => navigateMonth(-1)}><ChevronLeftIcon /></IconButton>
            <Typography variant="h5" fontWeight={700} sx={{ minWidth: 150, textAlign: 'center' }}>
              {year}년 {month}월
            </Typography>
            <IconButton size="small" onClick={() => navigateMonth(1)}><ChevronRightIcon /></IconButton>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label={`전체 ${totalTasks}`} size="small" variant="outlined" />
            <Chip label={`완료 ${totalCompleted}`} size="small" color="primary" variant="outlined" />
            <Chip
              label={`완료율 ${overallRate}%`}
              size="small"
              color={overallRate === 100 && totalTasks > 0 ? 'success' : 'default'}
            />
          </Stack>
        </Box>
      </Paper>

      {loading ? (
        <LinearProgress sx={{ borderRadius: 1 }} />
      ) : totalTasks === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <Typography>이 달에 등록된 업무가 없습니다.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* 왼쪽: 도넛 차트 + 업무구분 목록 */}
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 3, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>업무구분별 현황</Typography>

            {/* 도넛 차트 */}
            <Box sx={{ position: 'relative', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    dataKey="value"
                    paddingAngle={2}
                    onClick={handlePieClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={entry.stat.category_color}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                        stroke={activeIndex === index ? '#1E293B' : 'none'}
                        strokeWidth={activeIndex === index ? 2 : 0}
                      />
                    ))}
                    <DonutCenter cx={0} cy={0} rate={overallRate} />
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}건`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* 중앙 텍스트 오버레이 */}
              <Box
                sx={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none',
                }}
              >
                <Typography variant="h4" fontWeight={700} color="#1E293B">{overallRate}%</Typography>
                <Typography variant="caption" color="#94A3B8">전체 완료율</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* 업무구분 범례 + 통계 */}
            <Stack spacing={1.5}>
              {stats.map((stat, idx) => (
                <Box
                  key={stat.category_id}
                  onClick={() => handlePieClick(null, idx)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1, borderRadius: 1.5, cursor: 'pointer',
                    backgroundColor: selectedCat?.category_id === stat.category_id ? stat.category_color + '15' : 'transparent',
                    border: selectedCat?.category_id === stat.category_id ? `1px solid ${stat.category_color}50` : '1px solid transparent',
                    '&:hover': { backgroundColor: stat.category_color + '10' },
                    transition: 'all 0.15s',
                  }}
                >
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: stat.category_color, flexShrink: 0 }} />
                  <Typography variant="body2" fontWeight={500} sx={{ minWidth: 80 }}>{stat.category_name}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={stat.rate}
                      sx={{
                        height: 6, borderRadius: 3, backgroundColor: '#E2E8F0',
                        '& .MuiLinearProgress-bar': { backgroundColor: stat.category_color },
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: 'right' }}>
                    {stat.completed}/{stat.total} ({stat.rate}%)
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* 오른쪽: 선택된 업무구분의 세분류 */}
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0', borderRadius: 2, p: 3,
              width: 320, flexShrink: 0,
              transition: 'opacity 0.2s',
              opacity: selectedCat ? 1 : 0.4,
            }}
          >
            {selectedCat ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: selectedCat.category_color }} />
                  <Typography variant="subtitle1" fontWeight={700}>{selectedCat.category_name}</Typography>
                  <Chip
                    label={`${selectedCat.rate}%`}
                    size="small"
                    sx={{ ml: 'auto', bgcolor: selectedCat.category_color + '20', color: selectedCat.category_color, fontWeight: 700 }}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {selectedCat.sub_categories.map((sub) => (
                    <Box key={sub.name}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>{sub.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sub.completed}/{sub.total}건 · {sub.rate}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={sub.rate}
                        sx={{
                          height: 8, borderRadius: 4, backgroundColor: '#E2E8F0',
                          '& .MuiLinearProgress-bar': { backgroundColor: selectedCat.category_color },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Typography variant="body2">도넛 차트에서</Typography>
                <Typography variant="body2">업무구분을 클릭하면</Typography>
                <Typography variant="body2" mt={0.5}>세분류를 확인할 수 있습니다.</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default DashboardPage;
