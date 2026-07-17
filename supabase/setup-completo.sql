-- ============================================================================
--  ALVAREZ BOUTIQUE — INSTALACIÓN COMPLETA EN SUPABASE (un solo archivo)
--
--  Cómo usarlo:
--    1. Supabase Dashboard > SQL Editor > New query
--    2. Pega TODO este archivo y dale Run.
--    3. Luego ve a Authentication > Sign In / Providers > Email
--       y DESACTIVA "Confirm email" (si no, nadie podrá iniciar sesión).
--    4. Entra a /admin y crea la primera cuenta.
--
--  Equivale a ejecutar schema.sql y después auth.sql, en ese orden.
--  Es idempotente y no destructivo: puedes re-ejecutarlo sin duplicar datos
--  ni borrar los productos que hayan subido los dueños.
--
--  OJO: incluye 21 productos de EJEMPLO (ficticios, con fotos generadas).
--  Antes de abrir la tienda al público:  delete from public.products;
-- ============================================================================

-- ############ PARTE 1 de 2 · CATÁLOGO (schema.sql) ############

-- ============================================================
-- Alvarez Boutique — Catálogo: tablas, permisos de lectura y datos de ejemplo
-- Ejecuta este archivo COMPLETO en:  Supabase Dashboard > SQL Editor > New query
-- Después ejecuta auth.sql (cuentas de los dueños).
--
-- Es idempotente y NO destructivo: puedes re-ejecutarlo sin duplicar datos y
-- sin borrar los productos que hayan subido los dueños.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tablas ----------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,   -- va en la URL: /damas, /perfumes…
  name       text not null,
  icon       text not null,          -- Material Symbol
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null,
  subtitle    text,
  description text,
  price       numeric(10,2) not null default 0,
  currency    text not null default 'HNL',
  image_url   text,
  badge       text,                  -- 'Novedad' | 'Edición Limitada' | 'Más Vendido' | null
  in_stock    boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- Un producto no se repite dentro de su categoría. Además permite re-sembrar
-- con "on conflict do nothing" en vez de borrar la tabla.
alter table public.products drop constraint if exists products_categoria_nombre_key;
alter table public.products add constraint products_categoria_nombre_key unique (category_id, name);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_sort     on public.products(category_id, sort);

-- ---------- Row Level Security ----------
alter table public.categories enable row level security;
alter table public.products   enable row level security;

-- El catálogo es público: cualquiera puede LEER.
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products
  for select using (true);
-- La escritura se define en auth.sql (cualquier cuenta con sesión).

-- ---------- Datos: categorías ----------
insert into public.categories (slug, name, icon, sort) values
  ('damas','Damas','woman',1),
  ('caballeros','Caballeros','man',2),
  ('ninos','Niños','child_care',3),
  ('bebes','Bebés','baby_changing_station',4),
  ('perfumes','Perfumes','spa',5),
  ('relojes','Relojes','watch',6)
on conflict (slug) do update set name=excluded.name, icon=excluded.icon, sort=excluded.sort;

-- ---------- Datos: productos de ejemplo ----------
-- 'do nothing' = si ya existe (o el dueño lo editó), se respeta lo que hay.
-- Para quitarlos de la tienda real:  delete from public.products;

-- Damas
insert into public.products (category_id, name, subtitle, description, price, image_url, badge, sort)
select c.id, v.name, v.subtitle, v.description, v.price, v.image_url, v.badge, v.sort
from public.categories c
join (values
  ('Vestido Lencero de Seda','Bruma Lavanda','Seda de morera pura con costuras rematadas a mano y una silueta fluida que no pasa de moda.',420,'https://lh3.googleusercontent.com/aida-public/AB6AXuBllWfbVb53STbbsPYZk4M-g9VldIjc9v7lwTNjd1eQ51KqVvR2VNCQQoLfLnj_lPAzNrretb4IvvGu_yKhZcKyIuv9b6OWIPAyyskF_lzaoFAl77s7XBMFWVQSvbmqUFEHtz7i5fOrGzMNqNqcOprZgMg9kU0Wm1FH1eutIfy41oafFhdnS4GqMOIa_IMWyBxQFX3E7y3XyYU37SSY6vexFt8JHLKgpPQebiKp_5sr-tBgbLSlcIb-IYvRaY4yvf7x7ke6q93N50M=w1200',null,1),
  ('Blazer Arquitecto de Cachemira','Greige Cálido','Hombros estructurados y cachemira italiana suave para una silueta de confianza serena.',1280,'https://lh3.googleusercontent.com/aida-public/AB6AXuBMd3pu0kkvEm7kfVq3lMc2Mm9YzIsf5l6wD3Jmak44lEFab1pTUcl2X1yfY3kZLLe5XfNjIDm86R2a9sKVW4E5Gn-UeNGt85a4ALIjoMysRJjU0I2BzidIyWjIQLJlEU0uiPom8d1M8EXH80csL8igg5Vc6i4MAj156pl2iRkH7tqs1rSZIuqFxAzV00JgNn7pnfANzLl2ef-RTLR3ay1ARp_pPFuGN8CufHzSS82PlVcuoe24MRdqVda-wled9-Gn-lo4BbKUuRM=w1200','Edición Limitada',2),
  ('Bolso de Estructura Esculpida','Piedra Menta','Piel de becerro moldeada a mano, con cierre magnético oculto y asas arquitectónicas.',890,'https://lh3.googleusercontent.com/aida-public/AB6AXuALFjR8mjl69PVv708CqLVRYZMS9NGo44zyPCOdMn-8dsviSqsbtXjLVN9WLRbiWaf3PuaUXNdsxMtS7pZC6PSJmBlPCdxQRgJi_7-EtfxDJgcSALN9m-hz-vvQwK1GtXrag11K_d0xrVRSZ_0_WidlOEwfnGBjs7FgK2Tu--hhvs0mYKHBQ3DUV7ERsE8eL_zakMvxCD5eGNzjGbhLzu16saHuzccF_VW-1xd0rLwHzcJlEgmr4ekC_KtqXv-iOdngySxoeUfj-gM=w1200',null,3),
  ('Mules Pavane en Punta','Crema Marfil','Empeine de napa suave con tacón de madera esculpida y cantos pintados a mano.',550,'https://lh3.googleusercontent.com/aida-public/AB6AXuD8EJTfLhNSZeTW6eVmKAQIXkLtNEOs2JqwKIs9UpHeamskwxN8JE4WbTkEMpFr66y3fkrtUA_TXX4oToX2ZUsz4jdmNxubFeVfRRK460J0WykLnH--M1i1iWfq7QZG_QyANrn6Ypw1hnczaDJFrk_xJEbpCazmkoyVpn-YWYXGWQUNXMr55INudM6MfcYN1boQxy6EKEnXpu8Q8BpUP8RBPUl8TRLY5VE86sD3p4LL9fVeivk7s-gmRW_FbjXKge9vACTvMbDUgfo=w1200',null,4),
  ('Arco de Oro Martillado','Oro Macizo','Oro reciclado de 18k, batido a mano para lograr un reflejo orgánico irrepetible.',310,'https://lh3.googleusercontent.com/aida-public/AB6AXuD17PVp4HlJq8s5n0MnPTRy3QPBVSGGmtwdrUgD7k8GlPZc91pa3lx3hOugaRjKfx4yBcMSYjwgMPHdK_ihHiQKbbTzt8WkC2g8QO4k-x5WzppF9H0Hrtyy79XlZkItqxGLS5EMct42_Ib5NfCJFeCRxhcwaAzVnw4wBj5Hk3YOQzXUK_qW7VJup8mA6ZvPC3vNZJcGZNphe5DJ4q5NfpsDH3Vo3x6q9wAx-59otiS8NyI1rp-mYkthqRHhOld90XDetwools0p7FU=w1200','Novedad',5),
  ('Cuello Nube de Merino','Verde Salvia','Lana merino ultrafina sin costuras, con tacto de segunda piel y un abrigo excepcional.',385,'https://lh3.googleusercontent.com/aida-public/AB6AXuD-eLdg6mO0a07gMcqbYExwl8jYoNFYD31YCyVkegcktOZO2xtPHqhSDV_Ns65Iyg8bZH9MydfyKbTkhjndql8KGnf1zi-tvXqkDmjVV_vf23nWnFa4gP2S_DCu2k0Fgyr5VRyfsE8chHjxnrkWQM2O9pMR3c5zBojxaTU615jKNLTYOmW9MYxyMxM1Z8P1zvUh8SVS5OPHgdvmncxGu2AWS1pgzQoKli7yZzmX--3_V0C1AY-qkeHabWZfIWGvSskSZ6GzrzbGeSU=w1200',null,6)
) as v(name,subtitle,description,price,image_url,badge,sort) on true
where c.slug='damas'
on conflict (category_id, name) do nothing;

-- Caballeros
insert into public.products (category_id, name, subtitle, description, price, image_url, badge, sort)
select c.id, v.name, v.subtitle, v.description, v.price, v.image_url, v.badge, v.sort
from public.categories c
join (values
  ('Blazer Estructurado de Lana Merino','Azul Profundo','Confeccionado en lana merino fina con entretela semi-armada para una caída impecable y sin esfuerzo.',850,'https://lh3.googleusercontent.com/aida-public/AB6AXuBMtYR58KlyZPjChQIv6_fHFFIjdezHlzHU1CRTcEav9xoWbRUOPk-wM2ejwZ7P9Z7ZGZhSNelOLoWaxfUaMEmcFSQTjTk-WxxPhAN7G8nzd4FzXZUWNGvTJK2LBvxsdp-zByTNQc5RdUXYyRJm-i_r89bFoQgrW_6yBC4FuYo-jYJXXTr2bP1oKFCDMHOLOj7uz55WZsqOYfTgmBoqeKPjYl_4lOCYkYti9kPPI-mowUWqjATKjwQNPcOi14U47_3SlPJ2OlJOVEQ=w1200',null,1),
  ('Mocasines Pizarra Bruñidos a Mano','Gris Artesano','Mocasines de becerro bruñidos a mano, con suela de cuero y puntera almendrada.',420,'https://lh3.googleusercontent.com/aida-public/AB6AXuBxLVg5pMpEzgTNq04dMKAgtqJLyglFhTb_DRph4gJckV3-hxqixhmA1L1zF5dJaeWMdcRL0rm3Y6L-_XT0ia_PGk_iTNb_dy4tYbSYxB5A-pB-kV6_rKOGUMgQamLEpyFvUkpttRmr574sw8_6qXO-SEcPgPgRIQV9N71BgX-K_qbN_GF44Au6WNU7dEPURxrqjFKQYII2Uo4j4oDmrHFmfTCy4cmEkoLnZxzY4fpqVSAJ5gvPCScX4NV1-z2pwxj3OmXJ3-pNVl8=w1200',null,2),
  ('Cuello Alto de Cachemira Avena','Capa Esencial','Cachemira pura con cuello acanalado y un corte relajado y elegante.',310,'https://lh3.googleusercontent.com/aida-public/AB6AXuBfHtvpMTiwDOzEWiPYXBeZsDnWM61cVuUbNiSZc4fvwkP8-2-gxoChUG6m4EN7bpLV61OqXQOKeI6oB9BjOd3lzJT3Xz_K7KRCUUOgIg9GCJIqZC7U6cwOqkmVt-IDPKdavPnLBQ2dTxAUS1cMle-WTdoysxTG5ERhAoB0d2QP_w7a-8tIV8L3zOfrU1AQZzr9TXxzrkQxSRWgEcR5Ftvl30jfSQu8fqdeyFFqiKih4ZKCpyKIJOAQo8Cukh0z2U-aBGN9l_nMiCw=w1200',null,3),
  ('Cronógrafo Horizonte IV','Edición Limitada','Movimiento automático suizo en caja de titanio cepillado con cristal de zafiro.',1250,'https://lh3.googleusercontent.com/aida-public/AB6AXuDcK5GtHA_m06AC5BcwZBBRXmOzfMcvItcMI6aqULU6CXIfg7coAlPZgmjMwGw2RA1LzJb7SZpVrUbFvcxUC53TfR0N0VqM_P8liWijZHLOe_R9Gl8jkHWO0yK7whvTCFTcIvjOQz6uMcq0v_Ir4VMy5OaJqwP-osOacaSqdD5vsmj2cg-vtz3wqhQ5lrLo7HzYQU6AkCSkTqExFjDLZPuJjp27AY7vgwfURdFTkttjRacFPJE94rSBAC7v42XETmF7lfNSvPu3oMQ=w1200','Edición Limitada',4),
  ('Camisa de Algodón Sarga Fina','Blanco Impecable','Sarga de algodón de fibra larga con botones de nácar y cuello con botones ocultos.',185,'https://lh3.googleusercontent.com/aida-public/AB6AXuCtVXcDriDo799yJT2HUIMv_LGJ_Z1o8SiQD-iQN7NIE5fkgo6aVEtz63g4yCLYjrCQD3kvPTUyH8punRNwVnkPNycDfU6BsCDTA1Eit1dNu9YHECEN64pJ9CkPpL-3AKDaHkGFBrU7C9AC2PG1ECkVHxN6cabIF5IARynmPuEgbMszM3JaOue9SueUBTu8Yt_pgP0Xq0JYRvHCC-Gxw5KSxOjaxEvPGUOu9fhstHl5Ag0evsrn04UIOyXXqGB5bOhWGJAb4ExtHno=w1200',null,5)
) as v(name,subtitle,description,price,image_url,badge,sort) on true
where c.slug='caballeros'
on conflict (category_id, name) do nothing;

-- Niños
insert into public.products (category_id, name, subtitle, description, price, image_url, badge, sort)
select c.id, v.name, v.subtitle, v.description, v.price, v.image_url, v.badge, v.sort
from public.categories c
join (values
  ('Suéter Tejido de Cachemira','Menta Mañana','Cachemira suave como una nube en un tono menta, amable con la piel delicada.',124,'https://lh3.googleusercontent.com/aida-public/AB6AXuDPEa4zRbkIIJQsdwBEJnC426Cu_dl-cDmvU7cRODkodE57W9Xzd1-RAKyD3tSntw3XIKjGJkJyKiQaaAFJggSTJnwwO8anAd_vXfn0WUdteEyP5ewH44tj0OkzNdF5Cir9NEJz74w8KkhHiUX27JGFMaV-p6P2X5ErEoqu8uCQs3wVARhormpUJaZvbcrdUUBzsIC9sYn6OLgMujc4b4tG6U7Khf1y8sGd4IuKCm24u2xSFLIebTTnBcRR4Xx6Iffdh8R4-njQ2yo=w1200',null,1),
  ('Zapatos de Cuero Clásicos','Bosque Salvia','Primeros pasos en cuero suave cosido a mano, con suela flexible en un salvia sereno.',110,'https://lh3.googleusercontent.com/aida-public/AB6AXuDsDr2SzHz-OJvyyCFXESlfg-Zm1JL0KkG56rh7bpXVuTXUMVlsrqcTNq1b59vEhJwLeBr4OgMqsN9aRH0Xq2ZqHjX0oaZJceyS3zJTotp1snLG6aOjYIUAN6_OHoaB-lRoscqvQbwltb3C3oOwh9MrXhLK4rv_Q3HtmI865s18wUU8EanFLtnottObVVT5hKmIWEDTLopS9_dePlmiUlR6ixwX26SPY3SRrQFIApKITw2Omz5g6zU2Vt1Rcfil3a7_04mUjCL5qJc=w1200',null,2),
  ('Sombrero de Malla de Algodón','Brillo de Atardecer','Malla de algodón ligera y transpirable con protección UPF 50+ en un cálido tono de atardecer.',45,'https://lh3.googleusercontent.com/aida-public/AB6AXuDaGeh_7VuQb89UI27OFLo0I5ORYkmMYr6DY3yEiBLc0w9dfDTc3Rcm1edZI6psYoPEudiLWz2Mtna1kXrhhq_Nq5oR_v8IkWqu7w5OzOguTQDMx94n7UHfsFSMwtyeOB0_3kAhaks3pzoOnSwB8xGgu18X0_wJT1wef2pup7H5fmBjZPrEiMLRqYtPoSieZ1UDYgq4A2FTk_3mfdUkuU2lb576jW5fWEEXS72V382L2mAktqWgyB4EI9QFVOZA67q6XxpsLG-6X74=w1200','Novedad',3)
) as v(name,subtitle,description,price,image_url,badge,sort) on true
where c.slug='ninos'
on conflict (category_id, name) do nothing;

-- Bebés
insert into public.products (category_id, name, subtitle, description, price, image_url, badge, sort)
select c.id, v.name, v.subtitle, v.description, v.price, v.image_url, v.badge, v.sort
from public.categories c
join (values
  ('Mameluco de Lino Orgánico','Flor de Durazno','Lino orgánico certificado GOTS, transpirable, con botones de madera y un suave tono durazno.',78,'https://lh3.googleusercontent.com/aida-public/AB6AXuDREPDst0HnusMBlGIHYxE1GjJHaPs2QPw_X_HqjnWI24-ecqShMebwsajA3F3lbttJd1ZlEb34tYfDCiGTRDJSP8TTjNHi9daZ4I6Tn6j9uAa0BlWRa-8jHw2cna0HL5Px4FzImzKOsGa0_bdRhjuoW4BUfjQU4bodTvAWmP2N7gZ_kwZ5ejyc2IbVE0TCc3BVFhQTITqiWSYoPafQdWy7YUw5Qq7BPKPxkz9RGQGca4kSl7JitkSkbcKI79FRdDOzfAXjlVxlyEU=w1200',null,1),
  ('Set de Mantas de Algodón','Mezcla Pradera','Tres mantas de muselina ultrasuave en una alegre mezcla de colores de pradera.',58,'https://lh3.googleusercontent.com/aida-public/AB6AXuAtRrHj8LvaGla1i8vCT9RGK7idOFLgO073kG9aUNTNDl5eebllELNDUwgZrAVlri-DpgrTApe2x_G9I51HCZ-7Tlkr20IzRthdqOEHwpnwI70fC-D05ZoP-EQ8pPjsw0GLwJtNLlDOY0fKWwSFcQlRU5ZDzZQmuL0SpMgO1ynYQBQqPZX5FkiO9b5Tn7JtUQ81dm5v0Q10sBSP22jGdF3CLI1mu-bvWuJnIruII_ccPqkFImsmJep34SxdwP0xzkOVKZnpSMSEpXA=w1200',null,2),
  ('Caja de Bienvenida','Esenciales Seleccionados','Una selección de esenciales para recién nacido, presentada en caja para el regalo de bienvenida perfecto.',185,'https://lh3.googleusercontent.com/aida-public/AB6AXuACBL2nB5Pv7MR8700WZcNg4ZDxrNm5TJifTdcWsWkUOoIPD2N6gq15VoeJEHzZ1DysCA-uelXVGh3_QFnQsWhs_ZO6S5EkZAbVnUoX1rSQIuAZ9fo9dzhkm8shSB25EXDKG4ZNr9G2dPgiALEYfSGALConOyMXBoxH8HUo3waVJMvgibR2LFPyS7tJDTt1b0nWemWyIz0MojkjQ80ZHa3f44rK_l9mgl3rDt3WLaAXac63d8KEjzVZ0UZ8R5KXQSZuXnw3V-YMjAA=w1200','Más Vendido',3)
) as v(name,subtitle,description,price,image_url,badge,sort) on true
where c.slug='bebes'
on conflict (category_id, name) do nothing;

-- Perfumes
insert into public.products (category_id, name, subtitle, description, price, image_url, badge, sort)
select c.id, v.name, v.subtitle, v.description, v.price, v.image_url, v.badge, v.sort
from public.categories c
join (values
  ('Lavanda Terciopelo','Eau de Parfum 50ml','Una mezcla serena de lavanda silvestre de Provenza, sándalo blanco y ámbar cálido.',185,'https://lh3.googleusercontent.com/aida-public/AB6AXuBxn4ecQRTHm_wv2dWvnZ1OyX-4cf3lKcy1uJ0EWVzyzT8a0DUdmyFVfnWUQwm6scXOr9jTFtknp8YlaO83DhSKQLZGGXzLDQ6Frx_Kej7NdsYvwmRjuzTt5oC9EVw0pIowHfS_oKCkxwEbV4aqu7zHBodJTzb25e5yyZro6NbeC-iAsdx-gJ61da41X6Zcdebbz8O2kJu8YIEfeOXPPfAamOeN3IJ-hmBP_FHDct90-hHUOcpA8sLPntalQJ4DgFeXzsx_FqytCJs=w1200','Novedad',1),
  ('Almizcle de Medianoche','Eau de Parfum 50ml','Notas profundas y terrosas de pachulí añejo con jazmín delicado y almizcle suave.',210,'https://lh3.googleusercontent.com/aida-public/AB6AXuCZeVHGogHgSipQV99evKGkaOuzAxMLwFac0RjJ0WhhWfTQSbE27V15daB8Gt17CJCbX1RZ-st_0qcLeb1k6EpVIgh_k17V_m2I0RyCbApblXZ997ZT6jQy37BCb70klVyAD9um-uDiS9o2ND4Rh7af8VmcHVqISjn9CPqEG5oAbisxOCGmzz3XtzXl03WZbUemLRHZEhyqypAQjrnrJ1UaUvBDVRynqLj3JwIRN6eOAAyGf0p3PyXtJ5GguWJhZp-M37S3bja84_I=w1200',null,2),
  ('Peonía de Mañana','Eau de Parfum 50ml','Un ramo floral luminoso con rosa búlgara, peonía y cítricos frescos.',195,'https://lh3.googleusercontent.com/aida-public/AB6AXuDYI2jZaTSTLS_cduR9loKfrTLnlQLWkdMpt7fVKPDer8yYOemNcA6WTIeCVeihC9TgZMk4OCruybHflypfTNj2dKYcZ9ooabw2nqYK8CCDae9MF1i-7pz2-jCKiIybdUsx9kjjAJ1s0M-xj86gS-rkkPV2L8qrhjufegaSHsuHwqHMfGAKXuD9F7bCyAJy40doh_fV0lpViDNnoLQaVqZ-0nf6VNFvD8GbzHF7ZpEIIlaHzwibC9PCCx0BbQRxMiOxxtSmpNgbsoo=w1200',null,3),
  ('Bruma Nórdica','Eau de Parfum 50ml','Brisa marina, bergamota y un toque de madera flotante para un escape refrescante.',160,'https://lh3.googleusercontent.com/aida-public/AB6AXuBHQcgIaq6A4YKCgxd-YAznBcCdfJQBppgL6QfTbpZ3fQTNKfEzZ7oT7EpJlnrSUXPPXcaiADj1mfdOXUBopifiOIb43RUikXyIy2CJr-Gx-XoCS86fd6rTS6tpiNHiEEIapUx-l8lf-ZmDF7N2yYdgYrNs2xqMJBLfnvdPr5KGhlEWb9EOQuWnM1bD4NDrrACgIj-Pg7JcWHs4cx-9DRSkdkJobvTGh8VKBOZxyRuek4jiUzaCiVWXD4IoYEvJNK1j_nlGfl8yFvs=w1200','Edición Limitada',4)
) as v(name,subtitle,description,price,image_url,badge,sort) on true
where c.slug='perfumes'
on conflict (category_id, name) do nothing;


-- ############ PARTE 2 de 2 · CUENTAS Y PERMISOS (auth.sql) ############

-- ============================================================================
--  Alvarez Boutique — Cuentas de dueños y permisos de inventario
--  Ejecutar DESPUÉS de schema.sql (SQL Editor → New query → pegar todo → Run)
--
--  IMPORTANTE (una sola vez): en Supabase ve a
--    Authentication → Sign In / Providers → Email
--  y DESACTIVA "Confirm email". Como los dueños entran con nombre de usuario
--  (no reciben correos), esto les permite iniciar sesión de inmediato.
--
--  Modelo de cuentas: TODAS las cuentas son iguales, no hay rangos ni
--  categorías asignadas. Cualquier cuenta con sesión puede subir y editar
--  productos de CUALQUIER categoría, y crear otras cuentas.
-- ============================================================================

-- 1) Un perfil por cuenta.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text,
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 2) ¿Ya existe alguna cuenta? (para el asistente de "primera cuenta")
create or replace function public.has_accounts()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles);
$$;
grant execute on function public.has_accounts() to anon, authenticated;

-- 3) Al registrar una cuenta, se crea su perfil automáticamente desde los
--    metadatos que envía la app.
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
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 4) Perfiles: toda cuenta con sesión ve la lista (pantalla Cuentas) y puede
--    editar únicamente el suyo. No hay rangos, así que nadie manda sobre nadie.
drop policy if exists "perfiles visibles con sesion" on public.profiles;
create policy "perfiles visibles con sesion" on public.profiles for select
  to authenticated using (true);

drop policy if exists "edita su propio perfil" on public.profiles;
create policy "edita su propio perfil" on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 5) Productos: el catálogo sigue siendo de lectura pública (política de
--    schema.sql). Escribir requiere sesión, pero no limita la categoría.
drop policy if exists "products insert con sesion" on public.products;
create policy "products insert con sesion" on public.products for insert
  to authenticated with check (true);

drop policy if exists "products update con sesion" on public.products;
create policy "products update con sesion" on public.products for update
  to authenticated using (true) with check (true);

drop policy if exists "products delete con sesion" on public.products;
create policy "products delete con sesion" on public.products for delete
  to authenticated using (true);

-- 6) Fotos de producto: bucket público de lectura; sólo cuentas con sesión suben.
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
