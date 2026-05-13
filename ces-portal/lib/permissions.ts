export type Role = 'admin' | 'editor' | 'clinical_reviewer' | 'brand_reviewer' | 'viewer'
export type WorkflowStatus = 'draft' | 'clinical-review' | 'brand-review' | 'approved' | 'scheduled' | 'live'

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

export function canUpdateCanvas(role: Role | string | undefined): boolean {
  return role === 'admin' || role === 'editor'
}

export function canTransitionStatus(
  role: Role | string | undefined,
  currentStatus: WorkflowStatus,
  nextStatus: WorkflowStatus,
): boolean {
  if (currentStatus === nextStatus) return canEditPost(role) || canApproveClinical(role) || canApproveBrand(role)
  if (role === 'admin') return true

  if (role === 'editor') {
    if (nextStatus === 'draft' || nextStatus === 'clinical-review') return true
    if (currentStatus === 'approved' && nextStatus === 'scheduled') return true
    if (currentStatus === 'scheduled' && nextStatus === 'live') return true
    return false
  }

  if (role === 'clinical_reviewer') {
    return currentStatus === 'clinical-review' && (nextStatus === 'brand-review' || nextStatus === 'draft')
  }

  if (role === 'brand_reviewer') {
    return currentStatus === 'brand-review' && (nextStatus === 'approved' || nextStatus === 'clinical-review')
  }

  return false
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
