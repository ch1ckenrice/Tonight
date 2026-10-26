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

grant select, insert, update on table public.rooms to authenticated;
grant select, insert, update on table public.room_members to authenticated;
grant select, insert, update on table public.movie_votes to authenticated;

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

create
policy "Users can create rooms they host"
on public.rooms
for insert
to authenticated
with check (
  host_user_id = (select auth.uid())
);

create
policy "Hosts can update their rooms"
on public.rooms
for
update
    to authenticated
    using (
    host_user_id = (select auth.uid())
    )
with check (
    host_user_id = (select auth.uid())
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

create
policy "Users can join lobby rooms as themselves"
on public.room_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and private.get_room_status(room_id) = 'lobby'
);

create
policy "Users can update their own membership"
on public.room_members
for
update
    to authenticated
    using (
    user_id = (select auth.uid())
    )
with check (
    private.is_own_member(id, room_id, user_id)
    and private.get_room_status(room_id) in ('lobby', 'choosing')
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

create
policy "Members can create their own votes while choosing"
on public.movie_votes
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and private.is_room_member(room_id)
  and private.get_room_status(room_id) = 'choosing'
);

create
policy "Users can update their own votes while choosing"
on public.movie_votes
for
update
    to authenticated
    using (
    user_id = (select auth.uid())
    )
with check (
    private.is_own_vote(room_id, user_id, movie_id)
    and private.get_room_status(room_id) = 'choosing'
    );
