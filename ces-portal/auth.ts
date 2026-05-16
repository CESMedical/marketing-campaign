import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { resolveRole, isDomainAllowed } from '@/lib/roles'

function getEmail(profile: Record<string, unknown>): string {
  return (
    (profile.email as string) ??
    (profile.preferred_username as string) ??
    (profile.upn as string) ??
    ''
  ).toLowerCase()
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = getEmail(profile as Record<string, unknown>)
      return isDomainAllowed(email)
    },
    async jwt({ token, profile }) {
      if (profile) {
        const email = getEmail(profile as Record<string, unknown>)
        token.email = email
        token.displayName = (profile.name as string) ?? email
      }
      const email = ((token.email as string) ?? '').toLowerCase()
      token.role = resolveRole(email)
      return token
    },
    async session({ session, token }) {
      const email = ((token.email as string) ?? '').toLowerCase()
      return {
        ...session,
        user: {
          ...session.user,
          email: token.email as string,
          role: resolveRole(email),
          displayName: (token.displayName as string) ?? (token.email as string),
        },
      }
    },
  },
  events: {
    async signIn({ profile }) {
      if (!profile) return
      const email = getEmail(profile as Record<string, unknown>)
      if (!email) return
      const displayName = (profile.name as string) ?? email
      const { syncUserOnSignIn } = await import('@/lib/user-sync')
      syncUserOnSignIn(email, displayName).catch(console.error)
      const { logAudit } = await import('@/lib/audit')
      logAudit({ userEmail: email, userName: displayName, action: 'sign_in', detail: { provider: 'microsoft-entra' } })
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
