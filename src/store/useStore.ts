import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'CAJERO';
}

interface CustomTheme {
  primary: string;
  secondary: string;
  tertiary: string;
  bg1: string;
  bg2: string;
  text: string;
  textSecondary: string;
}

interface AppState {
  user: User | null;
  theme: 'dark' | 'light';
  customTheme: CustomTheme;
  unreadNotifications: boolean;
  logoUrl: string | null;
  backgroundUrl: string | null;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCustomTheme: (theme: Partial<CustomTheme>) => void;
  setUnreadNotifications: (unread: boolean) => void;
  setLogoUrl: (url: string | null) => void;
  setBackgroundUrl: (url: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'dark',
      customTheme: {
        primary: '#ef4444',
        secondary: '#3b82f6',
        tertiary: '#10b981',
        bg1: '#18181b', // zinc-900
        bg2: '#09090b', // zinc-950
        text: '#ffffff',
        textSecondary: '#a1a1aa', // zinc-400
      },
      unreadNotifications: false,
      logoUrl: null,
      backgroundUrl: null,
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setCustomTheme: (theme) => set((state) => ({ 
        customTheme: { ...state.customTheme, ...theme } 
      })),
      setUnreadNotifications: (unread) => set({ unreadNotifications: unread }),
      setLogoUrl: (url) => set({ logoUrl: url }),
      setBackgroundUrl: (url) => set({ backgroundUrl: url }),
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({ customTheme: state.customTheme, logoUrl: state.logoUrl, backgroundUrl: state.backgroundUrl }),
    }
  )
);
