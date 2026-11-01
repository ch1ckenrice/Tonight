import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { MovieVote, OnlineRoom, OnlineRoomMember } from '../types/onlineRoom.ts'
import { getOnlineRoom, getOnlineRoomVotes, getRoomMembers } from '../services/onlineRooms.ts'
import { MovieCard } from '../components/MovieCard.tsx'
import type { RecentRound } from '../types/round'
import { saveRecentRound } from '../services/roundStorage.ts'
import { Footer } from '../components/Footer.tsx'

export function OnlineResultsPage() {

    const { roomId } = useParams()
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



    if(isLoading) {
        return (
        <main className="app">
            <h1>Loading...</h1>
        </main>
        )
    }
    if (errorMessage) {
        return <main className="app">{errorMessage}</main>
    }

    if (!room) {
        return <main className="app">Room not found</main>
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
          <main className="app">
              <div className="app-content">
                  <p>No movie recommendation was found for this room.</p>
                  <Link className="primary-button" to="/">
                      Back to home
                  </Link>
              </div>
          </main>
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
        <main className="app">
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
            <div className="app-content">

                <p className="eyebrow">YOUR MOVIE DECK</p>
                <article>
                    <h2>Tonight’s pick</h2>
                    <MovieCard movie={bestMovie} showOverview />

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
