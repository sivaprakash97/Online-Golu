-- Pets: the accessory column now packs three ids, headwear + what's carried + a pet
-- ('headphones+filter-coffee+pikachu'), so give it room beyond 32 characters. Older rows hold a
-- single id or two and still read the same; 'cat' and 'dog' (once carried items) now read as pets.

alter table public.bommais drop constraint if exists bommais_accessory_check;
alter table public.bommais add constraint bommais_accessory_check check (char_length(accessory) <= 64);
