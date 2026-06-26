import dayjs from 'dayjs';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const getDayLabel = (dateStr: string): string =>
  DAY_LABELS[dayjs(dateStr).day()];

export const getDayColor = (dateStr: string): string => {
  const day = dayjs(dateStr).day();
  if (day === 0) return '#EF4444';
  if (day === 6) return '#3B82F6';
  return 'inherit';
};

export const formatDate = (dateStr: string): string =>
  dayjs(dateStr).format('MM/DD');
