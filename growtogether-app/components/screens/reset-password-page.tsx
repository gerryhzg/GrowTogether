"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-context";
import { supabase } from "@/lib/supabase-client";

const PASSWORD_RESET_CONFIRMATION =
  "If an account exists for this email, we sent a password reset link.";

export function ResetPasswordPage() {
  const { updatePassword, requestPasswordReset } = useAuth();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setHasSession(Boolean(data.session));
        setCheckingSession(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setPasswordUpdated(true);
    setPassword("");
    setConfirmation("");
  }

  async function handleNewResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNotice(PASSWORD_RESET_CONFIRMATION);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-secondary">
            GrowTogether
          </p>
          <h1 className="mt-3 font-display text-4xl text-foreground">
            {passwordUpdated ? "Password updated" : "Choose a new password"}
          </h1>
        </div>

        <div className="mt-8 rounded-[2rem] border border-border bg-surface-strong p-6 shadow-xl">
          {checkingSession ? (
            <p className="text-center text-muted">Checking your reset link...</p>
          ) : passwordUpdated ? (
            <div className="text-center">
              <p className="text-muted">
                Your new password is ready. You can continue to GrowTogether.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-full bg-secondary px-6 py-3 font-bold text-white transition hover:bg-secondary/90"
              >
                Return to the app
              </Link>
            </div>
          ) : hasSession ? (
            <form className="space-y-5" onSubmit={handlePasswordUpdate}>
              <p className="text-sm text-muted">
                Use at least 6 characters for your new password.
              </p>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  New password
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Confirm new password
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>

              {error && <ErrorMessage message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-secondary py-4 font-bold text-white transition hover:bg-secondary/90 disabled:opacity-50"
              >
                {loading ? "Updating password..." : "Update password"}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleNewResetRequest}>
              <div>
                <h2 className="font-display text-2xl text-foreground">
                  This reset link is invalid or expired
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Enter your email to request a new password reset link.
                </p>
              </div>

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

              {error && <ErrorMessage message={error} />}
              {notice && (
                <p className="rounded-xl bg-secondary-soft p-3 text-sm text-foreground">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-secondary py-4 font-bold text-white transition hover:bg-secondary/90 disabled:opacity-50"
              >
                {loading ? "Sending reset link..." : "Send a new reset link"}
              </button>

              <Link
                href="/"
                className="block text-center text-sm font-semibold text-muted transition hover:text-foreground"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{message}</p>
  );
}
