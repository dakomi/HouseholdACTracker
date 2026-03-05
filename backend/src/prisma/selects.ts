/**
 * Shared Prisma select objects.
 * These define which fields are returned by queries,
 * ensuring sensitive fields (e.g. pin) are never exposed in API responses.
 */

export const safeUserSelect = {
  id: true,
  name: true,
  colour: true,
  is_admin: true,
  created_at: true,
} as const;
