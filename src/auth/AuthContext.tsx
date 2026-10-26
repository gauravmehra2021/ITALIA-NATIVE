import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isApiConfigured } from '../config/api';
import type { Student } from '../api/types';
import { authService } from '../api/services';
import { clearSessionTokens, getSessionTokens, saveSessionTokens, subscribeSessionExpired } from '../api/sessionStore';

type AuthContextValue = {
  isLoading: boolean;
  bootError: string | null;
  isAuthenticated: boolean;
  student: Student | null;
  challengeId: string | null;
  beginLogin: (email: string, password: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        if (!isApiConfigured) {
          setStudent({
            id: 'student-demo',
            displayName: 'Alex Morgan',
            email: 'alex.morgan@example.com',
            preferredLanguage: 'en',
          });
          return;
        }
        const tokens = await getSessionTokens();
        if (tokens?.accessToken && mounted) {
          setStudent({ id: 'student', displayName: 'Student', email: '', preferredLanguage: 'en' });
        }
      } catch (cause) {
        if (mounted) {
          setBootError(cause instanceof Error ? cause.message : 'Secure session could not be restored.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restore();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => subscribeSessionExpired(() => {
    setChallengeId(null);
    setStudent(null);
  }), []);

  const beginLogin = useCallback(async (email: string, password: string) => {
    setChallengeId(null);
    const challenge = await authService.beginLogin(email, password);
    setChallengeId(challenge.challengeId);
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    if (!challengeId) {
      throw new Error('Request a new verification code before continuing.');
    }
    const session = await authService.verifyOtp(challengeId, code);
    await saveSessionTokens(session);
    setStudent(session.student);
    setChallengeId(null);
  }, [challengeId]);

  const signOut = useCallback(async () => {
    let logoutError: unknown;
    if (isApiConfigured) {
      try {
        await authService.logout();
      } catch (error) {
        logoutError = error;
      }
    }
    await clearSessionTokens();
    setStudent(isApiConfigured ? null : {
      id: 'student-demo',
      displayName: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      preferredLanguage: 'en',
    });
    if (logoutError) {
      throw logoutError;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isLoading,
    bootError,
    isAuthenticated: student !== null,
    student,
    challengeId,
    beginLogin,
    verifyOtp,
    signOut,
  }), [isLoading, bootError, student, challengeId, beginLogin, verifyOtp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}
