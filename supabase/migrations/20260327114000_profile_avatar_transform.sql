alter table public.profiles
  add column if not exists avatar_zoom numeric(4,2) not null default 1.15,
  add column if not exists avatar_position_x integer not null default 50,
  add column if not exists avatar_position_y integer not null default 50;

update public.profiles
set
  avatar_zoom = coalesce(avatar_zoom, 1.15),
  avatar_position_x = coalesce(avatar_position_x, 50),
  avatar_position_y = coalesce(avatar_position_y, 50);
