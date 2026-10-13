-- The Internet Golu: one table of Bommai configurations.
-- We store the recipe (option ids), never an image; the frontend rebuilds the doll.

create table public.bommais (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete set null,
  name         text not null default '' check (char_length(name) <= 24),
  body         text not null check (char_length(body) <= 32),
  skin_tone    text not null check (char_length(skin_tone) <= 32),
  hair         text not null check (char_length(hair) <= 32),
  hair_color   text not null check (char_length(hair_color) <= 32),
  outfit       text not null check (char_length(outfit) <= 32),
  outfit_color text not null check (char_length(outfit_color) <= 32),
  face         text not null check (char_length(face) <= 32),
  face_extras  text[] not null default '{}' check (cardinality(face_extras) <= 8),
  accessory    text not null check (char_length(accessory) <= 32),
  pose         text not null check (char_length(pose) <= 32),
  -- Steps 8 and 9 hold the traditional Golu and can never contain community Bommais.
  step         smallint not null check (step between 1 and 7),
  seeded       boolean not null default false,
  created_at   timestamptz not null default now()
);

create index bommais_created_at_idx on public.bommais (created_at);
create index bommais_user_id_idx on public.bommais (user_id);

alter table public.bommais enable row level security;

create policy "Anyone can see the Golu"
  on public.bommais for select
  to anon, authenticated
  using (true);

create policy "Visitors add their own Bommai to an open step"
  on public.bommais for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and step between 1 and 7
    and seeded = false
  );

-- No update/delete policies: once placed, a Bommai stays put.

-- Clients may only write the recipe columns; id, seeded and created_at stay server-controlled.
revoke insert, update, delete on public.bommais from anon, authenticated;
grant insert (user_id, name, body, skin_tone, hair, hair_color, outfit, outfit_color, face, face_extras, accessory, pose, step)
  on public.bommais to authenticated;

-- Light spam guard: each anonymous visitor can place up to 5 Bommais.
create or replace function public.bommais_per_user_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is not null and (
    select count(*) from public.bommais where user_id = new.user_id
  ) >= 5 then
    raise exception 'You already have 5 Bommais on the Golu';
  end if;
  return new;
end;
$$;

-- trigger-only: not callable over the API
revoke execute on function public.bommais_per_user_cap() from public, anon, authenticated;

create trigger bommais_per_user_cap
  before insert on public.bommais
  for each row execute function public.bommais_per_user_cap();

-- Realtime inserts so new Bommais appear for everyone watching.
alter publication supabase_realtime add table public.bommais;
