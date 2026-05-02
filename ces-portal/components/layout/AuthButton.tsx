'use client'
import { useSession, signOut } from 'next-auth/react'

export function AuthButton() {
  const { data: session } = useSession()
  if (!session) return null
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="text-sm text-brand-deep/60 hover:text-brand-deep transition-colors"
    >
      Sign out
    </button>
  )
}
