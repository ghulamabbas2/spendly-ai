export function getInitials(fullName: string | null, email: string): string {
  const trimmed = fullName?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    const combined = (first + last).toUpperCase();
    if (combined) return combined;
  }
  return email.slice(0, 2).toUpperCase();
}
