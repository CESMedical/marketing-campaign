import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const ACTION_LABEL: Record<string, string> = {
  'sign_in':             'signed in',
  'post.create':         'created a post',
  'post.update':         'edited a post',
  'post.delete':         'deleted a post',
  'post.status_change':  'changed status',
  'post.comment':        'left a comment',
  'post.comment_delete': 'deleted a comment',
  'canvas.update':       'updated the canvas',
  'user.invite':         'invited a user',
}

const ACTION_COLOR: Record<string, string> = {
  'sign_in':             'bg-blue-100 text-blue-700',
  'post.create':         'bg-green-100 text-green-700',
  'post.update':         'bg-amber-100 text-amber-700',
  'post.delete':         'bg-red-100 text-red-700',
  'post.status_change':  'bg-purple-100 text-purple-700',
  'post.comment':        'bg-sky-100 text-sky-700',
  'post.comment_delete': 'bg-orange-100 text-orange-700',
  'canvas.update':       'bg-teal-100 text-teal-700',
  'user.invite':         'bg-indigo-100 text-indigo-700',
}

function avatarColor(email: string) {
  const colors = ['#008080','#2563eb','#7c3aed','#ea580c','#16a34a','#d97706','#003845','#ec4899']
  let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return colors[h % colors.length]
}

function initials(name: string | null, email: string) {
  const src = name ?? email
  const parts = src.split(/[\s@.]/).filter(Boolean)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : src.slice(0, 2).toUpperCase()
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function DetailLine({ action, detail, isAdmin }: { action: string; detail: unknown; isAdmin: boolean }) {
  if (!detail || typeof detail !== 'object') return null
  const d = detail as Record<string, unknown>

  if (action === 'post.status_change' && d.from && d.to)
    return <span className="text-brand-deep/50">{String(d.from)} → <strong className="text-brand-deep/70">{String(d.to)}</strong></span>
  if (action === 'post.comment' && d.preview)
    return <span className="text-brand-deep/50 italic">&ldquo;{String(d.preview)}&rdquo;</span>
  if (action === 'canvas.update' && d.cards !== undefined)
    return <span className="text-brand-deep/50">{String(d.cards)} cards · {String(d.nodes)} nodes · {String(d.edges)} edges</span>
  if (action === 'post.update' && d.fields)
    return <span className="text-brand-deep/50">{(d.fields as string[]).join(', ')}</span>
  if (action === 'post.create' && d.title)
    return <span className="text-brand-deep/50">{String(d.title)}</span>
  if (isAdmin && d.ipAddress)
    return <span className="text-brand-deep/30 font-mono text-[10px]">{String(d.ipAddress)}</span>
  return null
}

export default async function ActivityPage() {
  const session = await auth()
  if (!session) redirect('/auth/signin')

  const isAdmin = session.user.role === 'admin'

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  })

  // Group by date
  type LogEntry = typeof logs[number]
  const groups: { label: string; entries: LogEntry[] }[] = []
  let currentLabel = ''
  for (const log of logs) {
    const label = log.timestamp.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    if (label !== currentLabel) {
      groups.push({ label, entries: [] })
      currentLabel = label
    }
    groups[groups.length - 1].entries.push(log)
  }

  return (
    <div className="container-page py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-brand-deep">Recent activity</h1>
        <p className="text-sm text-brand-deep/50 mt-1">Everything happening across the campaign, in real time.</p>
      </div>

      {logs.length === 0 && (
        <p className="text-sm text-brand-deep/40 text-center py-20">No activity recorded yet.</p>
      )}

      <div className="space-y-8">
        {groups.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-brand-deep/40 uppercase tracking-widest mb-4">{group.label}</p>
            <div className="space-y-1">
              {group.entries.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-brand-bg-soft transition-colors group">
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold mt-0.5"
                    style={{ background: avatarColor(log.userEmail) }}
                  >
                    {initials(log.userName, log.userEmail)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-brand-deep">
                        {log.userName?.split(' ')[0] ?? log.userEmail.split('@')[0]}
                      </span>
                      <span className="text-sm text-brand-deep/60">
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                      {log.resource && (
                        <span className="text-xs font-mono text-brand-deep/40 truncate max-w-[140px]">{log.resource}</span>
                      )}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.action.split('.').pop()}
                      </span>
                    </div>
                    {log.detail && (
                      <div className="mt-0.5 text-xs">
                        <DetailLine action={log.action} detail={log.detail} isAdmin={isAdmin} />
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <span className="flex-shrink-0 text-xs text-brand-deep/30 mt-1 group-hover:text-brand-deep/50 transition-colors">
                    {relativeTime(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
