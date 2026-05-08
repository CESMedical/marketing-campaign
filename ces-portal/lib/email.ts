import { Resend } from 'resend'

const FROM = 'CES Medical <marketing@cesmedical.co.uk>'
const PORTAL = process.env.AUTH_URL ?? 'https://marketing.cesmedical.co.uk'

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  const resend = client()
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to the CES Medical Campaign Portal',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F4F7F8;font-family:'Work Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,56,69,0.08);">
        <tr><td style="background:#003845;padding:32px 40px;">
          <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">CES Medical</div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:2px;">Campaign Portal</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#003845;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#445;line-height:1.6;">
            You've been granted access to the CES Medical Campaign Roadmap Portal — your central view of the social media campaign across cataract, oculoplastic and brand pillars.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#445;line-height:1.6;">
            You can view posts, leave comments, and tag colleagues using @mentions.
          </p>
          <a href="${PORTAL}" style="display:inline-block;background:#008080;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">Open the portal →</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #eef2f4;">
          <p style="margin:0;font-size:12px;color:#aaa;">Sent by CES Medical · marketing@cesmedical.co.uk — please do not reply</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function sendStatusChangeEmail(opts: {
  to: string
  toFirstName: string
  newStatus: string
  postTitle: string
  postSlug: string
  changedBy: string
}): Promise<void> {
  const resend = client()
  if (!resend) return
  const postUrl = `${PORTAL}/post/${opts.postSlug}/`
  const statusLabel = opts.newStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Post moved to ${statusLabel}: "${opts.postTitle}"`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7F8;font-family:'Work Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,56,69,0.08);">
        <tr><td style="background:#003845;padding:32px 40px;">
          <div style="color:#fff;font-size:22px;font-weight:800;">CES Medical</div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:2px;">Campaign Portal</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:15px;color:#445;">Hi ${opts.toFirstName},</p>
          <p style="margin:0 0 8px;font-size:15px;color:#445;"><strong>${opts.changedBy}</strong> moved a post to <strong style="color:#008080;">${statusLabel}</strong> — your review may be required.</p>
          <p style="margin:0 0 32px;font-size:18px;font-weight:700;color:#003845;">${opts.postTitle}</p>
          <a href="${postUrl}" style="display:inline-block;background:#008080;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">View the post →</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #eef2f4;">
          <p style="margin:0;font-size:12px;color:#aaa;">Sent by CES Medical · marketing@cesmedical.co.uk — please do not reply</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}

export async function sendNewCommentEmail(opts: {
  to: string
  toFirstName: string
  commentAuthor: string
  postTitle: string
  postSlug: string
  commentText: string
}): Promise<void> {
  const resend = client()
  if (!resend) return
  const postUrl = `${PORTAL}/post/${opts.postSlug}/`
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `New comment on "${opts.postTitle}"`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7F8;font-family:'Work Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,56,69,0.08);">
        <tr><td style="background:#003845;padding:32px 40px;">
          <div style="color:#fff;font-size:22px;font-weight:800;">CES Medical</div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:2px;">Campaign Portal</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:15px;color:#445;">Hi ${opts.toFirstName},</p>
          <p style="margin:0 0 8px;font-size:15px;color:#445;"><strong>${opts.commentAuthor}</strong> left a comment on:</p>
          <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#003845;">${opts.postTitle}</p>
          <div style="background:#F4F7F8;border-left:4px solid #008080;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:32px;">
            <p style="margin:0;font-size:14px;color:#445;line-height:1.6;white-space:pre-wrap;">${opts.commentText}</p>
          </div>
          <a href="${postUrl}" style="display:inline-block;background:#008080;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">View the post →</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #eef2f4;">
          <p style="margin:0;font-size:12px;color:#aaa;">Sent by CES Medical · marketing@cesmedical.co.uk — please do not reply</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}

export async function sendWeeklyDigestEmail(opts: {
  to: string
  toFirstName: string
  weekLabel: string
  posts: { title: string; scheduledDate: string; status: string; slug: string }[]
}): Promise<void> {
  const resend = client()
  if (!resend) return
  const statusColor: Record<string, string> = {
    draft: '#9ca3af', 'clinical-review': '#f59e0b', 'brand-review': '#f97316',
    approved: '#22c55e', scheduled: '#3b82f6', live: '#008080',
  }
  const rows = opts.posts.map(p => {
    const sc = statusColor[p.status] ?? '#9ca3af'
    const label = p.status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const date = new Date(p.scheduledDate + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    const url = `${PORTAL}/post/${p.slug}/`
    return `<tr>
      <td style="padding:10px 12px;font-size:13px;color:#003845;font-weight:600;border-bottom:1px solid #eef2f4;"><a href="${url}" style="color:#003845;text-decoration:none;">${p.title}</a></td>
      <td style="padding:10px 12px;font-size:12px;color:#667;border-bottom:1px solid #eef2f4;white-space:nowrap;">${date}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef2f4;"><span style="font-size:11px;font-weight:700;color:#fff;background:${sc};padding:2px 8px;border-radius:20px;">${label}</span></td>
    </tr>`
  }).join('')

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `CES Medical — Posts scheduled for ${opts.weekLabel}`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7F8;font-family:'Work Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,56,69,0.08);">
        <tr><td style="background:#003845;padding:32px 40px;">
          <div style="color:#fff;font-size:22px;font-weight:800;">CES Medical</div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:2px;">Weekly campaign digest</div>
        </td></tr>
        <tr><td style="padding:40px 40px 0;">
          <p style="margin:0 0 4px;font-size:15px;color:#445;">Hi ${opts.toFirstName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#445;">Here are the <strong>${opts.posts.length} post${opts.posts.length !== 1 ? 's' : ''}</strong> scheduled for <strong>${opts.weekLabel}</strong>.</p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef2f4;border-radius:10px;overflow:hidden;">
            <thead><tr style="background:#F4F7F8;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#667;text-transform:uppercase;letter-spacing:0.05em;">Post</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#667;text-transform:uppercase;letter-spacing:0.05em;">Date</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#667;text-transform:uppercase;letter-spacing:0.05em;">Status</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 40px;">
          <a href="${PORTAL}/roadmap/" style="display:inline-block;background:#008080;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">Open roadmap →</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #eef2f4;">
          <p style="margin:0;font-size:12px;color:#aaa;">Sent by CES Medical · marketing@cesmedical.co.uk — please do not reply</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}

export async function sendScheduledThisWeekEmail(opts: {
  to: string
  toFirstName: string
  postTitle: string
  postSlug: string
  scheduledDate: string
  dateLabel: string
  movedBy: string
}): Promise<void> {
  const resend = client()
  if (!resend) return
  const postUrl = `${PORTAL}/post/${opts.postSlug}/`
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Post scheduled for this week: "${opts.postTitle}"`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7F8;font-family:'Work Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,56,69,0.08);">
        <tr><td style="background:#003845;padding:32px 40px;">
          <div style="color:#fff;font-size:22px;font-weight:800;">CES Medical</div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:2px;">Campaign Portal</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:15px;color:#445;">Hi ${opts.toFirstName},</p>
          <p style="margin:0 0 8px;font-size:15px;color:#445;">
            <strong>${opts.movedBy.split('@')[0]}</strong> just scheduled a post for <strong style="color:#008080;">${opts.dateLabel}</strong> — this week.
          </p>
          <p style="margin:0 0 32px;font-size:18px;font-weight:700;color:#003845;">${opts.postTitle}</p>
          <a href="${postUrl}" style="display:inline-block;background:#008080;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">View the post →</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #eef2f4;">
          <p style="margin:0;font-size:12px;color:#aaa;">Sent by CES Medical · marketing@cesmedical.co.uk — please do not reply</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}

export async function sendMentionEmail(opts: {
  to: string
  toFirstName: string
  byFirstName: string
  postTitle: string
  postSlug: string
  commentText: string
}): Promise<void> {
  const resend = client()
  if (!resend) return
  const postUrl = `${PORTAL}/post/${opts.postSlug}/`
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `${opts.byFirstName} mentioned you on "${opts.postTitle}"`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F4F7F8;font-family:'Work Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,56,69,0.08);">
        <tr><td style="background:#003845;padding:32px 40px;">
          <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">CES Medical</div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:2px;">Campaign Portal</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:15px;color:#445;">
            <strong>${opts.byFirstName}</strong> mentioned you in a comment on:
          </p>
          <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#003845;">${opts.postTitle}</p>
          <div style="background:#F4F7F8;border-left:4px solid #008080;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:32px;">
            <p style="margin:0;font-size:14px;color:#445;line-height:1.6;white-space:pre-wrap;">${opts.commentText}</p>
          </div>
          <a href="${postUrl}" style="display:inline-block;background:#008080;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">View the post →</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #eef2f4;">
          <p style="margin:0;font-size:12px;color:#aaa;">Sent by CES Medical · marketing@cesmedical.co.uk — please do not reply</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
