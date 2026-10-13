-- Fixed spots on each step, and letting visitors move their own Bommai.
-- Each community step has 7 spots (slot 0..6, left to right). A spot holds one Bommai, which also
-- caps a step at 7. src/three/golu/layout.js repeats the spot count and the centre-out order.

alter table public.bommais add column slot smallint check (slot between 0 and 6);

-- Give existing Bommais spots, centre-out (3, 2, 4, 1, 5, 0, 6) in the order they joined.
with ranked as (
  select id, row_number() over (partition by step order by created_at, id) - 1 as n
  from public.bommais
)
update public.bommais b
set slot = (array[3, 2, 4, 1, 5, 0, 6])[r.n + 1]
from ranked r
where r.id = b.id and r.n < 7;

create unique index bommais_step_slot_key on public.bommais (step, slot) where slot is not null;

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
