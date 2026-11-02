import {useEffect, useState} from "react";
import type {OnlineRoom} from "../types/onlineRoom.ts";
import {Link, useNavigate, useParams} from "react-router-dom";
import {getOnlineRoom, startOnlineRound} from "../services/onlineRooms.ts";
import {getCurrentUserId} from "../services/auth.ts";
import type {Mood} from "../types/session.ts";
import {moodOptions} from "../data/moodOptions.ts";
import {getMoviesForMood} from "../services/tmdb.ts";
import { PageState } from '../components/PageState.tsx'
import { getOnlineRoomRoute } from '../utils/onlineRoomRoute.ts'

const DECK_SIZE = 12

export function OnlineRoomSetupPage() {



    const [room, setRoom] = useState<OnlineRoom | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [loadErrorMessage, setLoadErrorMessage] = useState('')
    const [startErrorMessage, setStartErrorMessage] = useState('')
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
    const [isStarting, setIsStarting] = useState(false)
    const { roomId } = useParams()
    const navigate = useNavigate()


    useEffect(() => {
        async function checkHostAccess() {
            if (!roomId) {
                setLoadErrorMessage('Could not find room')
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setLoadErrorMessage('')

                const loadedRoom = await getOnlineRoom(roomId)
                const currentUserId = await getCurrentUserId()

                if (currentUserId !== loadedRoom.host_user_id) {
                    navigate(getOnlineRoomRoute(loadedRoom), { replace: true })
                    return
                }

                if (loadedRoom.status !== 'lobby') {
                    navigate(getOnlineRoomRoute(loadedRoom), { replace: true })
                    return
                }

                setRoom(loadedRoom)
            } catch {
                setLoadErrorMessage('Could not load room')
            }
            finally {
                setIsLoading(false)
            }
        }
        void checkHostAccess()
    },[roomId, navigate])

    async function handleStartRound() {
        if (!roomId || !selectedMood) {
            return
        }
        const randomPage = Math.floor(Math.random() * 15) + 1
        try {
            setIsStarting(true)
            setStartErrorMessage('')

            const movies = await getMoviesForMood(selectedMood, randomPage)
            const deckMovies = movies.slice(0, DECK_SIZE)
            if (deckMovies.length < DECK_SIZE) {
                throw new Error('Not enough movies to start a round')
            }
            await startOnlineRound(roomId, selectedMood, deckMovies)
            navigate(`/room/${roomId}`)

        }
        catch {
            setStartErrorMessage('Could not start movie night. Check your connection and try again.')

        }
        finally {
            setIsStarting(false)
        }

    }

    if (isLoading) {
        return <PageState eyebrow="ONLINE MOVIE NIGHT" title="Loading room..." isLoading />
    }

    if (loadErrorMessage) {
        return (
            <PageState
                eyebrow="ONLINE MOVIE NIGHT"
                title="Could not load this room."
                message={loadErrorMessage}
                actionLabel="Back to room"
                actionTo={roomId ? `/room/${roomId}` : '/'}
            />
        )
    }

    if (!room) {
        return null
    }
    return (
        <main className='app'>
            <header className='setup-header'>
                <Link
                    className="back-link"
                    to={`/room/${room.id}`}
                >
                    ← Back to room
                </Link>
            </header>
            <section className="setup-content" aria-labelledby="mood-title">
                <p className="eyebrow">SET THE MOOD</p>
                <h1 id="mood-title">What does tonight feel like?</h1>

                <p className="hero-copy">
                    Pick the feeling you want from this movie night.
                </p>
                <div className="mood-options">
                    {moodOptions.map((mood) => (
                        <button
                            className={`mood-card ${
                                selectedMood === mood.value ? 'is-selected' : ''
                            }`}
                            type="button"
                            key={mood.value}
                            aria-pressed={selectedMood === mood.value}
                            onClick={() => setSelectedMood(mood.value)}
                        >
                            <strong>{mood.title}</strong>
                            <small>{mood.description}</small>
                        </button>
                    ))}
                </div>

                <button
                    className="primary-button"
                    type='button'
                    disabled={!selectedMood || isStarting}
                    onClick={handleStartRound}
                >
                    {isStarting ? 'Building your movie deck...' : 'Start movie night'}
                    <span aria-hidden="true">→</span>
                </button>

                {startErrorMessage && (
                    <p className="form-error" role="alert">
                        {startErrorMessage}
                    </p>
                )}
            </section>
        </main>
    )
}
