import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

const ADMIN_EMAILS = ['kush@alastralabs.com', 'miran@alastralabs.com']

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
      return email.endsWith('@alastralabs.com') || email.endsWith('@cesmedical.co.uk')
    },
    async jwt({ token, profile }) {
      if (profile) {
        const email = getEmail(profile as Record<string, unknown>)
        token.email = email
        token.displayName = (profile.name as string) ?? email
      }
      // Always recalculate role so existing sessions pick it up on next refresh
      const email = ((token.email as string) ?? '').toLowerCase()
      token.role = ADMIN_EMAILS.includes(email) ? 'admin' : 'viewer'
      return token
    },
    async session({ session, token }) {
      // Derive role from stored email so it's always correct
      const email = ((token.email as string) ?? '').toLowerCase()
      return {
        ...session,
        user: {
          ...session.user,
          email: token.email as string,
          role: ADMIN_EMAILS.includes(email) ? 'admin' : 'viewer',
          displayName: (token.displayName as string) ?? token.email as string,
        },
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
