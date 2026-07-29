"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
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
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  createParentAccount: (data: AccountSetupData) => Promise<{ error?: string }>;
  createChildAccount: (data: AccountSetupData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

type AccountSetupData = {
  email: string;
  password: string;
  name: string;
  emoji: string;
  roomCode: string;
};

type FamilyProfileRow = {
  id: string;
  name: string;
  role: UserRole;
  emoji: string;
  family_id: string;
  families: {
    room_code: string;
  } | null;
};

type RpcProfileRow = {
  id: string;
  name: string;
  role: UserRole;
  emoji: string;
  family_id: string;
  room_code: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const LEGACY_AUTH_KEY = "growtogether.auth.v2";

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
    message:
      typeof source.message === "string" ? source.message : String(error),
  };
}

function getSupabaseErrorMessage(error: unknown) {
  const { message } = serializeSupabaseError(error);
  if (message && process.env.NODE_ENV === "development") {
    return message;
  }
  return "Please try again.";
}

function warnHandledSupabaseError(message: string, error: unknown) {
  console.warn(message, serializeSupabaseError(error));
}

function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

function toAuthUser(row: FamilyProfileRow | RpcProfileRow): AuthUser {
  const familyCode =
    "room_code" in row ? row.room_code : row.families?.room_code ?? "";

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    emoji: row.emoji,
    familyCode,
    familyId: row.family_id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      return false;
    }

    const { data, error } = await supabase
      .from("family_users")
      .select("id,name,role,emoji,family_id,families!inner(room_code)")
      .eq("auth_user_id", session.user.id)
      .single<FamilyProfileRow>();

    if (error) {
      warnHandledSupabaseError("Could not load signed-in profile", error);
      setUser(null);
      setIsLoading(false);
      return false;
    }

    setUser(toAuthUser(data));
    setIsLoading(false);
    return true;
  }, []);

  useEffect(() => {
    localStorage.removeItem(LEGACY_AUTH_KEY);

    queueMicrotask(async () => {
      const { data } = await supabase.auth.getSession();
      await loadProfile(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        loadProfile(session);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  async function signIn(email: string, password: string) {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setIsLoading(false);
      return { error: `Could not sign in. ${getSupabaseErrorMessage(error)}` };
    }

    const loaded = await loadProfile(data.session);
    if (!loaded) {
      return {
        error:
          "Signed in, but no family profile was found. Create or join a family to finish setup.",
      };
    }

    return {};
  }

  async function createAccount(
    data: AccountSetupData,
    role: UserRole,
  ): Promise<{ error?: string }> {
    setIsLoading(true);

    const { data: existingSessionData } = await supabase.auth.getSession();
    let activeSession = existingSessionData.session;

    if (!activeSession) {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
        });

      if (signUpError) {
        setIsLoading(false);
        return {
          error: `Could not create account. ${getSupabaseErrorMessage(signUpError)}`,
        };
      }

      activeSession = signUpData.session;
    }

    if (!activeSession) {
      setIsLoading(false);
      return {
        error:
          "Account created, but email confirmation is enabled. Confirm your email, then sign in.",
      };
    }

    const normalizedRoomCode = normalizeRoomCode(data.roomCode);
    const rpcName =
      role === "parent"
        ? "create_family_for_current_user"
        : "join_family_by_code";
    const rpcArgs =
      role === "parent"
        ? {
            p_room_code: normalizedRoomCode,
            p_name: data.name.trim(),
            p_emoji: data.emoji,
          }
        : {
            p_room_code: normalizedRoomCode,
            p_name: data.name.trim(),
            p_role: role,
            p_emoji: data.emoji,
          };

    const { data: profileRows, error: profileError } = await supabase.rpc(
      rpcName,
      rpcArgs,
    );

    if (profileError) {
      warnHandledSupabaseError("Could not create account profile", profileError);
      setUser(null);
      setIsLoading(false);
      return {
        error: `Profile setup failed. ${getSupabaseErrorMessage(profileError)}`,
      };
    }

    const profile = Array.isArray(profileRows)
      ? (profileRows[0] as RpcProfileRow | undefined)
      : (profileRows as RpcProfileRow | null);

    if (!profile) {
      setUser(null);
      setIsLoading(false);
      return { error: "Account created, but profile setup failed." };
    }

    setUser(toAuthUser(profile));
    setIsLoading(false);
    return {};
  }

  async function createParentAccount(data: AccountSetupData) {
    return createAccount(data, "parent");
  }

  async function createChildAccount(data: AccountSetupData) {
    return createAccount(data, "child");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        createParentAccount,
        createChildAccount,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
