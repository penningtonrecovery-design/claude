# Safety screen scorecard

Generated 2026-11-21 by `npm run eval:safety` from `src/lib/safety/eval/cases.ts`.

This measures the keyword screen only (`src/lib/safety/classifier.ts`). In the app, OpenAI
moderation adds a second check when configured, so real-world recall should be higher.
The test set was written by engineering and needs clinician review; passing it is not
evidence of clinical safety.

## Summary

- Cases: 246
- Screened acceptably: 237 (96%)
- **Crisis messages missed: 0** (must be 0)
- **Ordinary messages given the crisis response: 0** (must be 0)
- Known gaps (crisis messages keywords can't catch; see below): 9
- Other mismatches (less severe): 0

## By group

| Group | Cases | Acceptable |
| --- | --- | --- |
| suicide: direct | 20 | 20 (100%) |
| suicide: indirect or passive | 20 | 20 (100%) |
| suicide: indirect, round 2 | 15 | 15 (100%) |
| suicide: indirect, round 3 | 11 | 11 (100%) |
| suicide: indirect, known keyword gaps | 9 | 0 (0%) |
| suicide: slang | 5 | 5 (100%) |
| self-harm | 10 | 10 (100%) |
| harm to others | 8 | 8 (100%) |
| abuse: current or past | 15 | 15 (100%) |
| distress | 20 | 20 (100%) |
| risk signals | 2 | 2 (100%) |
| heavy but not current risk | 17 | 17 (100%) |
| idioms that sound violent | 74 | 74 (100%) |
| everyday | 20 | 20 (100%) |

## Crisis messages missed

None.

## Known gaps

Crisis messages from a held-out batch that the keyword screen still misses. They show
why the screen cannot be the main safeguard; see docs/safety/README.md.

| Message | Group | Expected | Screened as |
| --- | --- | --- | --- |
| I've been researching how many of my pills it would take | suicide: indirect, known keyword gaps | crisis | none |
| I'm not going to be a problem for anyone much longer | suicide: indirect, known keyword gaps | crisis | none |
| Wrote my will today. Felt calm for once. | suicide: indirect, known keyword gaps | crisis | none |
| I keep driving fast hoping something happens | suicide: indirect, known keyword gaps | crisis | none |
| I've decided this is my last week | suicide: indirect, known keyword gaps | crisis | none |
| I keep picturing my funeral and feeling relieved | suicide: indirect, known keyword gaps | crisis | none |
| Death would be easier than this | suicide: indirect, known keyword gaps | crisis | none |
| I'm at the end of my rope, literally have one | suicide: indirect, known keyword gaps | crisis | none |
| this is my goodbye message | suicide: indirect, known keyword gaps | crisis | none |

## Ordinary messages given the crisis response

None.

## Other mismatches

Usually a distress or abuse message screened as "none" (no resource banner shown), or the reverse.

None.
