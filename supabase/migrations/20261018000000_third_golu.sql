-- A third Golu on the carousel: the same 84 spots on steps 1–7 as the others.
-- src/data/options.js (GOLU_COUNT) repeats the number of Golus; to open a fourth, raise both.
-- Safe to run before or after deploying the app: until it has run, placing a Bommai on Golu 3
-- is refused ("no such Golu") and the first two Golus work as before.

alter table public.bommais drop constraint bommais_golu_open;
alter table public.bommais add constraint bommais_golu_open check (golu between 1 and 3);
