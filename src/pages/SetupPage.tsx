import { Link } from 'react-router-dom'
import { useState } from 'react'

type WatchMode = 'solo' | 'group' | null

type SetupStep = 'mode' | 'host'

function SetupPage() {

    const [watchMode, setWatchMode] = useState<WatchMode>(null)
    const [setupStep, setSetupStep] = useState<SetupStep>('mode')
    const [hostName, setHostName] = useState('')

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
                    <button
                    className="primary-button"
                    type="button"
                    disabled={!hostName.trim()}>
                        {watchMode === 'group' ? 'Add friends' : 'Choose preferences'}
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