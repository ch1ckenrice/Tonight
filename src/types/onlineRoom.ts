import type {Mood} from "./session.ts";
import type {TmdbMovie} from "../services/tmdb.ts";

export type RoomStatus = 'lobby' | 'choosing' | 'results'

export type OnlineRoom = {
    id: string
    host_user_id: string
    mood: Mood | null
    deck_movies: TmdbMovie[]
    status: RoomStatus
    created_at: string
}
export type OnlineRoomMember = {
    id: string
    room_id: string
    user_id: string
    name: string
    is_finished: boolean
    joined_at: string
}
export type MovieVote = {
    room_id: string
    user_id: string
    movie_id: number
    is_liked: boolean
    created_at: string
}