import {type PointerEvent, useEffect, useRef, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import { SwipeMovieCard } from '../components/SwipeMovieCard'
import {
    getMyOnlineVotes,
    getOnlineRoom,
    getRoomMembers,
    markMyRoomMemberFinished,
    saveOnlineVote
} from '../services/onlineRooms'
import type {OnlineRoom, OnlineRoomMember} from '../types/onlineRoom'
import {supabase} from "../services/supabase.ts";

const SWIPE_THRESHOLD = {
    like: 110,
    skip:-110
}

export function OnlineChoosePage() {
    const { roomId } = useParams()

    const [room, setRoom] = useState<OnlineRoom | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [decisionErrorMessage, setDecisionErrorMessage] = useState('')
    const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
    const [isSavingDecision, setIsSavingDecision] = useState(false)
    const [dragX, setDragX] = useState<number>(0)
    const [isDragging, setIsDragging] = useState(false)
    const [exitDirection , setExitDirection] = useState<'like' | 'skip' | null>(null)
    const [members, setMembers] = useState<OnlineRoomMember[]>([])
    const dragStartX = useRef<number>(0)
    const dragXRef = useRef(0)
    const navigate = useNavigate()


    let cardTransform = `translateX(${dragX}px) rotate(${dragX / 20}deg)`
    if (exitDirection === 'like') {
        cardTransform = 'translateX(120vw) rotate(12deg)'
    }
    else if (exitDirection === 'skip') {
        cardTransform = 'translateX(-120vw) rotate(-12deg)'
    }

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

    const cardStyle = {
        transform: cardTransform,
        transition: isDragging
            ? 'none'
            : 'transform 620ms cubic-bezier(0.4, 0, 0.2, 1)',
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
            setExitDirection('like')
        }
        else if (finalDragX < SWIPE_THRESHOLD.skip) {
            setExitDirection('skip')
        }
        dragXRef.current = 0
        setDragX(0)
    }
    function handlePointerCancel() {
        setIsDragging(false)
        dragXRef.current = 0
        setDragX(0)
    }

    async function handleCardTransitionEnd() {
        if (exitDirection === null || !roomId) {
            return
        }

        const direction = exitDirection

        const isLastMovie = currentMovieIndex === deckMovies.length - 1
        const wasSaved = await saveDecision(direction === 'like')

        if(!wasSaved) {
            setExitDirection(null)
            return
        }

        if (isLastMovie) {
            try {
                await markMyRoomMemberFinished(roomId)
            } catch {
                setDecisionErrorMessage('Could not finish your selection.')
                setExitDirection(null)
                return
            }
        }

        setExitDirection(null)
        setCurrentMovieIndex((currentIndex) => currentIndex + 1)
    }

    function startButtonSwipe(direction: 'like' | 'skip') {
        if (isSavingDecision || exitDirection !== null) {
            return
        }

        setDecisionErrorMessage('')
        setExitDirection(direction)
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

    useEffect(() => {
        async function loadRoom() {
            if (!roomId) {
                setErrorMessage('Room link is invalid')
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setErrorMessage('')

                const [loadedRoom, savedVotes,loadedMembers] = await Promise.all([
                    getOnlineRoom(roomId),
                    getMyOnlineVotes(roomId),
                    getRoomMembers(roomId)
                ])

                const votedMovieIds = new Set(
                    savedVotes.map((vote) => vote.movie_id)
                )
                const nextMovieIndex = loadedRoom.deck_movies.findIndex(
                    (movie) => !votedMovieIds.has(movie.id)
                )
                setMembers(loadedMembers)

                setCurrentMovieIndex(
                    nextMovieIndex === -1
                    ? loadedRoom.deck_movies.length
                    : nextMovieIndex
                )

                setRoom(loadedRoom)
            } catch {
                setErrorMessage('Could not load this movie night')
            } finally {
                setIsLoading(false)
            }
        }

        void loadRoom()
    }, [roomId])

    useEffect(() => {
        if (room?.status === 'results' && roomId) {
            navigate(`/room/${roomId}/results`)
        }
    }, [room?.status, roomId, navigate])

    useEffect(() => {
        if (!roomId) {
            return
        }

        async function refreshMembers() {
            if(!roomId) {
                return
            }
            try {
                const updatedMembers = await getRoomMembers(roomId)
                setMembers(updatedMembers)
            } catch (error) {
                console.error('Could not refresh room members:', error)
            }
        }

        const channel = supabase
            .channel(`room-members:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'room_members',
                    filter: `room_id=eq.${roomId}`,
                },
                () => {
                    void refreshMembers()
                },
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [roomId])

    useEffect(() => {
        if (!roomId) {
            return
        }
        const channel = supabase
        .channel(`room-status:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    if(payload.new.status !== 'results') {
                        return
                    }
                    navigate(`/room/${roomId}/results`)
                }
            )
            .subscribe()
        return () => {
            void supabase.removeChannel(channel)
        }
    },[roomId, navigate])

    const deckMovies = room?.deck_movies ?? []
    const currentMovie = deckMovies[currentMovieIndex]
    const finishedMembersCount = members.filter((member) => member.is_finished).length

    async function saveDecision(isLiked:boolean):Promise<boolean> {
        if (!roomId || !currentMovie || isSavingDecision) {
            return false
        }

        try {
            setIsSavingDecision(true)
            setDecisionErrorMessage('')

            await saveOnlineVote(roomId, currentMovie.id, isLiked)
            return true
        } catch {
            setDecisionErrorMessage('Could not save your choice. Please try again.')
            return false
        } finally {
            setIsSavingDecision(false)
        }
    }

    if (isLoading) {
        return <main className="app">Loading movies...</main>
    }

    if (errorMessage) {
        return <main className="app">{errorMessage}</main>
    }

    if (!room) {
        return <main className="app">Room not found</main>
    }

    if (!currentMovie) {
        return <main className="app">
            <div className="app-content">
                <section className="waiting-screen">
                <p className="eyebrow"> YOUR PICKS ARE IN</p>

                <h1>That’s everything.</h1>

                <p className="hero-copy">Waiting for everyone else to finish their choices.</p>

                    <p className="waiting-note">
                        {finishedMembersCount} of {members.length} people have finished.
                    </p>

                </section>
            </div>
        </main>
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

                <h1>Pick what you would watch tonight.</h1>

                <p className="hero-copy">
                    Your choices stay private until everyone finishes.
                </p>

                <p className="deck-progress">
                    {currentMovieIndex + 1} of {deckMovies.length}
                </p>

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
                            className="swipe-button skip-button"
                            type="button"
                            disabled={isSavingDecision || exitDirection !== null}
                            onClick={() => startButtonSwipe('skip')}
                            aria-label="Skip movie"
                        >
                            ×
                        </button>

                        <button
                            className="swipe-button like-button"
                            type="button"
                            disabled={isSavingDecision || exitDirection !== null}
                            onClick={() => startButtonSwipe('like')}
                            aria-label="Like movie"
                        >
                            ♥
                        </button>
                    </div>
                </section>
                {decisionErrorMessage && (
                    <p className="form-error">{decisionErrorMessage}</p>
                )}
            </div>
        </main>
    )
}
