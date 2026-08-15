# n8n AI Builder Prompt — Social Media "One Idea → All Platforms" Workflow

Copy everything between the lines below and paste it into n8n's AI workflow builder.

---

Build a social media publishing workflow that takes one content idea and turns it into platform-ready posts for Facebook, Instagram, LinkedIn, and X (Twitter), with a review/approval step before anything is published.

**Trigger:**
Start with an n8n Form trigger with these fields:
- "Content idea" (required, long text) — the core message or topic of the post
- "Image URL" (optional, text) — a link to an image to attach (required for Instagram; if empty, skip Instagram and note it in the summary)
- "Call to action" (optional, dropdown) — options: "Promote Stan Store", "Drive engagement", "Share resource", "No CTA"

**AI content generation:**
Use an AI/LLM node to generate four platform-specific versions of the post from the content idea. Output structured JSON with keys: facebook, instagram, linkedin, x. Requirements for each:
- Facebook: warm, conversational, 2–4 short paragraphs, 1–3 hashtags at the end
- Instagram: engaging caption with line breaks, a hook in the first line, 5–10 relevant hashtags, emoji where natural
- LinkedIn: professional but personal tone, a strong opening line, short paragraphs with white space, no more than 3 hashtags
- X: maximum 280 characters including any link, punchy, at most 2 hashtags

Brand voice: supportive, hopeful, and professional — this is for a recovery/wellness business, so avoid hype, avoid making medical claims or guarantees, and keep the tone encouraging and stigma-free.

If "Promote Stan Store" is selected as the CTA, append a short call to action with my Stan Store link https://stan.store/YOUR_HANDLE to each post (for Instagram, say "link in bio" instead of pasting the URL).

**Approval step:**
After generation, send me an approval email (Gmail) to penningtonrecovery@gmail.com containing all four drafts clearly labeled by platform, using n8n's "send and wait for approval" (double approval: Approve / Decline).
- If I decline, end the workflow and send me a short email confirming nothing was posted.
- If I approve, continue to publishing.

**Publishing:**
- Facebook: post to my Facebook Page via the Facebook Graph API node (include the image if an Image URL was provided)
- Instagram: publish to my Instagram Business account via the Facebook Graph API (container create + publish; requires the Image URL)
- LinkedIn: create a post on my LinkedIn profile using the LinkedIn node (include the image if provided)
- X: post the tweet using the X (Twitter) node

Run the four publishing branches independently so one platform failing doesn't block the others. Use "continue on error" on each publishing node.

**Wrap-up:**
After publishing, send me a summary email listing which platforms succeeded, which failed (with the error message), and the final text that was posted to each. Use placeholder credentials for Facebook/Instagram (Meta), LinkedIn, X, and Gmail — I will connect my own accounts.

---

## Setup notes (for you, not part of the prompt)

- **Meta (Facebook + Instagram):** you need a Facebook Page and an Instagram *Business/Professional* account linked to that Page. Instagram's API cannot post text-only — that's why the image is required for Instagram.
- **X:** requires an X developer app (free tier allows posting).
- **LinkedIn:** the n8n LinkedIn node posts to your personal profile or an organization page — say which you want when connecting credentials.
- **Stan Store:** there's no posting API for Stan Store, so it's included as the CTA link in each post. Replace `https://stan.store/YOUR_HANDLE` in the prompt with your real Stan Store URL before pasting.
- The approval email goes to penningtonrecovery@gmail.com via Gmail — n8n will ask you to connect Gmail the first time.
