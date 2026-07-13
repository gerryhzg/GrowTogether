# GrowTogether

GrowTogether is a parent-kid growth journey app. It helps a child discover interests, choose a meaningful goal, check in daily, and receive encouragement and activity ideas from a parent.

This guide is written for beginners. Follow the steps in order.

## What You Need Before Starting

Install these first:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) version 20 or newer
- A code editor, such as [Visual Studio Code](https://code.visualstudio.com/)

To check that Git and Node are installed, open PowerShell or Terminal and run:

```bash
git --version
node --version
npm --version
```

If each command prints a version number, you are ready.

## 1. Clone The Repo To Your Computer

Choose a folder where you want to keep the project. For example, you can use your Desktop.

Open PowerShell or Terminal and run:

```bash
cd Desktop
git clone https://github.com/gerryhzg/GrowTogether.git
```

Go into the app folder:

```bash
cd GrowTogether/growtogether-app
```

Open the project in VS Code:

```bash
code .
```

If `code .` does not work, open VS Code manually and choose `File > Open Folder`, then select the `growtogether-app` folder.

## 2. Create Your Own Branch

Do not make changes directly on the `main` branch. Create your own branch first.

Make sure you are starting from the latest `main` branch:

```bash
git checkout main
git pull origin main
```

Create and switch to your new branch:

```bash
git checkout -b your-name/short-description
```

Example:

```bash
git checkout -b gerry/update-readme
```

Check which branch you are on:

```bash
git branch
```

The branch with `*` next to it is your current branch.

## 3. Install The App

You only need to install packages the first time you set up the project, or after someone changes `package.json`.

Run this inside the `growtogether-app` folder:

```bash
npm install
```

This creates a `node_modules` folder. That folder is not pushed to GitHub.

## 4. Create Your Environment File

Create a file named `.env.local` in the `growtogether-app` folder.

You can copy `.env.example` as a starting point. Add these lines:

```env
DEEPSEEK_API_KEY=your_deepseek_key_here
DEEPSEEK_MODEL=deepseek-v4-flash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_deepseek_key_here` with your real DeepSeek API key.
Replace the Supabase values with your project URL and anon key from Supabase `Project Settings > API`.

If you do not have an API key yet, the app can still run. Some AI features will use built-in fallback suggestions.

To get a DeepSeek API key:

1. Go to [DeepSeek Platform](https://platform.deepseek.com/).
2. Sign in or create an account.
3. Open `API keys`.
4. Create a new key.
5. Put the key in `.env.local` as `DEEPSEEK_API_KEY=your_key_here`.

DeepSeek charges from your topped-up balance. To keep spending near $10/month, top up only $10 at a time and check the usage/billing page regularly. If DeepSeek adds a hard monthly budget control in your account, set that budget to `$10`; otherwise, a $10 balance is the practical cap.

To create families and save parent/child profiles, the Supabase database also needs the app tables and policies. In Supabase, open `SQL Editor`, paste the contents of `supabase-setup.sql`, and run it once for your project.

Important: do not commit `.env.local`. It contains private information and is already ignored by Git.

## 5. Run The App On Your Machine

Start the development server:

```bash
npm.cmd run dev
```

If you are on macOS, Linux, or Git Bash, use:

```bash
npm run dev
```

Open this page in your browser:

```text
http://localhost:3000
```

To stop the app, go back to the terminal and press:

```text
Ctrl + C
```

## 6. Make Changes And Check Your Work

Before pushing your code, run:

```bash
npm.cmd run lint
npm.cmd run build
```

On macOS, Linux, or Git Bash:

```bash
npm run lint
npm run build
```

If both commands finish without errors, your code is in better shape to share.

## 7. Save Your Changes With Git

See which files changed:

```bash
git status
```

Add the files you want to save:

```bash
git add .
```

Create a commit:

```bash
git commit -m "Describe what you changed"
```

Example:

```bash
git commit -m "Update README setup instructions"
```

## 8. Push Your Branch To GitHub

The first time you push a new branch, run:

```bash
git push -u origin your-name/short-description
```

Example:

```bash
git push -u origin gerry/update-readme
```

After that first push, you can usually run:

```bash
git push
```

## 9. Pull Latest Code From Main

Do this often so your branch stays up to date.

First, save or commit your current work. Then run:

```bash
git checkout main
git pull origin main
git checkout your-name/short-description
git merge main
```

Example:

```bash
git checkout main
git pull origin main
git checkout gerry/update-readme
git merge main
```

If Git says there are conflicts, open the files it lists, fix the conflict markers, then run:

```bash
git add .
git commit
```

## Common Problems

### `npm.cmd` is not recognized

Try this instead:

```bash
npm run dev
```

If that also fails, make sure Node.js is installed and restart your terminal.

### Port 3000 is already in use

Another app is already using `http://localhost:3000`. Stop the other app, or follow the terminal message if Next.js offers a different port.

### I am on the wrong branch

Check your branch:

```bash
git branch
```

Switch branches:

```bash
git checkout branch-name
```

### I want to see what changed

Run:

```bash
git status
git diff
```

## Useful Commands

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
git status
git branch
git pull origin main
git push
```
