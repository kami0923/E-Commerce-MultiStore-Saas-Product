import { z } from "zod";

export const tenantScopeSchema = z.object({
  tenantId: z.string().min(1),
  storeId: z.string().min(1).optional(),
  userId: z.string().min(1),
});

export type TenantScope = z.infer<typeof tenantScopeSchema>;

/**
 * Tenant IDs coming from a route, header, or form are selectors, never proof of access.
 * The authenticated membership service must produce this verified scope before a
 * repository or server action is allowed to access tenant-owned records.
 */
export function requireVerifiedTenantScope(input: unknown): TenantScope {
  return tenantScopeSchema.parse(input);
}
