# Keyword research

US Google search volume for terms around Fatherly Friend, pulled on 2026-11-26 through treg
(provider: DataForSEO, Google Ads data). Volumes are average monthly searches. CPC is the
suggested cost per click for a Google ad. The trend column compares the last three months
with the same three months a year earlier.

Cost of the research: $0.22.

## The biggest searches

| Keyword | Searches/mo | CPC | Trend | Notes |
| --- | ---: | ---: | --- | --- |
| ai to talk to | 40,500 | $4.77 | down 18% | The largest by far: people want an AI to *talk to* |
| father figure | 18,100 | $1.29 | down 40% | Mostly song lyrics and a perfume, not our audience |
| ai companion | 14,800 | $4.76 | flat | Mixed with Replika, robots and Zoom's "AI Companion" |
| ai therapist | 14,800 | $5.39 | flat | Real demand, but we are not a therapist |
| pi ai | 9,900 | $3.93 | flat | The nearest named competitor (Inflection's Pi) |
| men's mental health | 8,100 | $22.31 | down 28% | Expensive to buy ads on |
| ai companion app | 4,400 | $6.36 | up 11% | People searching for a product |
| therapy for men / men's therapy | 2,900 each | $35.08 | down 17% | Highest CPC on the list |
| how to be a man | 1,900 | $0.79 | down 23% | Cheap, broad, on theme |
| male therapist | 1,900 | $11.95 | up 82% | |
| fatherless | 1,600 | none | down 22% | Identity term; nobody advertises on it |
| free ai therapist | 1,300 | $3.56 | flat | |
| men's support group | 1,300 | $11.76 | down 26% | |
| father wound | 1,000 | $0.95 | up 48% | Rising, cheap, exact fit |
| absent father | 1,000 | $1.63 | up 9% | |

## Small but on target

| Keyword | Searches/mo | CPC |
| --- | ---: | ---: |
| best ai companion app | 880 | $6.85 |
| ai therapy app | 880 | $6.57 |
| daddy issues in men | 590 | none |
| dad advice | 480 | $0.75 |
| father wound in men | 320 | $11.39 |
| growing up without a father | 210 | none |
| father wound healing | 170 | $2.02 |
| mentor for men | 140 | $7.06 |
| father wound book | 110 | $0.46 |
| ai chatbot to talk to | 110 | $6.21 |
| ai friend to talk to | 90 | $6.33 |
| fatherless sons | 70 | none |
| replika alternative | 70 | $4.87 |

Close to zero (10–30 a month): "how to heal the father wound", "absent father effects on sons",
"signs of father wound in men", "things my dad never taught me", "need a father figure",
"grandfather advice".

No data came back for: "someone to talk to", "i need someone to talk to", "lonely men",
"ai companion for men", "advice from a father figure", "talk to ai about problems",
"how to be a good father without a role model". This means the provider returned nothing, not
that nobody searches for them.

## What it suggests

- **Lead with "someone to talk to."** "AI to talk to" gets about three times the searches of
  "AI companion", and it matches the voice-first product.
- **"Father figure" is a false friend.** The volume is high, but the searches are about a song
  and a perfume.
- **"Father wound" is the niche.** Low volume, exact meaning, rising, and ads on it are cheap. It
  fits articles and landing-page copy such as "Signs of a father wound in men".
- **Avoid "therapist" wording in ads.** It is expensive, and it clashes with the honest
  "not a therapist" positioning.

## How to refresh

With the treg CLI (installed in every cloud session on this environment):

```bash
treg call treg.google.keywords.volume --method POST \
  --header 'X-Treg-Route-Max-Cost: 0.20' \
  --data '{"keywords":["ai to talk to","father wound"],"country":"us","language":"en"}'
```

One call covers up to 1,000 keywords for about $0.09. Change `country` (gb, ca, au) for other
markets.
