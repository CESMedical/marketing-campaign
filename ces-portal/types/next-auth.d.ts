import 'next-auth'
import type { Role } from '@/lib/permissions'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
      displayName: string
    }
  }
}
