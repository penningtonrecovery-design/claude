# Reviewing the knowledge base

The knowledge base is a small library of research-informed guidance that Fatherly Friend can
draw on in conversation. It lives in `src/lib/knowledge/entries.ts`. **Nothing in it reaches the
AI until a qualified reviewer approves it.** Today every entry is a draft, so the app's
behaviour is unchanged.

## What an entry contains

| Field | Meaning |
| --- | --- |
| `title`, `guidance` | A short summary in our own words. Never quoted or closely paraphrased from a book. |
| `evidence` | `established` (consistent findings, meta-analyses), `emerging` (promising, limited or mixed), or `theoretical` (an interpretive framework such as Jungian ideas, not an empirical finding). |
| `caveats` | How the AI must and must not use it, for example "never present this as a diagnosis". |
| `keywords` | Words in a man's recent messages that make the entry relevant. |
| `sources` | Citations, each with `verified: true/false`. |
| `review` | `status` (draft, in_review, approved, retired), `reviewer`, `reviewedOn`, optional `notes`. |

## How the app uses approved entries

Before each text reply, the app looks at his last three messages, picks **at most two**
approved entries whose keywords match, and adds them to the AI's instructions with their
evidence level and caveats. The AI is told to use them lightly, in its own words, and never
to lecture or quote. Safety instructions always come after them and take precedence.
Entries are not used in voice calls yet.

An entry is used only if **all** of these are true:

- `review.status` is `"approved"`
- `review.reviewer` names a person
- `review.reviewedOn` is set
- it has at least one source, and **every** source has `verified: true`

## Review checklist (per entry)

1. **Accuracy:** does the guidance fairly reflect the evidence? Is the evidence level right?
2. **Sources:** check each citation against the original (authors, title, year, journal or
   publisher, pages). Set `verified: true` only after checking.
3. **Copyright:** is the text our own summary, not an excerpt?
4. **Safety and scope:** could it be read as diagnosis or treatment? Does it blame all
   difficulties on fathers? Is it inclusive of different backgrounds and beliefs?
5. **Caveats:** do they tell the AI what to avoid?
6. **Keywords:** will they match the right conversations, and not the wrong ones?

Then set `review` to, for example:

```ts
review: { status: "approved", reviewer: "Jane Smith, LCSW", reviewedOn: "2027-01-15", notes: "Softened the causal claim." },
```

Make the change in a pull request so the history records who approved what and when. To
withdraw an entry, set `status: "retired"`.

## Sources from the brief still to verify

`SOURCES_TO_VERIFY` in `entries.ts` lists starting points named in the product brief that are
not yet confirmed: *Absent Fathers, Lost Sons* (Corneau), *Masculinity in Crisis* (Horrocks),
*Sons of the Father* (exact details unknown) and The Fatherless Project (identity unknown).
They are not used anywhere until verified and written up as reviewed entries.
