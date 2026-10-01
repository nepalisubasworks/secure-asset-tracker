export type MinimalUser = { id: string; role: string };

export function isAdmin(user: MinimalUser): boolean {
  return user.role === "ADMIN";
}

export function canAccessResource(user: MinimalUser, resourceOwnerId: string): boolean {
  if (user.role === "ADMIN") return true;
  return user.id === resourceOwnerId;
}