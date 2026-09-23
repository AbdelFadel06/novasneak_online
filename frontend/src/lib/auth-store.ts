"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  setTokens: (access: string, refresh: string, username: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      username: null,
      setTokens: (accessToken, refreshToken, username) =>
        set({ accessToken, refreshToken, username }),
      clear: () => set({ accessToken: null, refreshToken: null, username: null }),
    }),
    { name: "novasneak-admin-auth" }
  )
);
