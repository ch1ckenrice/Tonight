import {Link, Navigate, useLocation} from 'react-router-dom'
import type { TonightSession } from '../types/session'
import {useEffect, useRef, useState, type PointerEvent } from "react";
import {getMoviesForMood, type TmdbMovie} from "../services/tmdb.ts";
import { MovieCard } from '../components/MovieCard'
import {SwipeMovieCard} from "../components/SwipeMovieCard.tsx";
import type {ChooseStage, LikedMovieIdsByParticipant, RecentRound, StoredRound} from "../types/round.ts";
import {clearStoredRound, getStoredRound, saveRecentRound, saveStoredRound} from "../services/roundStorage.ts";

const SWIPE_THRESHOLD = {
    like: 110,
    skip:-110
}
const DECK_SIZE = 12


export function ChoosePage() {
    const location = useLocation()
    const locationSession = location.state as TonightSession | null
    const [savedRound] = useState<StoredRound | null>(() => getStoredRound())

    const shouldRestoreRound =
        savedRound !== null &&
        (!locationSession || savedRound.session.host.id === locationSession.host.id)

    const storedRound = shouldRestoreRound ? savedRound : null

    const session = storedRound?.session ?? locationSession ?? null
    const mood = session?.mood
    const [movies, setMovies] = useState<TmdbMovie[]>(storedRound?.deckMovies ?? [])
    const deckMovies = movies.slice(0, DECK_SIZE)
    const [isLoading, setIsLoading] = useState(storedRound === null)
    const [errorMessage, setErrorMessage] = useState('')
    const [currentMovieIndex, setCurrentMovieIndex] = useState(storedRound?.currentMovieIndex ?? 0)
    const currentMovie = deckMovies[currentMovieIndex]
    const [likedMovieIds, setLikedMovieIds] = useState<LikedMovieIdsByParticipant>(storedRound?.likedMovieIds ?? {})
    const [dragX, setDragX] = useState<number>(0)
    const [isDragging, setIsDragging] = useState(false)
    const dragStartX = useRef<number>(0)
    const dragXRef = useRef(0)
    const [exitDirection , setExitDirection] = useState<'like' | 'skip' | null>(null)
    const [currentParticipantIndex, setCurrentParticipantIndex] = useState<number>(storedRound?.currentParticipantIndex ?? 0)
    const [chooseStage, setChooseStage] = useState<ChooseStage>(storedRound?.chooseStage ?? 'choosing')
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

    const isGroupMode = session?.watchMode === 'group'

    useEffect(() => {
        if (!mood || storedRound) {
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
    }, [mood, storedRound])

    useEffect(() => {
        if(!session || deckMovies.length === 0) {
            return
        }
        const roundToSave: StoredRound = {
            session: session,
            deckMovies: deckMovies,
            currentMovieIndex: currentMovieIndex,
            currentParticipantIndex: currentParticipantIndex,
            likedMovieIds: likedMovieIds,
            chooseStage: chooseStage,
        }
        saveStoredRound(roundToSave)

    }, [session,
        movies,
        currentMovieIndex,
        currentParticipantIndex,
        likedMovieIds,
        chooseStage])

    function advanceAfterDecision() {
        if( currentMovieIndex === deckMovies.length - 1 ) {
            if(session?.watchMode === 'solo' ) {
                setChooseStage('results')
            }
            if (session?.watchMode === 'group' && currentParticipantIndex + 1 < participants.length ){
                setCurrentParticipantIndex((currentParticipantIndex) => currentParticipantIndex +1)
                setChooseStage('handoff')
            }
            if(session?.watchMode === 'group' && currentParticipantIndex +1 === participants.length ){
                setChooseStage('results')
            }
        }
        else {
            setCurrentMovieIndex((currentMovieIndex) => currentMovieIndex + 1)
        }

    }
    function startNextTurn() {
        setCurrentMovieIndex(0)
        setChooseStage('choosing')
    }

    function handleSkip() {
       advanceAfterDecision()
    }
    function handleLike() {
        if(!currentMovie) {
            return
        }
        setLikedMovieIds((previousLikesByParticipant) => {
            const currentParticipantLikes =
                previousLikesByParticipant[currentParticipant.id] ?? []
            if(currentParticipantLikes.includes(currentMovie.id)){
                return previousLikesByParticipant
            }
            return{
                ...previousLikesByParticipant,
                [currentParticipant.id]: [
                ...currentParticipantLikes,
                currentMovie.id,
            ],
            }

        })
        advanceAfterDecision()
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
    const participants = [
        session.host,
        ...session.friends,
    ]

    const people = participants.map((participant) => participant.name)

    const currentParticipant = participants[currentParticipantIndex]

    const matchedMovies =
        deckMovies.filter((movie) =>
            participants.every((participant) =>
                (likedMovieIds[participant.id] ?? []).includes(movie.id)
    ))
    const bestMovie =  matchedMovies.length > 0
        ? matchedMovies.reduce((bestMovie, movie) => {
       if(bestMovie.vote_average > movie.vote_average) {
           return bestMovie
       }
       return movie
    }) : null

    const otherMatchedMovies = bestMovie
        ? matchedMovies.filter((movie) => movie.id !== bestMovie.id)
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

    function handleFinishRound() {
        if (bestMovie && session) {
            const recentRound: RecentRound = {
                bestMovie,
                mood: session.mood,
                watchMode: session.watchMode,
                participantCount: participants.length,
                completedAt: new Date().toISOString(),
            }

            saveRecentRound(recentRound)
        }

        clearStoredRound()
    }

    if(chooseStage === 'handoff') {
        return (
            <main className="app">
                <div className="app-content">
                    <section className="handoff-screen">
                        <div className="handoff-top">
                            <p className="eyebrow">NEXT TURN</p>

                            <p className="handoff-progress">
                                {currentParticipantIndex + 1} OF {participants.length} PEOPLE
                            </p>
                        </div>

                        <div className="handoff-message">
                            <h1>
                                Pass the phone <br />
                                to {currentParticipant.name}.
                            </h1>

                            <p className="handoff-privacy">Your choices stay private.</p>

                            <p className="handoff-copy">
                                Take your time — there are 12 films in this round.
                            </p>
                        </div>

                        <button
                            className="primary-button"
                            type="button"
                            onClick={startNextTurn}
                        >
                            I’m {currentParticipant.name} →
                        </button>
                    </section>
                </div>
            </main>
        )
    }

    if(chooseStage === 'results') {
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
                <div className={bestMovie ? 'app-content' : 'app-content empty-results-content'}>

                    <p className="eyebrow">YOUR MOVIE DECK</p>
                {bestMovie ? (
                    <article>
                        <h2>Tonight’s pick</h2>
                        <MovieCard movie={bestMovie} showOverview/>
                       {isGroupMode ? (
                           <small className="top-pick-text"> ⓘ Chosen from films everyone liked, based on the highest TMDB rating. </small>
                        ) : (
                           <small className="top-pick-text">  ⓘ Chosen from your likes based on the highest TMDB rating.</small>
                            )}



                        {otherMatchedMovies.length > 0 && (
                            <>
                                {isGroupMode ?
                                    ( <h4>More matches</h4>) : ( <h4>Movies you liked</h4>)
                                }
                                <div className="movie-grid">
                                    { otherMatchedMovies.map((movie) =>(
                                        <MovieCard  key={movie.id} movie={movie}/>
                                    ))}
                                </div>
                            </>
                        )}
                    </article>

                ) : (
                    <>
                        <div className="empty-results-message">
                            <h2>Nothing saved this time.</h2>
                            <p>Choose a different mood and we’ll build a new movie deck.</p>
                        </div>

                        <Link
                            className="primary-button"
                            to="/setup"
                            state={{ previousSession: session }}
                            onClick={clearStoredRound}
                        >
                            Choose a mood
                        </Link>
                    </>
                )}
                </div>
            </main>
        )
    }
    if(chooseStage === 'choosing') {
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
                Ready, {currentParticipant.name}.
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


            </div>
        </main>
    )
}
}
