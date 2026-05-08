import { Resend } from 'resend'

const FROM = 'CES Medical <noreply@cesmedical.co.uk>'
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
          <p style="margin:0;font-size:12px;color:#aaa;">Sent by CES Medical · noreply@cesmedical.co.uk — please do not reply to this email</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
          <p style="margin:0;font-size:12px;color:#aaa;">Sent by CES Medical · noreply@cesmedical.co.uk — please do not reply to this email</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
