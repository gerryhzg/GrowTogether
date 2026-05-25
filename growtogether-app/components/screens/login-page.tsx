"use client";

import { useState } from "react";
import { useAuth, UserRole } from "@/components/providers/auth-context";

const CHILD_EMOJIS = ["🦄", "🐸", "🐼", "🦊", "🐙", "🦋", "🐬", "🦁"];
const PARENT_EMOJIS = ["🌟", "☕", "🌿", "📚", "🎯", "🌸", "🍀", "🦅"];

export function LoginPage() {
  const { login } = useAuth();
  const [step, setStep] = useState<"pick-role" | "setup">("pick-role");
  const [role, setRole] = useState<UserRole>("child");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function pickRole(r: UserRole) {
    setRole(r);
    setSelectedEmoji(r === "child" ? CHILD_EMOJIS[0] : PARENT_EMOJIS[0]);
    setStep("setup");
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("Please enter your name!"); return; }
    if (!roomCode.trim()) { setError("Please enter a room code!"); return; }
    if (!selectedEmoji) { setError("Pick your avatar!"); return; }

    setLoading(true);
    const result = await login(name.trim(), role, selectedEmoji, roomCode.trim());
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  if (step === "pick-role") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="text-6xl">🌱</div>
            <h1 className="mt-4 font-display text-4xl text-foreground">GrowTogether</h1>
            <p className="mt-2 text-muted">Build one shared growth story at a time.</p>
          </div>
          <div className="mt-10 space-y-4">
            <button
              onClick={() => pickRole("child")}
              className="w-full rounded-[2rem] bg-pink-400 p-6 text-left text-white shadow-lg transition hover:bg-pink-500 hover:scale-[1.02]"
            >
              <div className="text-4xl">🧒</div>
              <h2 className="mt-3 text-2xl font-bold">I am a Child</h2>
              <p className="mt-1 text-sm text-pink-100">Track my goals and show my progress!</p>
            </button>
            <button
              onClick={() => pickRole("parent")}
              className="w-full rounded-[2rem] bg-emerald-700 p-6 text-left text-white shadow-lg transition hover:bg-emerald-800 hover:scale-[1.02]"
            >
              <div className="text-4xl">👨‍👩‍👧</div>
              <h2 className="mt-3 text-2xl font-bold">I am a Parent</h2>
              <p className="mt-1 text-sm text-emerald-200">Support and guide my child's growth.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isChild = role === "child";
  const emojis = isChild ? CHILD_EMOJIS : PARENT_EMOJIS;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => { setStep("pick-role"); setError(""); }}
          className="mb-6 text-sm text-muted hover:text-foreground"
        >← Back</button>

        <div className={`rounded-[2rem] p-8 shadow-xl ${isChild ? "bg-pink-50 border-2 border-pink-200" : "bg-slate-50 border-2 border-slate-200"}`}>
          <div className="text-center">
            <div className="text-5xl">{isChild ? "🧒" : "👨‍👩‍👧"}</div>
            <h2 className={`mt-3 font-display text-3xl ${isChild ? "text-pink-600" : "text-emerald-800"}`}>
              {isChild ? "Hey there! 👋" : "Welcome, Parent"}
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {isChild ? "What's your name? 😊" : "Your name"}
              </label>
              <input
                className="w-full rounded-2xl border border-border bg-white px-4 py-3"
                placeholder={isChild ? "e.g. Alex" : "e.g. Sarah"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Room Code 🏠
              </label>
              <input
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 uppercase font-bold tracking-widest"
                placeholder="e.g. SMITH2024"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
              <p className="mt-1 text-xs text-muted">
                {isChild ? "Ask your parent for the room code!" : "Make up a code your whole family will share e.g. SMITH2024"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {isChild ? "Pick your avatar! 🎨" : "Choose your avatar"}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`rounded-2xl py-3 text-3xl transition ${
                      selectedEmoji === emoji
                        ? isChild ? "bg-pink-400 scale-110 shadow-md" : "bg-emerald-600 scale-110 shadow-md"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full rounded-full py-4 font-bold text-white transition hover:shadow-lg disabled:opacity-50 ${
                isChild ? "bg-pink-500 hover:bg-pink-600" : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              {loading ? "Setting up..." : isChild ? "Let's go! 🚀" : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
