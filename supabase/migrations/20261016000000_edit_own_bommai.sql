-- Visitors may change how their own Bommai looks, and its name tag, after placing it.
-- The update policy from the slots migration already limits updates to the visitor's own row and
-- keeps it on steps 1–7; this lets those updates touch the recipe columns as well as the spot.
-- id, user_id, seeded and created_at stay server-controlled.

grant update (name, body, skin_tone, hair, hair_color, outfit, outfit_color, face, face_extras, accessory, pose)
  on public.bommais to authenticated;
