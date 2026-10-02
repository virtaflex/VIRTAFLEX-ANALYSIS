/** Resolves a /public file against the build's base URL ("/" normally, "./" for the static build). */
export function asset(path: string): string {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}
