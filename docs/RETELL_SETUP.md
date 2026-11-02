# Setting up the Retell voice agent

Voice conversations run on a Retell agent that you configure in the Retell dashboard. The
app starts calls with that agent; it doesn't create or change the agent itself.

## 1. Create the agent

1. In the Retell dashboard, create a new agent using Retell's built-in LLM (single prompt).
2. Paste the persona prompt as the agent's prompt. Print it with:

   ```bash
   npm run voice-prompt
   ```

   This is the same prompt the text conversation uses, from
   `src/lib/persona/system-prompt.ts`. Re-paste it whenever that file changes.
3. Add this line at the end of the prompt so the agent uses the name the man chose:

   ```
   The man's preferred name is {{user_name}}. If it is "friend", he hasn't shared a name; don't ask for one.
   ```

   The app sends `user_name` as a dynamic variable when it starts each call.
4. Set a short, warm opening line, for example:
   *"Hello, {{user_name}}. I'm glad you're here. What's on your mind today?"*

## 2. Choose the voice

Pick a warm, mature male voice and listen to a few samples before deciding. Aim for calm
and unhurried, not theatrical. Slightly slower speech often suits the persona.

## 3. Privacy settings (important)

Review the agent's **data storage** settings. Retell can store call recordings and
transcripts. Pick the most limited option that still lets you operate the service (the
SDK lists options such as `everything`, `everything_except_pii` and
`basic_attributes_only`). Then update the "Voice conversations" line on the privacy page
(`src/app/privacy/page.tsx`) to state exactly what is kept and for how long.

Also check Retell's data retention, its subprocessors, and whether you need a data
processing agreement.

## 4. Allowed domains and keys

- Put the **API key** in `RETELL_API_KEY` and the agent ID in `RETELL_AGENT_ID` in
  `.env.local` (and in Vercel's environment variables later). The key never reaches the
  browser: the app's `/api/voice/web-call` route adds it on the server.
- The browser SDK only sees short-lived call credentials.

## 5. Test it

1. `npm run dev`, sign in, finish onboarding, choose **Talk**, press **Start talking**.
2. Allow the microphone. You should hear the agent's opening line.
3. Check **Pause** (mutes your mic), interrupting him mid-sentence, and **End conversation**.

## Known gaps

- **Safety screening doesn't see voice in real time.** Text messages are screened before
  any model call; voice runs inside Retell. The prompt tells the agent how to respond to
  risk, but there is no deterministic crisis bypass for voice yet. Options to evaluate:
  Retell's post-call analysis or webhooks, or a custom LLM websocket so voice turns pass
  through the same safety pipeline as text.
- The live transcript stream is off, because Retell's SDK needs the API key in the
  browser for it. A transcript view would need a different design.
