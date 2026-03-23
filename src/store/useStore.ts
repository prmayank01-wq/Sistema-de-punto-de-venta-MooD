import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Safe storage wrapper to handle iframe restrictions
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      console.warn('localStorage is not available, using memory storage');
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn('localStorage is not available, cannot save state');
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.warn('localStorage is not available, cannot remove state');
    }
  },
};

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
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ customTheme: state.customTheme, logoUrl: state.logoUrl, backgroundUrl: state.backgroundUrl }),
    }
  )
);
