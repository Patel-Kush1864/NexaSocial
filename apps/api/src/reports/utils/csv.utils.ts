export function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const strValue = String(value);

  // Prevent CSV Formula Injection
  const injectionChars = ['=', '+', '-', '@', '\t', '\r'];
  let sanitizedValue = strValue;
  if (strValue.length > 0 && injectionChars.includes(strValue[0])) {
    sanitizedValue = "'" + strValue;
  }

  // Quote if it contains comma, quote, or newline
  if (
    sanitizedValue.includes(',') ||
    sanitizedValue.includes('"') ||
    sanitizedValue.includes('\n') ||
    sanitizedValue.includes('\r')
  ) {
    return `"${sanitizedValue.replace(/"/g, '""')}"`;
  }

  return sanitizedValue;
}

export function generateCSV(
  headers: string[],
  data: Record<string, any>[],
  keyMap: string[],
): string {
  if (!data || data.length === 0) return headers.join(',');

  const rows = data.map((row) => {
    return keyMap
      .map((key) => {
        // Handle nested keys like user.email
        const value = key
          .split('.')
          .reduce((acc, part) => (acc ? acc[part] : ''), row);
        return escapeCSVValue(value);
      })
      .join(',');
  });

  return `${headers.join(',')}\n${rows.join('\n')}`;
}
