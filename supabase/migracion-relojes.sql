-- ============================================================================
--  MIGRACIÓN — Agrega la categoría "Relojes"
--
--  Ejecutar en la base que YA tienes en producción.
--  Supabase Dashboard > SQL Editor > New query > pegar > Run.
--  Es idempotente: si ya existe, sólo actualiza su nombre/orden.
--
--  (Si instalas desde cero con setup-completo.sql, no hace falta: ya la incluye.)
-- ============================================================================

insert into public.categories (slug, name, icon, sort)
values ('relojes', 'Relojes', 'watch', 6)
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon, sort = excluded.sort;
