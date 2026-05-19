/**
 * Quick smoke-test for the portal welcome email.
 * Run with: npx tsx scripts/testWelcomeEmail.ts
 *
 * Requires RESEND_API_KEY in .env.local (or environment).
 */
import 'dotenv/config'
import { sendPortalWelcomeEmail } from '../lib/emails/sendPortalWelcome'

const TEST_EMAIL  = process.env.TEST_EMAIL  ?? 'kush@alastralabs.com'
const FIRST_NAME  = process.env.FIRST_NAME  ?? 'Kushtrim'
const PORTAL_URL  = process.env.PORTAL_URL  ?? 'https://ces-medical.pixable.workers.dev'

console.log(`Sending test welcome email to ${TEST_EMAIL}…`)

sendPortalWelcomeEmail({
  email:     TEST_EMAIL,
  firstName: FIRST_NAME,
  portalUrl: PORTAL_URL,
})
  .then(() => console.log('✓ Test email sent — check your inbox'))
  .catch(err => { console.error('✗ Failed:', err.message); process.exit(1) })
