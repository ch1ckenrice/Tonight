import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { MovieVote, OnlineRoom, OnlineRoomMember } from '../types/onlineRoom.ts'
import { getOnlineRoom, getOnlineRoomVotes, getRoomMembers } from '../services/onlineRooms.ts'
import { MovieCard } from '../components/MovieCard.tsx'
import type { RecentRound } from '../types/round'
import { saveRecentRound } from '../services/roundStorage.ts'
import { Footer } from '../components/Footer.tsx'
import { PageState } from '../components/PageState.tsx'
import { getOnlineRoomRoute } from '../utils/onlineRoomRoute.ts'

export function OnlineResultsPage() {

    const { roomId } = useParams()
    const navigate = useNavigate()
    const [room, setRoom] = useState<OnlineRoom | null>(null)
    const [members, setMembers] = useState<OnlineRoomMember[]>([])
    const [votes, setVotes] = useState<MovieVote[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [errorMessage, setErrorMessage] = useState<string>('')

    useEffect(() => {
       async function loadRoom() {
           if(!roomId) {
               setErrorMessage('Room link is invalid')
               setIsLoading(false)
               return
           }
           try {
               setIsLoading(true)
               setErrorMessage('')

               const [loadedRoom, loadedRoomMembers, savedVotes] = await Promise.all([
                   getOnlineRoom(roomId),
                   getRoomMembers(roomId),
                   getOnlineRoomVotes(roomId),

               ])
               setRoom(loadedRoom)
               setMembers(loadedRoomMembers)
               setVotes(savedVotes)
           }catch {
               setErrorMessage('Could not load this movie night')
           } finally {
               setIsLoading(false)
           }
       }

        void loadRoom()

    }, [roomId])

    useEffect(() => {
        if (!room) {
            return
        }

        const roomRoute = getOnlineRoomRoute(room)

        if (roomRoute !== `/room/${room.id}/results`) {
            navigate(roomRoute, { replace: true })
        }
    }, [room, navigate])


    if(isLoading) {
        return <PageState eyebrow="ONLINE MOVIE NIGHT" title="Loading results..." isLoading />
    }
    if (errorMessage) {
        return (
            <PageState
                eyebrow="ONLINE MOVIE NIGHT"
                title="Could not load this movie night."
                message={errorMessage}
                actionLabel="Back home"
            />
        )
    }

    if (!room) {
        return <PageState title="Room not found." actionLabel="Back home" />
    }

    if (room.status !== 'results') {
        return (
            <PageState
                eyebrow="ONLINE MOVIE NIGHT"
                title="Taking you to your room..."
                message="Results are available after everyone has finished choosing."
            />
        )
    }

    const matchedMovies = room.deck_movies.filter((movie) =>
        members.every((member) =>
            votes.some((vote) => {
                return(
                    vote.user_id === member.user_id && vote.movie_id === movie.id && vote.is_liked
                )
            }),
        ),
    )
    function getLikeCount(movieId:number): number {
        const likedMovieCount = votes.filter((vote) => vote.movie_id === movieId && vote.is_liked)
        return likedMovieCount.length
    }
    const rankedMovies = room.deck_movies.map((movie) => ({
        movie: movie,
        likeCount: getLikeCount(movie.id),
    }))
    rankedMovies.sort((a, b) => b.likeCount - a.likeCount || b.movie.vote_average - a.movie.vote_average)

    const bestMovie =  matchedMovies.length > 0
        ? matchedMovies.reduce((bestMovie, movie) => {
            if(bestMovie.vote_average > movie.vote_average) {
                return bestMovie
            }
            return movie
        }) : rankedMovies[0]?.movie

  if(!bestMovie) {
      return (
          <PageState
              eyebrow="ONLINE MOVIE NIGHT"
              title="No recommendation found."
              message="This room did not contain enough saved votes to choose a film."
              actionLabel="Back home"
          />
      )
  }
    const otherMatchedMovies = matchedMovies.filter(
        (movie) => movie.id !== bestMovie.id,
    )

    function handleFinishRound() {
        if (!room || room.mood === null) {
            return
        }

        const recentRound: RecentRound = {
            bestMovie,
            mood: room.mood,
            watchMode: 'group',
            participantCount: members.length,
            completedAt: new Date().toISOString(),
        }

        saveRecentRound(recentRound)
    }

    return (
        <main className="app results-page">
            <header className='results-header'>
                <Link
                    className='back-link'
                    to="/"
                    onClick={handleFinishRound}
                >
                    ← Back To Home
                </Link>

                <Link
                    className="brand"
                    to="/"
                    aria-label="Tonight home"
                    onClick={handleFinishRound}
                >
                    tonight<span>•</span>
                </Link>
            </header>
            <div className="app-content results-content">

                <p className="eyebrow">YOUR MOVIE DECK</p>
                <article>
                    <h2>Tonight’s pick</h2>
                    <MovieCard className="results-featured-card" movie={bestMovie} showOverview />

                    <small className="top-pick-text">
                        {matchedMovies.length > 0
                            ? 'ⓘ Chosen from films everyone liked, based on the highest TMDB rating.'
                            : `ⓘ Most liked by the group — ${getLikeCount(bestMovie.id)} of ${members.length} people liked it.`}
                    </small>

                    {otherMatchedMovies.length > 0 && (
                        <>
                            <h4>More matches</h4>
                            <div className="movie-grid">
                                {otherMatchedMovies.map((movie) => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </div>
                        </>
                    )}
                </article>
            </div>
            <Footer />
        </main>
    )
}
