-- ============================================================================
--  Alvarez Boutique — Cuentas de dueños y permisos de inventario
--  Ejecutar DESPUÉS de schema.sql (SQL Editor → New query → pegar todo → Run)
--
--  IMPORTANTE (una sola vez): en Supabase ve a
--    Authentication → Sign In / Providers → Email
--  y DESACTIVA "Confirm email". Como los dueños entran con nombre de usuario
--  (no reciben correos), esto les permite iniciar sesión de inmediato.
--
--  Modelo de cuentas: TODAS las cuentas son iguales, no hay rangos. Cada una
--  está asignada a UNA categoría y sólo puede tocar los productos de esa
--  categoría. Cualquier cuenta puede crear otras cuentas.
-- ============================================================================

-- 1) Un perfil por cuenta, atado a su categoría.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text,
  category_id uuid references public.categories(id) on delete restrict,
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 2) ¿Qué categoría le toca a la sesión actual?
--    security definer evita la recursión de RLS al leer profiles desde su propia política.
create or replace function public.my_category()
returns uuid language sql security definer stable set search_path = public as $$
  select category_id from public.profiles where id = auth.uid();
$$;
grant execute on function public.my_category() to authenticated;

-- 3) ¿Ya existe alguna cuenta? (para el asistente de "primera cuenta")
create or replace function public.has_accounts()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles);
$$;
grant execute on function public.has_accounts() to anon, authenticated;

-- 4) Al registrar una cuenta, se crea su perfil automáticamente desde los
--    metadatos que envía la app. Si no viene categoría, toma la primera por orden.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_cat uuid;
begin
  v_cat := nullif(new.raw_user_meta_data->>'category_id', '')::uuid;
  if v_cat is null then
    select id into v_cat from public.categories order by sort limit 1;
  end if;
  insert into public.profiles (id, username, full_name, category_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    v_cat
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 5) Perfiles: toda cuenta con sesión ve la lista (pantalla Cuentas) y puede
--    editar únicamente el suyo. No hay rangos, así que nadie manda sobre nadie.
drop policy if exists "perfiles visibles con sesion" on public.profiles;
create policy "perfiles visibles con sesion" on public.profiles for select
  to authenticated using (true);

drop policy if exists "edita su propio perfil" on public.profiles;
create policy "edita su propio perfil" on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 6) Productos: el catálogo sigue siendo de lectura pública (política de
--    schema.sql), y la escritura queda limitada a la categoría de cada cuenta.
drop policy if exists "products insert propia categoria" on public.products;
create policy "products insert propia categoria" on public.products for insert
  to authenticated with check (category_id = public.my_category());

drop policy if exists "products update propia categoria" on public.products;
create policy "products update propia categoria" on public.products for update
  to authenticated using (category_id = public.my_category())
  with check (category_id = public.my_category());

drop policy if exists "products delete propia categoria" on public.products;
create policy "products delete propia categoria" on public.products for delete
  to authenticated using (category_id = public.my_category());

-- 7) Fotos de producto: bucket público de lectura; sólo cuentas con sesión suben.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "imagenes lectura publica" on storage.objects;
create policy "imagenes lectura publica" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "imagenes suben con sesion" on storage.objects;
create policy "imagenes suben con sesion" on storage.objects for insert
  to authenticated with check (bucket_id = 'product-images');

drop policy if exists "imagenes borran con sesion" on storage.objects;
create policy "imagenes borran con sesion" on storage.objects for delete
  to authenticated using (bucket_id = 'product-images');
