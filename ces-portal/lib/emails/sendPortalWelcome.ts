import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

const FROM   = 'CES Medical <marketing@cesmedical.co.uk>'
const PORTAL = process.env.PORTAL_URL ?? process.env.AUTH_URL ?? 'https://marketing.cesmedical.co.uk/'

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Inline fallback used when ces_email_final.html has not been placed in the project root. */
function buildFallbackHtml(firstName: string, portalUrl: string): string {
  const safe = escapeHtml(firstName)
  const url  = escapeHtml(portalUrl)
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CES Medical Campaign Portal</title></head>
<body style="margin:0;padding:0;background:#F4F7F8;font-family:'Work Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,56,69,0.08);">

        <!-- Header -->
        <tr><td style="background:#003845;padding:28px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">CES Medical</span></td>
              <td align="right"><span style="color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:rgba(255,255,255,0.12);padding:4px 10px;border-radius:20px;">Campaign Portal</span></td>
            </tr>
          </table>
        </td></tr>

        <!-- Teal rule -->
        <tr><td style="background:#008080;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 36px;">
          <p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#003845;line-height:1.2;">Hi ${safe},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#445;line-height:1.65;">
            You have been granted access to the CES Medical Campaign Roadmap Portal — the central view of the social media campaign across all platforms and content pillars.
          </p>

          <!-- Feature list -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
            ${[
              ['View the full 164-post roadmap on the live canvas', '#003845'],
              ['Leave comments and flag issues on individual post cards', '#003845'],
              ['Tag colleagues using @mentions in comments', '#003845'],
              ['Track approval status across all platforms and pillars', '#003845'],
            ].map(([text]) => `
            <tr>
              <td style="padding:6px 0;vertical-align:top;width:20px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#008080;margin-top:5px;"></span>
              </td>
              <td style="padding:6px 0;font-size:14px;color:#445;line-height:1.55;">${text}</td>
            </tr>`).join('')}
          </table>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:10px;background:#008080;">
              <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;border-radius:10px;">Open the portal →</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 36px;border-top:1px solid #eef2f4;background:#fafbfc;">

          <!-- Social icons -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
            <tr>
              ${[
                ['https://www.facebook.com/cesmedical/',        'F',  '#1877F2'],
                ['https://x.com/cesmedicaluk',                 'X',  '#000000'],
                ['https://www.instagram.com/cesmedical/',       'IG', '#E1306C'],
                ['https://www.youtube.com/@CESMedical',         'YT', '#FF0000'],
                ['https://www.linkedin.com/company/cesmedical/', 'in', '#0077B5'],
              ].map(([href, label, bg]) => `
              <td style="padding-right:6px;">
                <a href="${href}" style="display:inline-block;width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:30px;text-decoration:none;">${label}</a>
              </td>`).join('')}
            </tr>
          </table>

          <p style="margin:0 0 4px;font-size:11px;color:#aaa;line-height:1.6;">
            CES Medical · Pantiles Chambers, 85 Mount Ephraim, Tunbridge Wells, TN4 8BS
          </p>
          <p style="margin:0;font-size:11px;color:#aaa;">
            <a href="https://www.cesmedical.co.uk/privacy-policy" style="color:#008080;text-decoration:none;">Privacy policy</a>
            &nbsp;·&nbsp;
            marketing@cesmedical.co.uk
            &nbsp;·&nbsp;
            <span>Please do not reply to this email</span>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// Role-specific feature line shown in the feature block.
// Returns a fully-formed <div class="fi">…</div> row, or empty string for viewers.
export function roleFeatureLine(role: string): string {
  const lines: Record<string, string> = {
    clinical_reviewer: 'Clinically review posts and move approved content to brand review',
    brand_reviewer:    'Review posts for brand and tone, and approve them for scheduling',
    admin:             'Manage users, sync content and administer the full roadmap',
    editor:            'Edit post copy, move statuses and manage the full campaign schedule',
  }
  const text = lines[role]
  if (!text) return ''
  return `<div class="fi"><div class="fd"></div><span class="ft">${text}</span></div>`
}

export interface SendPortalWelcomeParams {
  email:       string
  firstName:   string
  role?:       string
  portalUrl?:  string
}

export async function sendPortalWelcomeEmail({
  email,
  firstName,
  role = 'viewer',
  portalUrl = PORTAL,
}: SendPortalWelcomeParams): Promise<void> {
  const resend = client()
  if (!resend) {
    console.warn('[sendPortalWelcomeEmail] RESEND_API_KEY not set — skipping welcome email')
    return
  }

  let html: string

  // Try to load the finished template; fall back to inline if not placed yet.
  const templatePath = path.join(process.cwd(), 'ces_email_final.html')
  if (fs.existsSync(templatePath)) {
    const raw = fs.readFileSync(templatePath, 'utf-8')
    html = raw
      .replace(/\{\{first_name\}\}/g, escapeHtml(firstName))
      .replace(/\{\{portal_url\}\}/g, escapeHtml(portalUrl))
      .replace(/\{\{unsubscribe_url\}\}/g, '') // Resend handles via List-Unsubscribe header
      .replace(/\{\{role_feature\}\}/g, roleFeatureLine(role))
  } else {
    html = buildFallbackHtml(firstName, portalUrl)
  }

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: 'Your access to the CES Medical Campaign Portal',
    html,
    headers: {
      'List-Unsubscribe': '<mailto:marketing@cesmedical.co.uk?subject=unsubscribe>',
    },
  })

  if (error) {
    console.error('[sendPortalWelcomeEmail] Resend error:', error)
    throw new Error(`Failed to send welcome email to ${email}: ${(error as { message?: string }).message ?? String(error)}`)
  }
}
