'use server'

export async function verifyAdminInviteCode(code: string): Promise<boolean> {
  const expected = process.env.ADMIN_INVITE_CODE
  if (!expected) return false
  return code.trim() === expected.trim()
}
