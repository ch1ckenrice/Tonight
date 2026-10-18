import { Link } from 'react-router-dom'
import { useState } from 'react'
import type {Mood, Participant, TonightSession, WatchMode} from '../types/session'
import { useNavigate } from 'react-router-dom'


type SetupStep = 'mode' | 'host' | 'preferences'



const moodOptions: {
    value: Mood
    title: string
    description: string
}[] = [
    {
        value: 'easy',
        title: 'Easy watch',
        description: 'Light, warm and effortless.',
    },
    {
        value: 'fun',
        title: 'Make us laugh',
        description: 'Something playful and entertaining.',
    },
    {
        value: 'tense',
        title: 'Keep us hooked',
        description: 'Suspense, mystery or high stakes.',
    },
    {
        value: 'thoughtful',
        title: 'Give us something to think about',
        description: 'Emotional, ambitious or meaningful.',
    },

]

function SetupPage() {

    const navigate = useNavigate()

    const [watchMode, setWatchMode] = useState<WatchMode>('solo')
    const [setupStep, setSetupStep] = useState<SetupStep>('mode')
    const [hostName, setHostName] = useState('')
    const [friends, setFriends] = useState<Participant[]>(() => [
        {
            id: crypto.randomUUID(),
            name: ''
        }
    ])
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null)

    function updateFriendName(friendId: string, name: string) {
        setFriends((currentFriends) =>
            currentFriends.map((friend) =>
                friend.id === friendId ? {...friend, name} : friend
            )
        )
    }
    function addFriend() {
        setFriends((currentFriends) => {
            if(currentFriends.length === 3) {
                return currentFriends
            }

            return [
                ...currentFriends,
                {
                    id:crypto.randomUUID(),
                    name: ''
                },
            ]
        })
    }

    function removeFriend (friendId: string) {
        setFriends((currentFriends) =>
        currentFriends.filter((friend) => friend.id !== friendId)
        )
    }

    function handleStart() {
        if(!watchMode || !selectedMood) {
            return
        }
        const session : TonightSession = {
            watchMode,
            hostName: hostName.trim(),
            friends:
            watchMode === 'group'
            ? friends.map((friend) =>({
                ...friend,
                name:friend.name.trim()
                }))
                : [],
            mood: selectedMood
        }
        navigate('/choose', {state: session})
    }

    const canContinue =
        hostName.trim().length > 0 &&
        (watchMode === 'solo' ||
        friends.every((friend) => friend.name.trim().length > 0))

    if(setupStep === 'preferences'){
        return (
            <main className='app'>
                <header className='setup-header'>
                    <button
                    className='back-button'
                    type='button'
                    onClick={() => setSetupStep('host')}
                    >
                        ← Back
                    </button>
                    <span className="mode-label">Step 3 of 3</span>
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
                    disabled={!selectedMood}
                    onClick={handleStart}
                    >
                        Start finding movies
                        <span aria-hidden="true">→</span>
                    </button>
                </section>
            </main>
        )
    }

    if(setupStep === 'host') {
        return (
            <main className='app'>
                <header className="setup-header">
                    <button
                        className="back-button"
                        type="button"
                        onClick={() => setSetupStep('mode')}
                    >
                        ← Back
                    </button>

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
                    {watchMode === 'group' && (
                        <div className='friends-section' aria-labelledby='friends-title'>
                            <div className='friends-heading'>
                                <div>
                                    <h2 id='friends-title'>Who else is joining?</h2>
                                    <p>Add up to three friends.</p>
                                </div>
                                <span>{friends.length} of 3</span>
                            </div>
                            <div className='friends-list'>
                                {friends.map((friend, index) => (
                                    <div className='friend-input-row' key={friend.id}>
                                        <label htmlFor={`friend-${friend.id}`}>
                                            Friend {index + 1}
                                        </label>

                                        <div>
                                            <input
                                                id={`friend-${friend.id}`}
                                                type="text"
                                                value={friend.name}
                                                placeholder={`Friend ${index + 1}'s name`}
                                                onChange={(event) =>
                                                    updateFriendName(friend.id, event.target.value)
                                                }
                                            />
                                            {friends.length >1 && (
                                                <button
                                                    className="remove-friend-button"
                                                    type="button"
                                                    onClick={() => removeFriend(friend.id)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                    {friends.length < 3 && (
                        <button
                        className="add-friend-button"
                        type="button"
                        onClick={addFriend}
                >
                    + Add another person
                </button>
                        )}
                        </div>
                    )}
                    <button
                    className="primary-button"
                    type="button"
                    disabled={!canContinue}
                    onClick={() =>setSetupStep('preferences')}
                    >
                        Choose preferences
                        <span aria-hidden="true">→</span>
                    </button>
                </section>
            </main>
        )
    }
    return (
        <main className="app">
            <header className="setup-header">
                <Link className="back-link" to="/">
                    ← Back
                </Link>

                <span className="mode-label">Step 1 of 3</span>
            </header>
            <section className='setup-content' aria-labelledby='setup-title'>
                <p className="eyebrow">START A MOVIE NIGHT</p>

                <h1 id="setup-title">Who is watching tonight?</h1>

                <p className="hero-copy">
                    Choose how you want to find your next movie.
                </p>
                <div className="mode-options">
                    <button
                        className={`mode-card ${
                        watchMode === 'solo' ? 'is-selected' : ''
                    }`}
                            type='button'
                            aria-pressed={watchMode === 'solo'}
                            onClick={() => setWatchMode('solo')}
                    >
                         <span className="mode-icon" aria-hidden="true">
              01
            </span>

                        <span>
              <strong>Just me</strong>
              <small>Find something that fits your mood.</small>
            </span>
                    </button>

                    <button
                    className={`mode-card ${
                        watchMode === 'group' ? 'is-selected' : ''
                    }`}
                    type='button'
                    aria-pressed={watchMode === 'group'}
                    onClick={() => setWatchMode('group')}
                    >
                         <span className="mode-icon" aria-hidden="true">
              02+
            </span>

            <span>
              <strong>With friends</strong>
              <small>Pass the phone and find a match together.</small>
            </span>
                    </button>
                </div>

                <button
                    className="primary-button"
                    type="button"
                    disabled={!watchMode}
                    onClick={() => setSetupStep('host')}
                >
                    {watchMode === 'group' ? 'Choose participants' : 'Continue'}
                    <span aria-hidden="true">→</span>
                </button>
            </section>
        </main>
    )
}

export default SetupPage