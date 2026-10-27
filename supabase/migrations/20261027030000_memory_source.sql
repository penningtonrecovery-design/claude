-- Where a memory came from: written in Settings, or saved from his own chat message.
alter table public.memories
  add column source text not null default 'settings' check (source in ('settings', 'conversation'));
