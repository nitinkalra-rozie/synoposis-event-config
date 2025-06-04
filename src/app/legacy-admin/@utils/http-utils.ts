export function normalizeParams(
  params: Record<string, string | number | boolean>
): Record<string, string> {
  return Object.keys(params).reduce(
    (acc, key) => {
      acc[key] = String(params[key]);
      return acc;
    },
    {} as Record<string, string>
  );
}
