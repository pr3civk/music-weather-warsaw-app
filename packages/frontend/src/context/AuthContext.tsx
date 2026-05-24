import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { userSchema, type User, type LoginInput, type RegisterInput } from '@mw/shared';

const ME_KEY = ['auth', 'me'] as const;

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (vars: LoginInput) => Promise<User>;
  register: (vars: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const meQ = useQuery<User | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api.get('/api/auth/me', userSchema);
      } catch (e) {
        if ((e as { status?: number }).status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
  });

  const loginM = useMutation({
    mutationFn: (v: LoginInput) => api.post('/api/auth/login', v, userSchema),
    onSuccess: (u) => qc.setQueryData(ME_KEY, u),
  });

  const registerM = useMutation({
    mutationFn: (v: RegisterInput) => api.post('/api/auth/register', v, userSchema),
    onSuccess: (u) => qc.setQueryData(ME_KEY, u),
  });

  const logoutM = useMutation({
    mutationFn: () => api.postVoid('/api/auth/logout'),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });

  const value: AuthState = {
    user: meQ.data ?? null,
    loading: meQ.isPending,
    login: (v) => loginM.mutateAsync(v),
    register: (v) => registerM.mutateAsync(v),
    logout: async () => {
      await logoutM.mutateAsync();
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
