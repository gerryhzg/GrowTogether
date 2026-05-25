"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase-client";

export type UserRole = "child" | "parent";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  emoji: string;
  familyCode: string;
  familyId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (name: string, role: UserRole, emoji: string, roomCode: string) => Promise<{ error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_KEY = "growtogether.auth.v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setIsLoading(false);
  }, []);

  async function login(name: string, role: UserRole, emoji: string, roomCode: string) {
    const code = roomCode.trim().toUpperCase();
    let familyId = "";

    const { data: existingFamily } = await supabase
      .from("families")
      .select("id")
      .eq("room_code", code)
      .single();

    if (existingFamily) {
      familyId = existingFamily.id;
    } else {
      const { data: newFamily, error } = await supabase
        .from("families")
        .insert({ room_code: code })
        .select("id")
        .single();
      if (error || !newFamily) return { error: "Could not create family. Please try again." };
      familyId = newFamily.id;
    }

    const { data: newUser, error: userError } = await supabase
      .from("family_users")
      .insert({ family_id: familyId, name, role, emoji })
      .select("id")
      .single();

    if (userError || !newUser) return { error: "Could not save your profile. Please try again." };

    const authUser: AuthUser = { id: newUser.id, name, role, emoji, familyCode: code, familyId };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    setUser(authUser);
    return {};
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
