import {type FormEvent, useState} from "react";
import {createOnlineRoom} from "../services/onlineRooms.ts";
import {Link, useNavigate} from "react-router-dom";

export function OnlineCreateRoom() {

const [hostName, setHostName] = useState('')
const [errorMessage, setErrorMessage] = useState('')
const [isCreating, setIsCreating] = useState(false)
    const navigate = useNavigate()

    const canContinue =
        hostName.trim().length > 0 && !isCreating

async function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsCreating(true)
try {
    const onlineRoom  = await createOnlineRoom(hostName)
    navigate(`/room/${onlineRoom.id}`)
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

    return(
        <main className='app'>
            <header className="setup-header">
                <Link
                    className="back-button"
                    to="/setup"
                >
                    ← Back
                </Link>

                <span className="mode-label">ONLINE ROOM</span>
            </header>

            <form className="setup-content" aria-labelledby="host-title" onSubmit={handleCreateRoom}>
                <p className="eyebrow">CREATE A ROOM</p>

                <h1 id="host-title">What should we call you?</h1>

                <p className="hero-copy">
                    Create a private room, invite up to seven friends, then choose together from separate devices.
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
                    autoComplete="name"
                    onChange={(e) => setHostName(e.target.value)}
                />
                <button
                    className="primary-button"
                    type="submit"
                    disabled={!canContinue}
                >
                    {isCreating ? 'Creating room...' : 'Create online room'}
                    {!isCreating && <span aria-hidden="true">→</span>}
                </button>
                {errorMessage && (
                    <p className="form-error" role="alert">{errorMessage}</p>
                )}
            </form>
        </main>
    )
}
