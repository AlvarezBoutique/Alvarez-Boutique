-- ============================================================================
--  MIGRACIÓN — Cualquier cuenta puede subir a cualquier categoría
--
--  Ejecutar SÓLO si ya corriste setup-completo.sql con el modelo anterior
--  (cada cuenta atada a una categoría). Si instalas desde cero, no hace falta:
--  setup-completo.sql ya viene con este modelo.
--
--  Supabase Dashboard > SQL Editor > New query > pegar todo > Run.
--  Es idempotente: puedes re-ejecutarlo sin problema.
--
--  Qué cambia:
--    · Las cuentas dejan de estar atadas a una categoría.
--    · Cualquier cuenta con sesión puede crear/editar/borrar en TODAS.
--    · El catálogo sigue siendo de lectura pública para cualquiera.
-- ============================================================================

-- 1) Fuera las políticas que limitaban por categoría.
--    Ojo con el orden: dependen de my_category(), así que van antes que ella.
drop policy if exists "products insert propia categoria" on public.products;
drop policy if exists "products update propia categoria" on public.products;
drop policy if exists "products delete propia categoria" on public.products;

-- 2) Escritura para cualquier cuenta con sesión, en cualquier categoría.
drop policy if exists "products insert con sesion" on public.products;
create policy "products insert con sesion" on public.products for insert
  to authenticated with check (true);

drop policy if exists "products update con sesion" on public.products;
create policy "products update con sesion" on public.products for update
  to authenticated using (true) with check (true);

drop policy if exists "products delete con sesion" on public.products;
create policy "products delete con sesion" on public.products for delete
  to authenticated using (true);

-- 3) El trigger ya no asigna categoría al crear el perfil.
--    Se reemplaza ANTES de borrar la columna, para no dejarlo roto entremedio.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- 4) Ya nadie usa la categoría del perfil ni la función que la leía.
alter table public.profiles drop column if exists category_id;
drop function if exists public.my_category();
