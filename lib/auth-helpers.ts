import { auth } from "@/auth";
export { canAccessResource, isAdmin } from "@/lib/permissions";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export type AuthResult =
  | { ok: true; user: { id: string; role: string; email?: string | null; name?: string | null } }
  | { ok: false; status: number; message: string };

export async function requireAuth(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, status: 401, message: "You must be signed in." };
  }
  return { ok: true, user };
}

export async function requireRole(role: string): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;
  if (result.user.role !== role) {
    return { ok: false, status: 403, message: `Requires ${role} role.` };
  }
  return result;
}