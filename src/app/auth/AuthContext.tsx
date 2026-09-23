'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { loginAuth, registerAuth, logoutAuth, hydrateAuth } from '@/store/slices/authSlice';
import { duplicateDraft, removeDraft, fetchDrafts } from '@/store/slices/cvsSlice';
import type { ApiErrorLike } from '@/app/lib/authErrors';

// Expose same typings for UI
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: string;
  effectivePlan?: string;
  ocrTrialUsed?: boolean;
  pdfDownloadsThisMonth?: number;
  joinedAt?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

export interface DraftCV {
  id: string;
  title: string;
  templateId?: number;
  templateName: string;
  lastEdited: string;
  createdAt?: string;
  status: 'draft' | 'completed' | 'shared';
  fullName?: string;
  jobTitle: string;
  completionPercent: number;
  previewColor: string;
  reminderDate?: string | null;
}

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<true | ApiErrorLike>;
  register: (name: string, email: string, password: string) => Promise<true | ApiErrorLike>;
  logout: () => void;
  drafts: DraftCV[];
  deleteDraft: (id: string) => void;
  duplicateDraft: (id: string) => void;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  
  // Read state straight from Redux Store
  const user = useSelector((state: RootState) => state.auth.user) as User | null;
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const drafts = useSelector((state: RootState) => state.cvs.drafts);
  const authStatus = useSelector((state: RootState) => state.auth.status);
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  // Hydrate session from localStorage on mount
  useEffect(() => {
    if (authStatus === 'idle') {
      dispatch(hydrateAuth());
    }
  }, [authStatus, dispatch]);

  // Fetch drafts when authenticated, and again whenever the account changes:
  // after an expired session (no logout, so the flag never went false) a
  // different person can log in and must not keep seeing the previous CVs.
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchDrafts());
    }
  }, [isAuthenticated, userId, dispatch]);

  /** `true` on success, otherwise the error (status + response body) so the
   *  page can tell the user exactly what went wrong (lib/authErrors.ts). */
  const login = async (email: string, password: string): Promise<true | ApiErrorLike> => {
    try {
      await dispatch(loginAuth({ email, password })).unwrap();
      return true;
    } catch (err) {
      return err as ApiErrorLike;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<true | ApiErrorLike> => {
    try {
      await dispatch(registerAuth({ name, email, password })).unwrap();
      return true;
    } catch (err) {
      return err as ApiErrorLike;
    }
  };

  const logout = () => {
    dispatch(logoutAuth());
  };

  const deleteDraft = (id: string) => {
    dispatch(removeDraft(id));
  };

  const handleDuplicateDraft = (id: string) => {
    dispatch(duplicateDraft(id));
  };

  const isHydrating = authStatus === 'idle' || authStatus === 'loading';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isHydrating,
      login,
      register,
      logout,
      drafts,
      deleteDraft,
      duplicateDraft: handleDuplicateDraft,
      refreshUser: () => dispatch(hydrateAuth()),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
