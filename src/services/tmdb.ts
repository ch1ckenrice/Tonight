import type { Mood } from '../types/session'

export type TmdbMovie = {
    id: number
    title: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    vote_average: number
    release_date: string
    genre_ids: number[]
}
type PopularMoviesResponse = {
    results: TmdbMovie[]
}

type DiscoverMoviesResponse = {
    results: TmdbMovie[]
}

const API_BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const accessToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN

const moodGenreIds: Record<Mood, number> = {
    easy: 10749,
    fun: 35,
    tense: 53,
    thoughtful: 18,
}

export async function getMoviesForMood(mood:Mood, page:number): Promise<TmdbMovie[]> {
    const genreId = moodGenreIds[mood]

    const response = await fetch(
        `${API_BASE_URL}/discover/movie?language=en-US&sort_by=popularity.desc&with_genres=${genreId}&page=${page}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                accept: 'application/json',
            },
        },
    )

    if (!response.ok) {
        throw new Error('Не вдалося завантажити фільми')
    }
    const data:DiscoverMoviesResponse = await response.json()
    return data.results
}

export async function getPopularMovies() : Promise<TmdbMovie[]> {
    const response = await fetch(
        `${API_BASE_URL}/movie/popular?language=en-US&page=1`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                accept: 'application/json',
            },
        },
    )
    if (!response.ok) {
        throw new Error('Не вдалося завантажити фільми')
    }
    const data: PopularMoviesResponse = await response.json()
    return data.results
}

export function getPosterUrl(posterPath: string): string {
    return `${IMAGE_BASE_URL}${posterPath}`
}