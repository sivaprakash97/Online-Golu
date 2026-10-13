-- Fixed spots on each step, and letting visitors move their own Bommai.
-- The third row from the top (step 7) holds 4 Bommais and each row further down holds 2 more:
-- step k has 18 - 2k spots (step 1: 16 … step 7: 4), 70 in all. A spot holds one Bommai.
-- src/data/options.js (spotsOnStep, centreOut) repeats the rule and the fill order.

alter table public.bommais add column slot smallint;
alter table public.bommais add constraint bommais_slot_on_step check (slot >= 0 and slot < 18 - 2 * step);

-- Give existing Bommais spots from the middle outward (n/2, n/2 - 1, n/2 + 1, …), in join order.
with ranked as (
  select id, step, row_number() over (partition by step order by created_at, id) - 1 as r
  from public.bommais
)
update public.bommais b
set slot = case when r.r % 2 = 0 then (18 - 2 * r.step) / 2 + r.r / 2
                else (18 - 2 * r.step) / 2 - (r.r + 1) / 2 end
from ranked r
where r.id = b.id and r.r < 18 - 2 * r.step;

create unique index bommais_step_slot_key on public.bommais (step, slot) where slot is not null;

-- The per-step limit now follows the spots (replaces the flat 7 from the placement rules).
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

  if (select count(*) from public.bommais where step = new.step) >= 18 - 2 * new.step then
    raise exception 'Step % is full', new.step;
  end if;

  return new;
end;
$$;

-- New Bommais must say which spot they take.
drop policy "Visitors add their own Bommai to an open step" on public.bommais;
create policy "Visitors add their own Bommai to an open spot"
  on public.bommais for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and step between 1 and 7
    and slot is not null
    and seeded = false
  );

-- Visitors may move their own Bommai to another open spot (steps 8 and 9 stay closed).
create policy "Visitors move their own Bommai"
  on public.bommais for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and step between 1 and 7
    and slot is not null
  );

grant insert (slot) on public.bommais to authenticated;
grant update (step, slot) on public.bommais to authenticated;
