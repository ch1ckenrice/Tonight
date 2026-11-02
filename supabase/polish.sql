-- Tonight online-room hardening migration
-- Run this file once in Supabase SQL Editor for an existing project.

-- Online state changes go through controlled RPC functions instead of direct
-- table writes, so a client cannot restart a live room or submit arbitrary votes.
revoke insert, update on table public.rooms from authenticated;
revoke insert, update on table public.room_members from authenticated;
revoke insert, update on table public.movie_votes from authenticated;

drop policy if exists "Users can create rooms they host" on public.rooms;
drop policy if exists "Hosts can update their rooms" on public.rooms;
drop policy if exists "Users can join lobby rooms as themselves" on public.room_members;
drop policy if exists "Users can update their own membership" on public.room_members;
drop policy if exists "Members can create their own votes while choosing" on public.movie_votes;
drop policy if exists "Users can update their own votes while choosing" on public.movie_votes;

create or replace function public.create_online_room(host_name text)
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
  values ((select auth.uid()))
  returning * into new_room;

  insert into public.room_members (room_id, user_id, name)
  values (new_room.id, (select auth.uid()), pg_catalog.btrim(host_name));

  return new_room;
end;
$$;

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
  values (target_room_id, (select auth.uid()), pg_catalog.btrim(member_name))
  on conflict (room_id, user_id) do update
  set name = excluded.name
  returning * into joined_member;

  return joined_member;
end;
$$;

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

revoke all on function public.create_online_room(text) from public;
revoke all on function public.join_online_room(uuid, text) from public;
revoke all on function public.start_online_round(uuid, text, jsonb) from public;
revoke all on function public.save_online_vote(uuid, integer, boolean) from public;
revoke all on function public.finish_online_selection(uuid) from public;

grant execute on function public.create_online_room(text) to authenticated;
grant execute on function public.join_online_room(uuid, text) to authenticated;
grant execute on function public.start_online_round(uuid, text, jsonb) to authenticated;
grant execute on function public.save_online_vote(uuid, integer, boolean) to authenticated;
grant execute on function public.finish_online_selection(uuid) to authenticated;
