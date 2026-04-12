'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'free' | 'pro' | 'enterprise';
  joinedAt: string;
}

export interface DraftCV {
  id: string;
  title: string;
  templateId: number;
  templateName: string;
  lastEdited: string;
  createdAt: string;
  status: 'draft' | 'completed' | 'shared';
  fullName: string;
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

// ── Mock User Data ──
const MOCK_USER: User = {
  id: 'usr_001',
  name: 'Islem Charaf Eddine',
  email: 'islem@oosira.com',
  avatar: '',
  plan: 'pro',
  joinedAt: '2025-11-15',
};

// ── Mock Draft CVs ──
const MOCK_DRAFTS: DraftCV[] = [
  {
    id: 'cv_001',
    title: 'Software Engineer CV',
    templateId: 5,
    templateName: 'Tech & IT',
    lastEdited: '2026-04-11T18:30:00',
    createdAt: '2026-04-01T10:00:00',
    status: 'completed',
    fullName: 'Islem Charaf Eddine',
    jobTitle: 'Full Stack Developer',
    completionPercent: 100,
    previewColor: '#0D1117',
  },
  {
    id: 'cv_002',
    title: 'Senior Engineer Application',
    templateId: 2,
    templateName: 'Ingenieur',
    lastEdited: '2026-04-10T14:20:00',
    createdAt: '2026-03-28T09:00:00',
    status: 'draft',
    fullName: 'Islem Charaf Eddine',
    jobTitle: 'Ingénieur Logiciel Senior',
    completionPercent: 72,
    previewColor: '#2C3E50',
  },
  {
    id: 'cv_003',
    title: 'Freelance Portfolio',
    templateId: 3,
    templateName: 'Cadre Moderne',
    lastEdited: '2026-04-08T11:45:00',
    createdAt: '2026-03-20T15:00:00',
    status: 'draft',
    fullName: 'Islem C.E.',
    jobTitle: 'Consultant Freelance',
    completionPercent: 45,
    previewColor: '#1A1A2E',
  },
  {
    id: 'cv_004',
    title: 'Academic Resume',
    templateId: 1,
    templateName: 'Classique Pro',
    lastEdited: '2026-04-05T09:10:00',
    createdAt: '2026-03-15T12:00:00',
    status: 'completed',
    fullName: 'Islem Charaf Eddine',
    jobTitle: 'Chercheur / Doctorant',
    completionPercent: 100,
    previewColor: '#1B3A6B',
  },
  {
    id: 'cv_005',
    title: 'Medical Application',
    templateId: 4,
    templateName: 'Medical',
    lastEdited: '2026-03-30T16:00:00',
    createdAt: '2026-03-10T08:00:00',
    status: 'shared',
    fullName: 'Islem C.E.',
    jobTitle: 'Clinical Data Analyst',
    completionPercent: 88,
    previewColor: '#2563EB',
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [drafts, setDrafts] = useState<DraftCV[]>(MOCK_DRAFTS);

  useEffect(() => {
    const saved = localStorage.getItem('sira-auth');
    if (saved === 'true') {
      setUser(MOCK_USER);
    }
  }, []);

  const login = async (_email: string, _password: string): Promise<boolean> => {
    // Mock: always succeed
    setUser(MOCK_USER);
    localStorage.setItem('sira-auth', 'true');
    return true;
  };

  const register = async (_name: string, _email: string, _password: string): Promise<boolean> => {
    setUser(MOCK_USER);
    localStorage.setItem('sira-auth', 'true');
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sira-auth');
  };

  const deleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const duplicateDraft = (id: string) => {
    const original = drafts.find((d) => d.id === id);
    if (!original) return;
    const newDraft: DraftCV = {
      ...original,
      id: `cv_${Date.now()}`,
      title: `${original.title} (Copy)`,
      lastEdited: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'draft',
      completionPercent: original.completionPercent,
    };
    setDrafts((prev) => [newDraft, ...prev]);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, drafts, deleteDraft, duplicateDraft }}>
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
