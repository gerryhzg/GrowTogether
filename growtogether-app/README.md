# GrowTogether

GrowTogether is a local-first parent-kid growth journey app built for a hackathon MVP. It helps a child discover their interests, choose one meaningful goal, check in daily, and receive encouragement and activity ideas from a parent, all in one connected flow.

## Features

- Dashboard that shows the current journey, progress, reflection, and latest parent support
- Interest discovery and AI-assisted goal suggestions
- Daily check-in with progress updates and reflection prompts
- Parent Support Center with AI-assisted summaries, encouragement, and family activity ideas
- Growth Memory timeline and simple progress chart
- Local browser storage for MVP persistence
- Server-side OpenAI API routes with fallback behavior when no key is configured

## Run Locally

1. Open a terminal in `growtogether-app/`
2. Add your key in `.env.local`
3. Start the dev server:

```bash
npm.cmd run dev
```

4. Visit `http://localhost:3000`

## Environment

Create or update `.env.local`:

```env
OPENAI_API_KEY=your_key_here
```

If the key is missing or the AI response fails, the app still works with built-in fallback suggestions.

## Verification

- `npm.cmd run lint`
- `npm.cmd run build`
