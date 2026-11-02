-- Tables

create table public.rooms
(
    id           uuid primary key     default gen_random_uuid(),
    host_user_id uuid        not null references auth.users (id) on delete cascade,
    mood         text check (mood in ('easy', 'fun', 'tense', 'thoughtful')),
    deck_movies  jsonb       not null default '[]'::jsonb
    check (jsonb_typeof(deck_movies) = 'array'),
    status       text        not null default 'lobby'
        check (status in ('lobby', 'choosing', 'results')),
    created_at   timestamptz not null default now()
);

create table public.room_members
(
    id          uuid primary key     default gen_random_uuid(),
    room_id     uuid        not null references public.rooms (id) on delete cascade,
    user_id     uuid        not null references auth.users (id) on delete cascade,
    name        text        not null
        check (char_length(btrim(name)) between 1 and 30),
    is_finished boolean     not null default false,
    joined_at   timestamptz not null default now(),
    unique (room_id, user_id)
);

create table public.movie_votes
(
    room_id    uuid        not null references public.rooms (id) on delete cascade,
    user_id    uuid        not null references auth.users (id) on delete cascade,
    movie_id   integer     not null,
    is_liked   boolean     not null,
    created_at timestamptz not null default now(),

    primary key (room_id, user_id, movie_id),

    foreign key (room_id, user_id)
        references public.room_members (room_id, user_id)
        on delete cascade
);

-- Enable RLS and allow authenticated API requests.
-- Actual access is defined below by policies.

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.movie_votes enable row level security;

revoke all on table public.rooms from anon;
revoke all on table public.room_members from anon;
revoke all on table public.movie_votes from anon;

grant select on table public.rooms to authenticated;
grant select on table public.room_members to authenticated;
grant select on table public.movie_votes to authenticated;

-- Private RLS helper functions

create schema if not exists private;

revoke all on schema private from public;
grant
usage
on
schema
private to authenticated;

create function private.is_room_member(target_room_id uuid)
    returns boolean
    language sql
    security definer
set search_path = ''
stable
as $$
select exists (select 1
               from public.room_members
               where room_id = target_room_id
                 and user_id = (select auth.uid()));
$$;

create function private.get_room_status(target_room_id uuid)
    returns text
    language sql
    security definer
set search_path = ''
stable
as $$
select status
from public.rooms
where id = target_room_id;
$$;

create function private.is_own_member(
    target_member_id uuid,
    target_room_id uuid,
    target_user_id uuid
)
    returns boolean
    language sql
    security definer
set search_path = ''
stable
as $$
select exists (select 1
               from public.room_members
               where id = target_member_id
                 and room_id = target_room_id
                 and user_id = target_user_id
                 and user_id = (select auth.uid()));
$$;

create function private.is_own_vote(
    target_room_id uuid,
    target_user_id uuid,
    target_movie_id integer
)
    returns boolean
    language sql
    security definer
set search_path = ''
stable
as $$
select exists (select 1
               from public.movie_votes
               where room_id = target_room_id
                 and user_id = target_user_id
                 and movie_id = target_movie_id
                 and user_id = (select auth.uid()));
$$;

revoke all on function private.is_room_member(uuid) from public;
revoke all on function private.get_room_status(uuid) from public;
revoke all on function private.is_own_member(uuid, uuid, uuid) from public;
revoke all on function private.is_own_vote(uuid, uuid, integer) from public;

grant
execute
on
function
private
.
is_room_member
(uuid) to authenticated;
grant execute on function private.get_room_status
(uuid) to authenticated;
grant execute on function private.is_own_member
(uuid, uuid, uuid) to authenticated;
grant execute on function private.is_own_vote
(uuid, uuid, integer) to authenticated;

-- Rooms policies

create
policy "Room members can view their rooms"
on public.rooms
for
select
    to authenticated
    using (
    host_user_id = (select auth.uid())
    or private.is_room_member(id)
    );

-- Room members policies

create
policy "Members can view room participants"
on public.room_members
for
select
    to authenticated
    using (
    private.is_room_member(room_id)
    );

-- Movie votes policies

create
policy "Users can view their own votes or completed results"
on public.movie_votes
for
select
    to authenticated
    using (
    user_id = (select auth.uid())
    or (
    private.is_room_member(room_id)
    and private.get_room_status(room_id) = 'results'
    )
    );

create function public.create_online_room(host_name text)
    returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
new_room public.rooms;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if host_name is null or char_length(pg_catalog.btrim(host_name)) not between 1 and 30 then
    raise exception 'Host name must be between 1 and 30 characters';
  end if;

insert into public.rooms (host_user_id)
values ((select auth.uid())) returning *
into new_room;

insert into public.room_members (room_id, user_id, name)
values (new_room.id,
        (select auth.uid()),
        pg_catalog.btrim(host_name));

return new_room;
end;
$$;

revoke all on function public.create_online_room(text) from public;

grant
execute
on
function
public
.
create_online_room
(text) to authenticated;

create or replace function public.join_online_room(
    target_room_id uuid,
    member_name text
)
    returns public.room_members
language plpgsql
security definer
set search_path = ''
as $$
declare
joined_member public.room_members;
target_room public.rooms;
member_count integer;
already_joined boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if member_name is null or char_length(pg_catalog.btrim(member_name)) not between 1 and 30 then
    raise exception 'Name must be between 1 and 30 characters';
  end if;

  select *
  into target_room
  from public.rooms
  where id = target_room_id
  for update;

  if not found then
    raise exception 'Room was not found';
  end if;

  if target_room.status <> 'lobby' then
    raise exception 'This room is not available to join';
  end if;

  select exists (
    select 1
    from public.room_members
    where room_id = target_room_id
      and user_id = (select auth.uid())
  )
  into already_joined;

  if not already_joined then
    select count(*)
    into member_count
    from public.room_members
    where room_id = target_room_id;

    if member_count >= 8 then
      raise exception 'This room is full';
    end if;
  end if;

insert into public.room_members (room_id, user_id, name)
values (target_room_id,
        (select auth.uid()),
        pg_catalog.btrim(member_name)) on conflict (room_id, user_id) do
update
    set name = excluded.name
    returning *
into joined_member;

return joined_member;
end;
$$;

revoke all on function public.join_online_room(uuid, text) from public;

grant
execute
on
function
public
.
join_online_room
(uuid, text) to authenticated;

create or replace function public.start_online_round(
    target_room_id uuid,
    selected_mood text,
    selected_deck_movies jsonb
)
    returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
started_room public.rooms;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if selected_mood is null or selected_mood not in ('easy', 'fun', 'tense', 'thoughtful') then
    raise exception 'A valid mood is required';
  end if;

  if jsonb_typeof(selected_deck_movies) is distinct from 'array'
     or jsonb_array_length(selected_deck_movies) <> 12 then
    raise exception 'A complete movie deck is required';
  end if;

  update public.rooms
  set mood = selected_mood,
      deck_movies = selected_deck_movies,
      status = 'choosing'
  where id = target_room_id
    and host_user_id = (select auth.uid())
    and status = 'lobby'
  returning * into started_room;

  if not found then
    raise exception 'This room can no longer start a new round';
  end if;

  return started_room;
end;
$$;

revoke all on function public.start_online_round(uuid, text, jsonb) from public;

grant execute on function public.start_online_round(uuid, text, jsonb) to authenticated;

create or replace function public.save_online_vote(
    target_room_id uuid,
    target_movie_id integer,
    selected_is_liked boolean
)
    returns public.movie_votes
language plpgsql
security definer
set search_path = ''
as $$
declare
room_deck jsonb;
saved_vote public.movie_votes;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  select deck_movies
  into room_deck
  from public.rooms
  where id = target_room_id
    and status = 'choosing';

  if not found then
    raise exception 'This room is not accepting votes';
  end if;

  if not exists (
    select 1
    from public.room_members
    where room_id = target_room_id
      and user_id = (select auth.uid())
  ) then
    raise exception 'You are not a member of this room';
  end if;

  if exists (
    select 1
    from public.room_members
    where room_id = target_room_id
      and user_id = (select auth.uid())
      and is_finished = true
  ) then
    raise exception 'You have already finished choosing';
  end if;

  if not exists (
    select 1
    from pg_catalog.jsonb_array_elements(room_deck) as deck_movie(movie)
    where (deck_movie.movie ->> 'id')::integer = target_movie_id
  ) then
    raise exception 'This movie is not part of the room deck';
  end if;

  insert into public.movie_votes (room_id, user_id, movie_id, is_liked)
  values (target_room_id, (select auth.uid()), target_movie_id, selected_is_liked)
  on conflict (room_id, user_id, movie_id) do update
  set is_liked = excluded.is_liked
  returning * into saved_vote;

  return saved_vote;
end;
$$;

revoke all on function public.save_online_vote(uuid, integer, boolean) from public;

grant execute on function public.save_online_vote(uuid, integer, boolean) to authenticated;

create or replace function public.finish_online_selection(target_room_id uuid)
    returns public.room_members
language plpgsql
security definer
set search_path = ''
as $$
declare
deck_size integer;
vote_count integer;
finished_member public.room_members;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  select jsonb_array_length(deck_movies)
  into deck_size
  from public.rooms
  where id = target_room_id
    and status = 'choosing';

  if not found then
    raise exception 'This room is not accepting selections';
  end if;

  select count(*)
  into vote_count
  from public.movie_votes
  where room_id = target_room_id
    and user_id = (select auth.uid());

  if vote_count < deck_size then
    raise exception 'All movies must be decided before finishing';
  end if;

  update public.room_members
  set is_finished = true
  where room_id = target_room_id
    and user_id = (select auth.uid())
  returning * into finished_member;

  if not found then
    raise exception 'You are not a member of this room';
  end if;

  return finished_member;
end;
$$;

revoke all on function public.finish_online_selection(uuid) from public;

grant execute on function public.finish_online_selection(uuid) to authenticated;

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;

create or replace function public.finish_room_when_everyone_is_done()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_finished = true and old.is_finished is distinct from true then
    if not exists (
      select 1
      from public.room_members
      where room_id = new.room_id
        and is_finished = false
    ) then
update public.rooms
set status = 'results'
where id = new.room_id
  and status = 'choosing';
end if;
end if;

return new;
end;
$$;

drop trigger if exists finish_room_when_everyone_is_done
on public.room_members;

create trigger finish_room_when_everyone_is_done
    after update of is_finished on public.room_members
    for each row
    execute function public.finish_room_when_everyone_is_done();
