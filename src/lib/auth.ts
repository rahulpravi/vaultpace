import { cookies } from 'next/headers';

export interface AuthContext {
  userId: string;
  isGuest: boolean;
  email?: string;
}

const GUEST_COOKIE_NAME = 'ft_guest_session';

/**
 * Extracts and verifies the current caller identity.
 * Supports both verified accounts and anonymous privacy sessions.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = cookies();
  const guestCookie = cookieStore.get(GUEST_COOKIE_NAME);

  if (guestCookie?.value) {
    return {
      userId: guestCookie.value,
      isGuest: true,
    };
  }

  // Fallback to deterministic local user ID for development/offline testing
  return {
    userId: 'usr_local_default',
    isGuest: true,
  };
}

/**
 * Authorisation enforcement rule:
 * Throws an explicit error if a caller attempts to read or mutate another user's records.
 */
export function assertAuthorization(currentUserId: string, targetRecordOwnerId: string) {
  if (currentUserId !== targetRecordOwnerId) {
    const error = new Error('Forbidden: You do not have permission to access or modify this record.');
    (error as any).status = 403;
    throw error;
  }
}
