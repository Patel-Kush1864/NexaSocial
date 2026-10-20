export function calculateGrowth(
  current: number,
  previous: number,
): { change: number; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    if (current === 0) return { change: 0, direction: 'neutral' };
    return { change: 100, direction: 'up' };
  }
  const change = ((current - previous) / previous) * 100;
  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (change > 0) direction = 'up';
  else if (change < 0) direction = 'down';

  return { change: parseFloat(change.toFixed(1)), direction };
}
