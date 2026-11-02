import {type FormEvent, useCallback, useEffect, useState} from "react";
import type {OnlineRoom, OnlineRoomMember} from "../types/onlineRoom.ts";
import { Link, useNavigate, useParams } from "react-router-dom"
import { supabase } from "../services/supabase.ts"
import {getMyRoomMember, getOnlineRoom, getRoomMembers, joinOnlineRoom} from "../services/onlineRooms.ts";
import { PageState } from '../components/PageState.tsx'
import { getOnlineRoomRoute } from '../utils/onlineRoomRoute.ts'

const MAX_ROOM_MEMBERS = 8

export function OnlineRoomPage() {
    const [currentMember, setCurrentMember] =
        useState<OnlineRoomMember | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const {roomId} = useParams()
    const navigate = useNavigate()
    const [errorMessage, setErrorMessage] = useState('')
    const [roomLoadErrorMessage, setRoomLoadErrorMessage] = useState('')
    const [memberName, setMemberName] = useState('')
    const [isJoining, setIsJoining] = useState(false)
    const [room, setRoom] = useState<OnlineRoom | null>(null)
    const [members, setMembers] = useState<OnlineRoomMember[]>([])
    const [isInviteCopied, setIsInviteCopied] = useState(false)

    const loadRoomData = useCallback(async (targetRoomId: string) => {
        const [loadedRoom, loadedMembers] = await Promise.all([
            getOnlineRoom(targetRoomId),
            getRoomMembers(targetRoomId),
        ])

        setRoom(loadedRoom)
        setMembers(loadedMembers)
    }, [])

    useEffect(() => {
        let isCurrentRequest = true

        async function loadCurrentMember() {
            if (!roomId) {
                if (isCurrentRequest) {
                    setRoomLoadErrorMessage('Room link is invalid')
                    setIsLoading(false)
                }
                return
            }

            setRoomLoadErrorMessage('')
            try {
                setIsLoading(true)
                const roomMember = await getMyRoomMember(roomId)

                if (!isCurrentRequest) {
                    return
                }

                // Do not render the lobby until its room data is available.
                // Otherwise an existing member briefly lands in the "Room not found"
                // state between these two async requests.
                if (roomMember !== null) {
                    await loadRoomData(roomId)
                }

                if (!isCurrentRequest) {
                    return
                }

                setCurrentMember(roomMember)

            } catch {
                if (isCurrentRequest) {
                    setRoomLoadErrorMessage('Could not load this room')
                }
            } finally {
                if (isCurrentRequest) {
                    setIsLoading(false)
                }
            }
        }
        void loadCurrentMember()

        return () => {
            isCurrentRequest = false
        }
    }, [roomId, loadRoomData])

    useEffect(() => {
        if (!room) {
            return
        }

        const roomRoute = getOnlineRoomRoute(room)

        if (roomRoute !== `/room/${room.id}`) {
            navigate(roomRoute, { replace: true })
        }
    }, [room, navigate])


    useEffect(() => {
        if (!roomId || !currentMember) {
            return
        }

        const channel = supabase
            .channel(`room-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    const updatedRoom = payload.new as OnlineRoom

                    setRoom(updatedRoom)
                },
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [roomId, currentMember])
    useEffect(() => {
        if (!roomId || !currentMember) {
            return
        }

        const channel = supabase
            .channel(`room-members:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_members',
                    filter: `room_id=eq.${roomId}`,
                },
                () => {
                    void loadRoomData(roomId)
                },
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [roomId, currentMember, loadRoomData])

   async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if(!roomId){
            setErrorMessage('Room link is invalid')
            return
        }
        setIsJoining(true)
        setErrorMessage('')
       try {


       const roomMember = await joinOnlineRoom(roomId, memberName)
           await loadRoomData(roomId)
       setCurrentMember(roomMember)

       }
       catch (error) {
           console.error('Could not join room:', error)
           setErrorMessage(
               error instanceof Error && error.message === 'This room is full'
                   ? 'This room already has 8 people.'
                   : 'Could not join this room',
           )
       }
        finally {
           setIsJoining(false)
       }
    }

    async function handleCopyInviteLink() {
        try {
            await navigator.clipboard.writeText(inviteUrl)

            setIsInviteCopied(true)

            window.setTimeout(() => {
                setIsInviteCopied(false)
            }, 2000)
        }
        catch {
            setErrorMessage('Could not copy the invite link')
        }
    }

    if (isLoading) {
        return <PageState eyebrow="ONLINE MOVIE NIGHT" title="Loading room..." isLoading />
    }

    if (roomLoadErrorMessage) {
        return (
            <PageState
                eyebrow="ONLINE MOVIE NIGHT"
                title="Could not open this room."
                message={roomLoadErrorMessage}
                actionLabel="Back home"
            />
        )
    }

    if (!currentMember) {
        return (
            <main className="app">
                <form
                    className="setup-content online-join-content"
                    aria-labelledby="join-room-title"
                    onSubmit={handleJoinRoom}
                >
                    <p className="eyebrow">YOU'RE INVITED</p>

                    <h1 id="join-room-title">Join this movie night.</h1>

                    <p className="hero-copy">
                        Enter your name to join the room. Your choices will stay private until everyone finishes.
                    </p>

                    <label className="input-label" htmlFor="member-name">
                        Your name
                    </label>

                    <input
                        className="name-input"
                        id="member-name"
                        type="text"
                        value={memberName}
                        placeholder="e.g. Oksana"
                        autoComplete="name"
                        onChange={(event) => setMemberName(event.target.value)}
                    />

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={memberName.trim().length === 0 || isJoining}
                    >
                        {isJoining ? 'Joining...' : 'Join room'}
                        {!isJoining && <span aria-hidden="true">→</span>}
                    </button>

                    {errorMessage && (
                        <p className="form-error" role="alert">
                            {errorMessage}
                        </p>
                    )}
                </form>
            </main>
        )
    }
    if (!room) {
        return (
            <PageState
                eyebrow="ONLINE MOVIE NIGHT"
                title="Room not found."
                message="The invite link may be invalid or this room is no longer available."
                actionLabel="Back home"
            />
        )
    }
    const isHost = currentMember.user_id === room.host_user_id

    const inviteUrl =
        `${window.location.origin}${import.meta.env.BASE_URL}#/room/${room.id}`

    return (
        <main className="app">
            <section className="online-lobby" aria-labelledby="lobby-title">
                <div className="online-lobby-top">
                    <p className="eyebrow">ONLINE MOVIE NIGHT</p>

                    <span className="room-status">
                    <span className="room-status-dot" aria-hidden="true" />
                    Room open
                </span>
                </div>

                <div className="online-lobby-message">
                    <h1 id="lobby-title">
                        {isHost
                            ? 'Your room is ready.'
                            : `You’re in, ${currentMember.name}.`}
                    </h1>

                    <p className="hero-copy">
                        {isHost
                            ? 'Share the invite link with your friends. Up to 8 people can choose privately from the same movie deck.'
                            : 'You joined the movie night. Wait for the host to choose the mood and start the round.'}
                    </p>
                </div>

                {isHost && (
                    <div className="invite-card">
                        <label className="invite-label" htmlFor="invite-link">
                            Invite link
                        </label>

                        <div className="invite-link-row">
                            <input
                                className="invite-link-input"
                                id="invite-link"
                                type="text"
                                value={inviteUrl}
                                readOnly
                                onFocus={(event) => event.currentTarget.select()}
                            />

                            <button
                                className="copy-invite-button"
                                type="button"
                                onClick={() => void handleCopyInviteLink()}
                            >
                                {isInviteCopied ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <p className="invite-hint">
                            Tap the link to select it, then copy and send it to your friends.
                        </p>
                    </div>
                )}

                <section className="room-members" aria-labelledby="members-title">
                    <div className="room-members-heading">
                        <h2 id="members-title">In this room</h2>
                        <span aria-live="polite">
                            {members.length} of {MAX_ROOM_MEMBERS} people
                        </span>
                    </div>

                    <ul className="room-members-list">
                        {members.map((member) => {
                            const memberIsHost = member.user_id === room.host_user_id

                            return (
                                <li className="room-member" key={member.id}>
                                <span className="member-avatar" aria-hidden="true">
                                    {member.name.slice(0, 1).toUpperCase()}
                                </span>

                                    <strong>{member.name}</strong>

                                    {memberIsHost && (
                                        <span className="host-badge">Host</span>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </section>

                <p className="lobby-footer-copy">
                    {isHost
                        ? 'Waiting for everyone to join. The room closes when you start the round.'
                        : 'Your choices will stay private until everyone finishes.'}
                </p>

                {errorMessage && (
                    <p className="form-error" role="alert">
                        {errorMessage}
                    </p>
                )}

                {isHost && (
                    <Link
                        className="online-start-link"
                        to={`/room/${room.id}/setup`}
                    >
                        Choose mood
                        <span aria-hidden="true">→</span>
                    </Link>
                )}
            </section>
        </main>
    )

}
