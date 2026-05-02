'use client'
import { signIn } from 'next-auth/react'
import { Logo } from '@/components/brand/Logo'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-brand-bg-deep flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 w-full max-w-sm shadow-xl text-center space-y-8">
        <Logo className="h-8 w-auto mx-auto" />
        <div className="space-y-1">
          <h1 className="text-xl font-display font-semibold text-brand-deep">
            Campaign Roadmap
          </h1>
          <p className="text-sm text-brand-deep/50">Alastra team access only</p>
        </div>
        <button
          onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 bg-brand-deep text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-brand-teal transition-colors"
        >
          <MicrosoftIcon />
          Sign in with Microsoft
        </button>
      </div>
    </div>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
