import {Link, Navigate, useLocation} from 'react-router-dom'
import type { TonightSession } from '../types/session'
import {useEffect, useRef, useState, type PointerEvent } from "react";
import {getMoviesForMood, type TmdbMovie} from "../services/tmdb.ts";
import { MovieCard } from '../components/MovieCard'
import {SwipeMovieCard} from "../components/SwipeMovieCard.tsx";

const SWIPE_THRESHOLD = {
    like: 110,
    skip:-110
}

export function ChoosePage() {
    const location = useLocation()
    const session = location.state as TonightSession | null
    const mood = session?.mood
    const [movies, setMovies] = useState<TmdbMovie[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
    const currentMovie = movies[currentMovieIndex]
    const [likedMovieIds, setLikedMovieIds] = useState<number[]>([])
    const [dragX, setDragX] = useState<number>(0)
    const [isDragging, setIsDragging] = useState(false)
    const dragStartX = useRef<number>(0)
    const dragXRef = useRef(0)
    const [exitDirection , setExitDirection] = useState<'like' | 'skip' | null>(null)

    let cardTransform = `translateX(${dragX}px) rotate(${dragX / 20}deg)`
    if (exitDirection === 'like') {
        cardTransform = 'translateX(120vw) rotate(12deg)'
    }
    else if (exitDirection === 'skip') {
        cardTransform = 'translateX(-120vw) rotate(-12deg)'
    }

    const cardStyle = {
        transform: cardTransform,
        transition: isDragging
            ? 'none'
            : 'transform 620ms cubic-bezier(0.4, 0, 0.2, 1)',
    }

    useEffect(() => {
        if (!mood) {
            return
        }
        const selectedMood = mood

        async function loadFilteredMovies() {
            try {
                setIsLoading(true)
                setErrorMessage('')

                const randomPage = Math.floor(Math.random() * 10) + 1

                const filteredMovies = await getMoviesForMood(selectedMood,randomPage )

                setMovies(filteredMovies)
            } catch {
                setErrorMessage('Something went wrong')
            } finally {
                setIsLoading(false)
            }
        }

        loadFilteredMovies()
    }, [mood])

    function handleSkip() {
        setCurrentMovieIndex((currentIndex) => currentIndex + 1)
    }
    function handleLike() {
        if(!currentMovie) {
            return
        }
        setLikedMovieIds((previousIds) => {
            if(previousIds.includes(currentMovie.id)){
                return previousIds
            }
            return[ ...previousIds , currentMovie.id]

        })
        setCurrentMovieIndex((currentIndex) => currentIndex + 1)
    }

    function handlePointerDown(event:PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId)
        dragXRef.current = 0
        dragStartX.current = event.clientX
        setIsDragging(true)
    }

    function handlePointerEnd() {
        setIsDragging(false)
        const finalDragX = dragXRef.current
        if (finalDragX > SWIPE_THRESHOLD.like) {
            handleLike()
        }
        else if (finalDragX < SWIPE_THRESHOLD.skip) {
            handleSkip()
        }
        dragXRef.current = 0
        setDragX(0)
    }
    function handlePointerCancel() {
        setIsDragging(false)
        dragXRef.current = 0
        setDragX(0)
    }

    function startButtonSwipe(direction: 'like' | 'skip') {
        setExitDirection(direction)
    }

    function handleCardTransitionEnd() {
        if (exitDirection === null) {
            return
        }
        if (exitDirection === 'like') {
            handleLike()
        }else {
            handleSkip()
        }
        setExitDirection(null)
    }

    useEffect(() => {
        if(!isDragging) {
            return
        }
        function handleWindowPointerMove(event: globalThis.PointerEvent) {
            const diff = event.clientX - dragStartX.current;
            dragXRef.current = diff
            setDragX(diff)
        }
        function handleWindowPointerUp() {
            handlePointerEnd()
        }
        function handleWindowBlur() {
            handlePointerCancel()
        }

        window.addEventListener('pointermove', handleWindowPointerMove)
        window.addEventListener('pointerup', handleWindowPointerUp)
        window.addEventListener('blur', handleWindowBlur)

        return () => {
            window.removeEventListener('pointermove', handleWindowPointerMove)
            window.removeEventListener('pointerup', handleWindowPointerUp)
            window.removeEventListener('blur', handleWindowBlur)
        }
    }, [isDragging])

    if(!session) {
        return <Navigate  to="/setup" replace />
    }

    const people = [
        session.hostName,
        ...session.friends.map((friend) => friend.name),
    ]

    const likedMovies = movies.filter((movie) => likedMovieIds.includes(movie.id))

    const bestMovie =  likedMovies.length > 0
        ? likedMovies.reduce((bestMovie, movie) => {
       if(bestMovie.vote_average > movie.vote_average) {
           return bestMovie
       }
       return movie
    }) : null

    const otherLikedMovies = bestMovie
        ? likedMovies.filter((movie) => movie.id !== bestMovie.id)
        : []

    let likeOpacity
    if(exitDirection === 'like') {
        likeOpacity = 1
    } else {
        likeOpacity= Math.min(Math.max(dragX / SWIPE_THRESHOLD.like, 0), 1)
    }
    let skipOpacity
    if(exitDirection === 'skip') {
        skipOpacity = 1
    } else {
        skipOpacity = Math.min(Math.max(dragX / SWIPE_THRESHOLD.skip, 0), 1)
    }
    return (
        <main className="app">
            <div style={{ opacity: likeOpacity }} className="swipe-feedback swipe-feedback-like">
                <span className="swipe-label swipe-label-like">LIKE</span>
            </div>
            <div style={{ opacity: skipOpacity }} className="swipe-feedback swipe-feedback-skip">
                <span className="swipe-label swipe-label-skip">SKIP</span>
            </div>
            <div className="app-content">
            <p className="eyebrow">YOUR MOVIE DECK</p>

            <h1>
                Ready, {session.hostName}.
                <br />
                Let’s find tonight’s film.
            </h1>

            <p className="hero-copy">
                Mood: {session.mood}. Watching with: {people.join(', ')}.
            </p>

            {isLoading && <p>Loading movies...</p>}

            {errorMessage && <p>{errorMessage}</p>}

            {!isLoading && !errorMessage && currentMovie && (
                <section className="choice-stage">
                    <div
                        key={currentMovie.id}
                        className="swipe-card"
                        onPointerDown={handlePointerDown}
                        onTransitionEnd={handleCardTransitionEnd}
                        style={cardStyle}
                    >
                    <SwipeMovieCard movie={currentMovie} showOverview />
                    </div>
                    <div className="choice-actions">
                        <button
                            className="skip-button swipe-button"
                            aria-label="Skip this movie"
                            type="button"
                            onClick={() => startButtonSwipe('skip')}
                        >
                            ×
                        </button>
                        <button
                        className="like-button swipe-button"
                        aria-label="Like this movie"
                        type="button"
                        onClick={() => startButtonSwipe('like')}
                        >
                            ♥
                        </button>
                    </div>
                </section>
            )}
            {!isLoading && !errorMessage && !currentMovie && (
              <div>

                  {bestMovie ? (
                      <article>
                          <h2>Tonight’s pick</h2>
                      <MovieCard movie={bestMovie} showOverview/>
                      <small className="top-pick-text">ⓘ Chosen from your likes based on the highest TMDB rating.</small>


                          {otherLikedMovies.length > 0 && (
                          <>
                          <h4> Movies you liked</h4>
                              <div className="movie-grid">
                                  { otherLikedMovies.map((movie) =>(
                                      <MovieCard  key={movie.id} movie={movie}/>
                                  ))}
                              </div>
                          </>
                          )}
                      </article>

                  ) : (
                      <>
                          <h2>Nothing saved this time.</h2>
                          <p>Choose a different mood and we’ll build a new movie deck.</p>

                          <Link to="/setup" className="primary-button">
                              Choose a mood
                          </Link>
                      </>
                  )}




              </div>
            )}

            </div>
        </main>
    )
}
