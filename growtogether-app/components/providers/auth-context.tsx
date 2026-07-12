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

function serializeSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const source = error as {
    code?: unknown;
    details?: unknown;
    hint?: unknown;
    message?: unknown;
  };

  return {
    code: typeof source.code === "string" ? source.code : undefined,
    details: typeof source.details === "string" ? source.details : undefined,
    hint: typeof source.hint === "string" ? source.hint : undefined,
    message: typeof source.message === "string" ? source.message : String(error),
  };
}

function getSupabaseErrorMessage(error: unknown) {
  const { message } = serializeSupabaseError(error);
  if (message) {
    if (process.env.NODE_ENV === "development") {
      return message;
    }
  }
  return "Please try again.";
}

function warnHandledSupabaseError(message: string, error: unknown) {
  console.warn(message, serializeSupabaseError(error));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  async function login(name: string, role: UserRole, emoji: string, roomCode: string) {
    const code = roomCode.trim().toUpperCase();
    let familyId = "";

    const { data: existingFamily, error: familyLookupError } = await supabase
      .from("families")
      .select("id")
      .eq("room_code", code)
      .maybeSingle();

    if (familyLookupError) {
      warnHandledSupabaseError("Could not look up family", familyLookupError);
      return { error: `Could not look up family. ${getSupabaseErrorMessage(familyLookupError)}` };
    }

    if (existingFamily) {
      familyId = existingFamily.id;
    } else {
      const { data: newFamily, error } = await supabase
        .from("families")
        .insert({ room_code: code })
        .select("id")
        .single();
      if (error) {
        warnHandledSupabaseError("Could not create family", error);
        return { error: `Could not create family. ${getSupabaseErrorMessage(error)}` };
      }
      if (!newFamily) {
        console.warn("Could not create family: Supabase returned no family row.");
        return { error: "Could not create family. Please try again." };
      }
      familyId = newFamily.id;
    }

    const { data: newUser, error: userError } = await supabase
      .from("family_users")
      .insert({ family_id: familyId, name, role, emoji })
      .select("id")
      .single();

    if (userError) {
      warnHandledSupabaseError("Could not save family user", userError);
      return { error: `Could not save your profile. ${getSupabaseErrorMessage(userError)}` };
    }
    if (!newUser) {
      console.warn("Could not save family user: Supabase returned no user row.");
      return { error: "Could not save your profile. Please try again." };
    }

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
