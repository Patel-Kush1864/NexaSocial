export async function safeJson(
  response: Response,
): Promise<Record<string, any>> {
  try {
    const text = await response.text();
    if (
      !text ||
      text.trim() === '' ||
      text.trim() === 'null' ||
      text.trim() === 'undefined'
    ) {
      return {};
    }
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return {};
  }
}
