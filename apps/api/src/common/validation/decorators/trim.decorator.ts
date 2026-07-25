import { Transform } from 'class-transformer';

export function Trim() {
  return Transform(({ value }: { value: unknown }) => {
    return typeof value === 'string' ? value.trim() : value;
  });
}
