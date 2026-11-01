import {supabase} from "./supabase.ts";
import type {MovieVote, OnlineRoom, OnlineRoomMember} from "../types/onlineRoom.ts";
import {getCurrentUserId} from "./auth.ts";
import type {Mood} from "../types/session.ts";
import type {TmdbMovie} from "./tmdb.ts";

export async function createOnlineRoom(hostName:string):Promise<OnlineRoom> {
const name = hostName.trim()
    if( name === '') {
        throw new Error('Host name is required')    }

    const { data, error } = await supabase.rpc('create_online_room', {
        host_name: name,
    })
    if (error) {
        throw error
    }
    if (!data) {
        throw new Error('Online room was not created')
    }

    return data as OnlineRoom
}
export async function joinOnlineRoom(
    roomId: string,
    memberName: string,
): Promise<OnlineRoomMember> {
    const name = memberName.trim()
    if (!name) {
        throw new Error('Your name is required')
    }
    if(!roomId) {
        throw new Error('Can\'t join a room')
    }
    const {data, error} = await supabase.rpc('join_online_room', {
        target_room_id: roomId,
        member_name: name,
    })
    if (error) {
        throw error
    }
    if (!data) {
        throw new Error('Online room was not found')
    }
    return data as OnlineRoomMember
}

export async function getMyRoomMember(roomId:string): Promise<OnlineRoomMember | null> {
    if (!roomId) {
        throw new Error('Room ID is missing')
    }

    const userId = await getCurrentUserId()

    const {data , error} = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
        throw error
    }

    return data as OnlineRoomMember | null

}
export async function getOnlineRoom(
    roomId: string,
): Promise<OnlineRoom> {
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

    if (error) {
        throw error
    }

    if (!data) {
        throw new Error('Room was not found')
    }

    return data as OnlineRoom
}

export async function getRoomMembers(
    roomId: string,
): Promise<OnlineRoomMember[]> {
    const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })

    if (error) {
        throw error
    }

    return data as OnlineRoomMember[]
}

export async function startOnlineRound(
    roomId: string,
    mood: Mood,
    deckMovies:TmdbMovie[]
) : Promise<OnlineRoom> {
    if(!roomId) {
        throw new Error('Room ID is missing')
    }
    if (deckMovies.length === 0) {
        throw new Error('Movie deck is empty')
    }
    const {data, error} = await supabase
        .from('rooms')
        .update({
            mood: mood,
            deck_movies: deckMovies,
            status: 'choosing'
        })
        .eq('id', roomId)
        .select()
        .single()

    if (error) {
        throw error
    }
    if (!data) {
        throw new Error('Room was not found')
    }
    return data as OnlineRoom

}
export async function saveOnlineVote(
    roomId: string,
    movieId: number,
    isLiked: boolean,
): Promise<void> {
    if (!roomId) {
        throw new Error('Room ID is missing')
    }
    const currentUserId = await getCurrentUserId()
    const { error} = await supabase
    .from('movie_votes')
        .upsert({
            room_id: roomId,
            user_id: currentUserId,
            movie_id: movieId,
            is_liked: isLiked,
        },
            {
                onConflict: 'room_id,user_id,movie_id',
            })

if (error) {
    throw error
}

}

export async function getMyOnlineVotes(roomId:string): Promise<MovieVote[]> {
if (!roomId) {
    throw new Error('Room ID is missing')
}
const currentUserId = await getCurrentUserId()

    const {data, error} = await supabase
        .from('movie_votes')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', currentUserId)

    if (error) {
        throw error
    }
    return (data ?? []) as MovieVote[]

}
export async function getOnlineRoomVotes(roomId:string):Promise<MovieVote[]>{
    if (!roomId) {
        throw new Error('Room ID is missing')
    }

    const {data, error} = await supabase
        .from('movie_votes')
        .select('*')
        .eq('room_id', roomId)

    if(error) {
        throw error
    }
    return (data ?? []) as MovieVote[]

}
export async function markMyRoomMemberFinished(roomId: string): Promise<void> {
    if (!roomId) {
        throw new Error('Room ID is missing')
    }
    const currentUserId = await getCurrentUserId()
    const {error} = await supabase
    .from('room_members')
        .update({
            is_finished: true,
        })
        .eq('room_id', roomId)
        .eq('user_id', currentUserId)

    if (error) {
        throw error
    }
}