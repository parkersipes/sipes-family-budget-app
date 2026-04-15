// Display-friendly label for a Firebase Auth user. Falls back through
// displayName → email local-part → 'Unknown'.
export function userDisplayName(user) {
  if (!user) return null;
  if (user.displayName && user.displayName.trim()) return user.displayName.trim();
  if (user.email) {
    const local = user.email.split('@')[0];
    if (local) return local;
  }
  return null;
}
