import type {TonightSession} from "./session";
import type {TmdbMovie} from "../services/tmdb";

export type ChooseStage = 'choosing' | 'handoff' | 'results'

export type LikedMovieIdsByParticipant = Record<string, number[]>

export type StoredRound = {
    session: TonightSession
    deckMovies: TmdbMovie[]
    currentMovieIndex: number
    currentParticipantIndex: number
    likedMovieIds: LikedMovieIdsByParticipant
    chooseStage: ChooseStage
}