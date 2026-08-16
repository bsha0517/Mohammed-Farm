import { prisma } from "./prisma";

/**
 * Records who did what, when — spec section 30 (audit history) and the
 * general principle that important records shouldn't change silently.
 * Call this from any action worth being able to trace back to a person:
 * status changes, deletions, team changes, account changes.
 */
export async function logAudit(input: {
  farmId: string;
  entityType: string;
  entityId: string;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  byUserId?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        farmId: input.farmId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        fromValue: input.fromValue ?? null,
        toValue: input.toValue ?? null,
        byUserId: input.byUserId ?? null,
      },
    });
  } catch {
    // Audit logging is a supporting feature — never let a logging failure
    // block the actual operation the user is trying to complete.
  }
}
