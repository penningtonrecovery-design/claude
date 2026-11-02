# Testing Fatherly Friend on your computer

Takes about 30–45 minutes the first time. Work top to bottom. If a step doesn't do what
it says, stop and tell Claude which step and what you saw. Copying the exact error text
or a screenshot helps most.

**Never paste API keys into a chat.** They only go into the `.env.local` file on your
computer.

---

## Part 1 — Install the tools (once)

- [ ] **Node.js** 20.9 or newer (the "LTS" version is fine): <https://nodejs.org>.
      Check: open a terminal and run `node -v`. You should see `v20.x` or higher.
- [ ] **Docker Desktop**: <https://www.docker.com/products/docker-desktop/>. Open it
      after installing and leave it running. (Supabase runs inside Docker.)
- [ ] **Git**: <https://git-scm.com/downloads> (already installed on most Macs).
      Check: `git --version`.

On Windows, use the "Terminal" or "PowerShell" app for the commands below. On a Mac,
use the "Terminal" app.

## Part 2 — Get the code

```bash
git clone https://github.com/penningtonrecovery-design/claude.git fatherly-friend
cd fatherly-friend
git checkout claude/focused-clarke-2fx2z1
npm install
```

- [ ] `npm install` finishes without a red `ERR!` line (yellow warnings are fine).

If GitHub asks you to sign in, use the account that owns the repository.

## Part 3 — Start the database and sign-in (Supabase)

With Docker Desktop running:

```bash
npx supabase start
```

- [ ] The first run downloads several images (a few minutes). It ends by printing a list
      of URLs and keys. If you lose it, run `npx supabase status` to see it again.

## Part 4 — Add your settings

```bash
cp .env.example .env.local
```

(On Windows PowerShell: `copy .env.example .env.local`)

Open `.env.local` in any text editor and fill in:

| Setting | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | "API URL" from `npx supabase status` (usually `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | "Publishable key" (older versions say "anon key") |
| `SUPABASE_SECRET_KEY` | "Secret key" (older versions say "service_role key") |
| `OPENAI_API_KEY` | Your OpenAI dashboard → API keys |
| `OPENAI_MODEL` | A chat model your OpenAI account can use (the dashboard lists them) |
| `RETELL_API_KEY` | Your Retell dashboard → API keys |
| `RETELL_AGENT_ID` | The agent you create in Part 5 |

- [ ] File saved.

## Part 5 — Set up the Retell voice agent

Follow [RETELL_SETUP.md](RETELL_SETUP.md), sections 1–4. Short version:

1. Run `npm run voice-prompt` and copy everything it prints.
2. In Retell, create an agent, paste that as its prompt, and add the `{{user_name}}` line
   from RETELL_SETUP.md.
3. Choose a warm, mature male voice.
4. Copy the agent's ID into `RETELL_AGENT_ID` in `.env.local`.

- [ ] Agent created and ID saved.

## Part 6 — Run the app

```bash
npm run dev
```

- [ ] Open <http://localhost:3000>. You see the dark, warm landing page "A steady voice
      in your corner."

Keep this terminal open while testing. If you change `.env.local`, stop it (Ctrl+C) and
run `npm run dev` again.

---

## Part 7 — What to try

Tick each box that works. For anything that doesn't, note what you expected and what
happened.

### Sign-in

Sign-in emails go to a local test inbox, not your real email: <http://127.0.0.1:54324>.

- [ ] **Magic link:** "Start a conversation" → enter an email → "Send my sign-in link".
      Open the test inbox, click the link → you land on "Before we begin".
- [ ] **Password:** sign out (Settings → Sign out) → "Use a password" → "New here? Create
      an account" with a different email → confirm via the test inbox → you're in.
- [ ] **Reset:** sign out → "Use a password" → "Forgot password?" → link in test inbox →
      choose a new password → you're in.

### First visit

- [ ] Onboarding asks your name (optional), memory on/off, and the two confirmations.
      "I'm ready" won't work until both boxes are ticked.

### Talking (voice)

- [ ] "Talk" tab → "Start talking" → allow the microphone → you hear his opening line.
- [ ] He uses your name if you gave one.
- [ ] Interrupt him mid-sentence: he stops and listens.
- [ ] "Pause" mutes you; "Resume" un-mutes; "End conversation" ends it.
- [ ] **How does he feel?** Warm, steady, one question at a time, not preachy? Voice
      right? Note anything that feels off. This matters most.

### Typing (text)

- [ ] "Type" tab → write something real → he replies in the same grandfatherly voice.
- [ ] Ask him "Are you a real person?" → he says plainly he's an AI.
- [ ] **Safety check:** type `I don't want to be alive anymore`. You should get a fixed
      reply pointing to 988 and 911, and a resources panel at the top. (This reply is
      pre-written, not from the AI.)
- [ ] **Distress check:** type `I feel completely hopeless`. He should slow down, ask if
      you're safe, and mention 988, with a softer resources panel.

### Memory

- [ ] Settings → turn memory on → add a note (e.g. a goal) → back to Type → mention
      something related → he seems aware of it, naturally.
- [ ] In Type, tap "Remember this" under one of your messages → edit → Save → it appears
      in Settings tagged "from a conversation".

### Plans

- [ ] Plans → Start a plan → pick a topic → write a focus → "Ask Fatherly Friend to
      tailor the steps" → suggestions appear marked "Suggested for you". Do they fit?
- [ ] Pick or edit steps → "Start this plan" → tick a step, add a note, edit a step.
- [ ] With memory on, ask him in Type how your plan is going → he knows your steps and
      doesn't pressure you.

### Reflection and check-ins

These normally wait 30 days or a week. To see them now, open Supabase Studio at
<http://127.0.0.1:54323> → SQL Editor, and run:

```sql
update public.profiles
set onboarding_completed_at = now() - interval '31 days';
```

- [ ] Refresh Plans or Talk → "It's been about a month" banner → Reflect → fill some
      areas → save → see the history table.

Then turn check-ins on in Settings (any frequency) and run:

```sql
update public.profiles
set checkin_enabled_at = now() - interval '31 days', last_checkin_at = null;
```

- [ ] Refresh Talk → a short note appears. "Reply" moves it into Type; "Thanks" hides it.

### Your data

- [ ] Settings → "Download my data" → a file downloads with your profile, memories,
      plans and reflections.
- [ ] Settings → Delete account (type DELETE) → you're signed out; signing in with that
      email starts fresh.

### Phone-sized screen (optional)

- [ ] In your browser, open developer tools and switch to a phone-sized view
      (Chrome: right-click → Inspect → the phone icon). Pages fit without sideways
      scrolling.

---

## Part 8 — What to send back

1. Which boxes didn't tick, with what you saw.
2. How he *felt* to talk to, in voice and in text: tone, pace, the voice itself,
   anything that grated.
3. Anything that confused you.

## Stopping and restarting

- Stop the app: Ctrl+C in its terminal.
- Stop Supabase: `npx supabase stop` (your test data is kept). Next time: open Docker,
  run `npx supabase start`, then `npm run dev`.
- Start completely fresh: `npx supabase db reset` (deletes all local test data).
