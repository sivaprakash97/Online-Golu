-- Read-only stats on the Golu. Paste into the Supabase SQL editor (not a migration, nothing here writes).
-- "Real" Bommais are the ones visitors placed; seeded ones are the demo dolls.

-- Totals: real vs seeded, distinct visitors (one Bommai each), first and latest placement.
select
  count(*) filter (where not seeded)                as real_bommais,
  count(*) filter (where seeded)                    as seeded_bommais,
  count(distinct user_id) filter (where not seeded) as distinct_visitors,
  min(created_at) filter (where not seeded)         as first_real,
  max(created_at) filter (where not seeded)         as latest_real
from public.bommais;

-- Placed per day (India time).
select (created_at at time zone 'Asia/Kolkata')::date as day, count(*) as placed
from public.bommais
where not seeded
group by 1
order by 1;

-- How full each Golu and step is.
select golu, step,
  count(*) filter (where not seeded) as real,
  count(*) filter (where seeded)     as seeded
from public.bommais
group by 1, 2
order by 1, 2;

-- Most popular choices for each option. Accessories can be combined ("headphones+cat").
select 'body' as option, body as choice, count(*) from public.bommais where not seeded group by 2
union all select 'outfit',    outfit,    count(*) from public.bommais where not seeded group by 2
union all select 'hair',      hair,      count(*) from public.bommais where not seeded group by 2
union all select 'accessory', accessory, count(*) from public.bommais where not seeded group by 2
union all select 'pose',      pose,      count(*) from public.bommais where not seeded group by 2
order by 1, 3 desc;
