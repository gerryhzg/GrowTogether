"use client";

import { FormEvent, useState } from "react";
import { useAuth, UserRole } from "@/components/providers/auth-context";

const CHILD_AVATARS = ["Nova", "Pixel", "Rocket", "Skater", "Coder", "Artist"];
const PARENT_AVATARS = ["Guide", "Coach", "Anchor", "Spark", "Helper", "Leaf"];

type AuthMode = "sign-in" | "create";

export function LoginPage() {
  const { signIn, createParentAccount, createChildAccount } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [role, setRole] = useState<UserRole>("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(PARENT_AVATARS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isCreateMode = mode === "create";
  const isChild = role === "child";
  const avatars = isChild ? CHILD_AVATARS : PARENT_AVATARS;

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  function pickRole(nextRole: UserRole) {
    setRole(nextRole);
    setSelectedAvatar(nextRole === "child" ? CHILD_AVATARS[0] : PARENT_AVATARS[0]);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isCreateMode && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (isCreateMode && !roomCode.trim()) {
      setError(
        isChild
          ? "Ask your parent for the family code."
          : "Create a family code.",
      );
      return;
    }

    setLoading(true);
    const result = isCreateMode
      ? isChild
        ? await createChildAccount({
            email,
            password,
            name,
            roomCode,
            emoji: selectedAvatar,
          })
        : await createParentAccount({
            email,
            password,
            name,
            roomCode,
            emoji: selectedAvatar,
          })
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-secondary">
            GrowTogether
          </p>
          <h1 className="mt-3 font-display text-4xl text-foreground">
            Real family accounts
          </h1>
          <p className="mt-3 text-muted">
            Sign in with email and password so each family&apos;s data stays
            private.
          </p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-border bg-surface-strong p-6 shadow-xl">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-white/70 p-1">
            <button
              type="button"
              onClick={() => switchMode("sign-in")}
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                mode === "sign-in"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("create")}
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                mode === "create"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          {isCreateMode && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <RoleButton
                active={role === "parent"}
                title="Parent"
                description="Create the family code."
                onClick={() => pickRole("parent")}
              />
              <RoleButton
                active={role === "child"}
                title="Child"
                description="Join with a parent code."
                onClick={() => pickRole("child")}
              />
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Password
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3"
                type="password"
                autoComplete={isCreateMode ? "new-password" : "current-password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {isCreateMode && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Your name
                  </span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3"
                    placeholder={isChild ? "Child name" : "Parent name"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Family code
                  </span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 font-bold uppercase tracking-widest"
                    placeholder={isChild ? "Ask your parent" : "Example: SMITH-8K2Q"}
                    value={roomCode}
                    onChange={(event) =>
                      setRoomCode(event.target.value.toUpperCase())
                    }
                  />
                  <p className="mt-2 text-xs text-muted">
                    {isChild
                      ? "Your parent must create this code first."
                      : "Use a code that is hard to guess, like a family word plus random letters or numbers."}
                  </p>
                </label>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Avatar
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                          selectedAvatar === avatar
                            ? "border-accent bg-accent text-white"
                            : "border-border bg-white text-muted hover:text-foreground"
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-secondary py-4 font-bold text-white transition hover:bg-secondary/90 disabled:opacity-50"
            >
              {loading
                ? isCreateMode
                  ? "Creating account..."
                  : "Signing in..."
                : isCreateMode
                  ? isChild
                    ? "Create child account"
                    : "Create parent account"
                  : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function RoleButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.25rem] border p-4 text-left transition ${
        active
          ? "border-accent bg-accent-soft text-foreground"
          : "border-border bg-white text-muted hover:text-foreground"
      }`}
    >
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
    </button>
  );
}
