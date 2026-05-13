import type { Role } from './permissions'
export type { Role }
export {
  canEditPost,
  canUploadAsset,
  canApproveClinical,
  canApproveBrand,
  canTransitionStatus,
  canUpdateCanvas,
  canComment,
  roleLabel,
} from './permissions'

function splitEmails(env: string | undefined): string[] {
  return (env ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

export function isDomainAllowed(email: string): boolean {
  const lower = email.toLowerCase()
  const domains = (process.env.ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
  if (domains.length === 0) {
    return lower.endsWith('@alastralabs.com') || lower.endsWith('@cesmedical.co.uk')
  }
  return domains.some(d => lower.endsWith(`@${d}`))
}

export function resolveRole(email: string): Role {
  const lower = email.toLowerCase()
  if (splitEmails(process.env.ADMIN_EMAILS).includes(lower))             return 'admin'
  if (splitEmails(process.env.EDITOR_EMAILS).includes(lower))            return 'editor'
  if (splitEmails(process.env.CLINICAL_REVIEWER_EMAILS).includes(lower)) return 'clinical_reviewer'
  if (splitEmails(process.env.BRAND_REVIEWER_EMAILS).includes(lower))    return 'brand_reviewer'
  return 'viewer'
}
