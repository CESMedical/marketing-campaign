import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ACTION_LABELS: Record<string, string> = {
  'sign_in':              'Sign in',
  'post.create':          'Post created',
  'post.update':          'Post edited',
  'post.delete':          'Post deleted',
  'post.status_change':   'Status changed',
  'post.comment':         'Comment added',
  'post.comment_delete':  'Comment deleted',
  'canvas.update':        'Canvas saved',
  'user.invite':          'User invited',
}

const ACTION_COLOR: Record<string, string> = {
  'sign_in':              'bg-blue-50 text-blue-700',
  'post.create':          'bg-green-50 text-green-700',
  'post.update':          'bg-amber-50 text-amber-700',
  'post.delete':          'bg-red-50 text-red-700',
  'post.status_change':   'bg-purple-50 text-purple-700',
  'post.comment':         'bg-sky-50 text-sky-700',
  'post.comment_delete':  'bg-orange-50 text-orange-700',
  'canvas.update':        'bg-teal-50 text-teal-700',
  'user.invite':          'bg-indigo-50 text-indigo-700',
}

function fmt(ts: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(ts)
}

function DetailSummary({ detail }: { detail: unknown }) {
  if (!detail || typeof detail !== 'object') return null
  const d = detail as Record<string, unknown>

  if (d.from && d.to) return <span className="text-xs text-brand-deep/60">{String(d.from)} → {String(d.to)}</span>
  if (d.fields) return <span className="text-xs text-brand-deep/60">{(d.fields as string[]).join(', ')}</span>
  if (d.provider) return <span className="text-xs text-brand-deep/60">{String(d.provider)}</span>
  if (d.cards !== undefined) return <span className="text-xs text-brand-deep/60">{String(d.cards)} cards · {String(d.nodes)} nodes · {String(d.edges)} edges</span>
  if (d.title) return <span className="text-xs text-brand-deep/60">{String(d.title)}</span>
  return <span className="text-xs text-brand-deep/40">{JSON.stringify(d).slice(0, 80)}</span>
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; user?: string; action?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/roadmap/')

  const params  = await searchParams
  const page    = Math.max(1, parseInt(params.page ?? '1'))
  const limit   = 50
  const user    = params.user   ?? undefined
  const action  = params.action ?? undefined

  const where = {
    ...(user   ? { userEmail: { contains: user } }   : {}),
    ...(action ? { action: { startsWith: action } }  : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-brand-deep">Audit log</h1>
        <p className="text-sm text-brand-deep/50 mt-1">{total.toLocaleString()} events recorded</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <input
          name="user"
          defaultValue={user}
          placeholder="Filter by email…"
          className="text-sm border border-brand-deep/20 rounded-xl px-3 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-brand-teal"
        />
        <select
          name="action"
          defaultValue={action ?? ''}
          className="text-sm border border-brand-deep/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="text-sm font-semibold px-4 py-2 rounded-xl bg-brand-teal text-white">
          Filter
        </button>
        {(user || action) && (
          <a href="/admin/audit/" className="text-sm font-medium px-4 py-2 rounded-xl border border-brand-deep/20 text-brand-deep/60 hover:text-brand-deep">
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-brand-deep/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-bg-soft border-b border-brand-deep/10">
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-deep/50 uppercase tracking-wide">Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-deep/50 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-deep/50 uppercase tracking-wide">Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-deep/50 uppercase tracking-wide">Resource</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-deep/50 uppercase tracking-wide">Detail</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-deep/50 uppercase tracking-wide">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-brand-deep/40">No events found.</td>
              </tr>
            )}
            {logs.map((log, i) => (
              <tr key={log.id} className={`border-b border-brand-deep/6 ${i % 2 === 0 ? 'bg-white' : 'bg-brand-bg-soft/40'}`}>
                <td className="px-4 py-3 text-xs text-brand-deep/50 whitespace-nowrap font-mono">{fmt(log.timestamp)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-brand-deep text-xs">{log.userName ?? log.userEmail}</div>
                  {log.userName && <div className="text-[10px] text-brand-deep/40">{log.userEmail}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ACTION_COLOR[log.action] ?? 'bg-gray-50 text-gray-600'}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-brand-deep/70 font-mono">{log.resource ?? '—'}</td>
                <td className="px-4 py-3"><DetailSummary detail={log.detail} /></td>
                <td className="px-4 py-3 text-[10px] text-brand-deep/40 font-mono">{log.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-brand-deep/50">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}${user ? `&user=${user}` : ''}${action ? `&action=${action}` : ''}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-deep/20 text-brand-deep/70 hover:text-brand-deep">
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}${user ? `&user=${user}` : ''}${action ? `&action=${action}` : ''}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-deep/20 text-brand-deep/70 hover:text-brand-deep">
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
