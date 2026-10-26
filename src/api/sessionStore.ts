import * as Keychain from 'react-native-keychain';
import { ApiError } from './errors';

const SERVICE = 'com.sseuropa.student.session';
const ACCOUNT = 'student-session';
const sessionExpiredListeners = new Set<() => void>();

export function subscribeSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

export function notifySessionExpired(): void {
  sessionExpiredListeners.forEach(listener => listener());
}

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function getSessionTokens(): Promise<SessionTokens | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });
  if (!credentials) {
    return null;
  }

  try {
    const tokens: unknown = JSON.parse(credentials.password);
    if (
      typeof tokens === 'object' &&
      tokens !== null &&
      'accessToken' in tokens &&
      'refreshToken' in tokens &&
      typeof tokens.accessToken === 'string' &&
      typeof tokens.refreshToken === 'string'
    ) {
      return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
  } catch {
    await clearSessionTokens();
    return null;
  }

  await clearSessionTokens();
  return null;
}

export async function saveSessionTokens(tokens: SessionTokens): Promise<void> {
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new ApiError('The server returned an invalid session.', 500, 'invalid_session');
  }

  await Keychain.setGenericPassword(ACCOUNT, JSON.stringify(tokens), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearSessionTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
