import {useState} from "react";
import type {OnlineRoom} from "../types/onlineRoom.ts";
import {createOnlineRoom} from "../services/onlineRooms.ts";
import {Link, useNavigate} from "react-router-dom";

export function OnlineCreateRoom() {

const [hostName, setHostName] = useState('')
const [createdRoom, setCreatedRoom] = useState<OnlineRoom | null>(null)
const [errorMessage, setErrorMessage] = useState('')
const [isCreating, setIsCreating] = useState(false)
    const navigate = useNavigate()

    const canContinue =
        hostName.trim().length > 0 && !isCreating

async function handleCreateRoom() {
    setErrorMessage('')
    setIsCreating(true)
try {
    const onlineRoom  = await createOnlineRoom(hostName)
    navigate(`/room/${onlineRoom.id}`)
    setCreatedRoom(onlineRoom)
}
catch (error) {
    setErrorMessage(
        error instanceof Error
            ? error.message
            : 'Could not create an online room',
    )
}
finally {
    setIsCreating(false)
}

}

    if(createdRoom === null) {
        return(
            <main className='app'>
                <header className="setup-header">
                    <Link
                        className="back-button"
                        to="/setup"

                    >
                        ← Back
                    </Link>

                    <span className="mode-label">Step 2 of 3</span>
                </header>

                <section className="setup-content" aria-labelledby="host-title">
                    <p className="eyebrow">A LITTLE ABOUT YOU</p>

                    <h1 id="host-title">What should we call you?</h1>

                    <p className="hero-copy">
                        This name will appear during your movie night.
                    </p>

                    <label className="input-label" htmlFor="host-name">
                        Your name
                    </label>

                    <input
                        className='name-input'
                        id="host-name"
                        type='text'
                        value={hostName}
                        placeholder="e.g. Oksana"
                        onChange={(e) => setHostName(e.target.value)}
                    />
                    <button
                        className="primary-button"
                        type="button"
                        disabled={!canContinue}
                        onClick={handleCreateRoom}
                    >
                        Create online room
                        <span aria-hidden="true">→</span>
                    </button>
                    {errorMessage && (
                        <p role="alert">{errorMessage}</p>
                    )}
                </section>
            </main>
        )
    }
}
