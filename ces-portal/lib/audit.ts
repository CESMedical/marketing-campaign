import { prisma } from './prisma'

export type AuditAction =
  | 'sign_in'
  | 'post.create'
  | 'post.update'
  | 'post.delete'
  | 'post.status_change'
  | 'post.comment'
  | 'post.comment_delete'
  | 'canvas.update'
  | 'user.invite'

interface AuditParams {
  userEmail: string
  userName?: string
  action: AuditAction
  resource?: string          // post slug, roadmap id, etc.
  detail?: Record<string, unknown>
  ipAddress?: string
}

export function logAudit(params: AuditParams): void {
  if (!process.env.DATABASE_URL) return
  prisma.auditLog.create({
    data: {
      userEmail: params.userEmail,
      userName:  params.userName  ?? null,
      action:    params.action,
      resource:  params.resource  ?? null,
      detail:    params.detail as never ?? undefined,
      ipAddress: params.ipAddress ?? null,
    },
  }).catch(() => {}) // never crash the caller
}

export function ipFromRequest(req: { headers: { get(k: string): string | null } }): string | undefined {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    undefined
  )
}
