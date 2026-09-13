export function publicUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL
  const trimmed = relativePath.replace(/^\//, '')
  if (base.endsWith('/')) {
    return `${base}${trimmed}`
  }
  return `${base}/${trimmed}`
}
