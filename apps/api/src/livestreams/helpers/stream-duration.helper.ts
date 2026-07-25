export function calculateStreamDuration(
  startedAt?: Date | null,
  endedAt?: Date | null,
): { durationSeconds: number; formatted: string } {
  if (!startedAt) {
    return { durationSeconds: 0, formatted: '00:00:00' };
  }

  const end = endedAt ? new Date(endedAt) : new Date();
  const start = new Date(startedAt);
  const durationSeconds = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 1000),
  );

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { durationSeconds, formatted };
}
