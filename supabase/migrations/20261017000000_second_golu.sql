-- A second Golu on the carousel. Every Bommai stands on one Golu (1 or 2), and each Golu has the
-- same 84 spots on steps 1–7 (step k has 16 - k). Bommais already placed stay on Golu 1.
-- src/data/options.js (GOLU_COUNT) repeats the number of Golus; to open a third, raise both.
-- Safe to run before or after deploying the app: older builds don't send `golu`, so their
-- Bommais land on Golu 1, and newer builds show only Golu 1 until this has run.

alter table public.bommais add column golu smallint not null default 1;
alter table public.bommais add constraint bommais_golu_open check (golu between 1 and 2);

-- A spot holds one Bommai on each Golu.
drop index public.bommais_step_slot_key;
create unique index bommais_golu_step_slot_key on public.bommais (golu, step, slot) where slot is not null;

-- Steps fill up per Golu (replaces the per-step count in the slots migration).
create or replace function public.bommais_placement_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- one insert at a time, so two visitors can't both take the last spot on a step
  perform pg_advisory_xact_lock(hashtext('public.bommais'));

  if new.user_id is not null and exists (
    select 1 from public.bommais where user_id = new.user_id
  ) then
    raise exception 'This visitor already has a Bommai on the Golu';
  end if;

  if (select count(*) from public.bommais where golu = new.golu and step = new.step) >= 16 - new.step then
    raise exception 'Step % is full', new.step;
  end if;

  return new;
end;
$$;

-- Visitors pick the Golu when they place their Bommai. Moving stays on the same Golu: the
-- update grants (step, slot and the look) don't include `golu`.
grant insert (golu) on public.bommais to authenticated;
