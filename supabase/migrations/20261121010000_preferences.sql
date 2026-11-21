-- How he'd like Fatherly Friend to talk with him. Fixed vocabularies only:
-- each value maps to a reviewed instruction in src/lib/personalization.

alter table public.profiles
  add column pref_tone text not null default 'balanced'
    check (pref_tone in ('gentle', 'balanced', 'direct')),
  add column pref_focus text not null default 'balanced'
    check (pref_focus in ('practical', 'balanced', 'reflective')),
  add column pref_next_steps text not null default 'sometimes'
    check (pref_next_steps in ('often', 'sometimes', 'rarely')),
  add column pref_faith text not null default 'off'
    check (pref_faith in ('off', 'welcome')),
  add column pref_avoid_topics text[] not null default '{}'
    check (pref_avoid_topics <@ array['father', 'mother', 'faith', 'divorce', 'work', 'money', 'health', 'past_trauma']),
  add column life_context text[] not null default '{}'
    check (life_context <@ array['father', 'expecting', 'stepfather', 'grandfather', 'partnered', 'married', 'separated', 'single']);

comment on column public.profiles.life_context is 'Shared only with the language model when memory_enabled is true.';
