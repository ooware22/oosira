'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { loginAuth, logoutAuth } from '@/store/slices/authSlice';
import { duplicateDraft, removeDraft, fetchDrafts } from '@/store/slices/cvsSlice';

// Expose same typings for UI
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: string;
  joinedAt?: string;
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
}

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  drafts: DraftCV[];
  deleteDraft: (id: string) => void;
  duplicateDraft: (id: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  
  // Read state straight from Redux Store
  const user = useSelector((state: RootState) => state.auth.user) as User | null;
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const drafts = useSelector((state: RootState) => state.cvs.drafts);
  const cvsStatus = useSelector((state: RootState) => state.cvs.status);

  useEffect(() => {
    // Initial fetch of mock data
    if (cvsStatus === 'idle') {
      dispatch(fetchDrafts());
    }
  }, [cvsStatus, dispatch]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await dispatch(loginAuth({ email, password })).unwrap();
      return true;
    } catch {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      await dispatch(loginAuth({ email, password })).unwrap(); // mocked mapping 
      return true;
    } catch {
      return false;
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

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      register,
      logout,
      drafts,
      deleteDraft,
      duplicateDraft: handleDuplicateDraft
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
