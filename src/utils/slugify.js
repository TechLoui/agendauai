export function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateUniqueSlug(baseName, checkExists) {
  const base = slugify(baseName)
  if (!(await checkExists(base))) return base
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`
    if (!(await checkExists(candidate))) return candidate
  }
  return `${base}-${Date.now()}`
}
