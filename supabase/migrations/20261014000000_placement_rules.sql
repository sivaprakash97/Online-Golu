-- Placement rules: one Bommai per visitor, and at most 7 Bommais per community step
-- (49 in all, demo Bommais included). src/data/options.js (STEP_CAP) repeats the 7.
-- Replaces the earlier 5-per-visitor cap.

drop trigger if exists bommais_per_user_cap on public.bommais;
drop function if exists public.bommais_per_user_cap();

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

  if (select count(*) from public.bommais where step = new.step) >= 7 then
    raise exception 'Step % is full', new.step;
  end if;

  return new;
end;
$$;

-- trigger-only: not callable over the API
revoke execute on function public.bommais_placement_rules() from public, anon, authenticated;

create trigger bommais_placement_rules
  before insert on public.bommais
  for each row execute function public.bommais_placement_rules();
