// Notifications disabled — functions are no-ops so call sites need no changes.

export function isThisWeek(date: string): boolean {
  const now = new Date()
  const day = now.getUTCDay() || 7
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1))
  const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6))
  const from = monday.toISOString().slice(0, 10)
  const to   = sunday.toISOString().slice(0, 10)
  return date >= from && date <= to
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function notifyStatusChange(_opts: unknown): Promise<void> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function notifyScheduledThisWeek(_opts: unknown): Promise<void> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function notifyNewComment(_opts: unknown): Promise<void> {}
