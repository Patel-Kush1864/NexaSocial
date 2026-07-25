import { Transform } from 'class-transformer';

export function ToLowerCase() {
  return Transform(({ value }: { value: unknown }) => {
    return typeof value === 'string' ? value.toLowerCase() : value;
  });
}
