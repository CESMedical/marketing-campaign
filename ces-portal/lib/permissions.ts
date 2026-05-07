export type Role = 'admin' | 'editor' | 'clinical_reviewer' | 'brand_reviewer' | 'viewer'

export function canEditPost(role: Role | string | undefined): boolean {
  return role === 'admin' || role === 'editor'
}

export function canUploadAsset(role: Role | string | undefined): boolean {
  return role === 'admin' || role === 'editor'
}

export function canApproveClinical(role: Role | string | undefined): boolean {
  return role === 'admin' || role === 'clinical_reviewer'
}

export function canApproveBrand(role: Role | string | undefined): boolean {
  return role === 'admin' || role === 'brand_reviewer'
}

export function canComment(_role?: Role | string): boolean {
  return true
}

export function roleLabel(role: Role | string | undefined): string | null {
  if (role === 'admin')             return 'Admin'
  if (role === 'editor')            return 'Editor'
  if (role === 'clinical_reviewer') return 'Clinical reviewer'
  if (role === 'brand_reviewer')    return 'Brand reviewer'
  return null
}
