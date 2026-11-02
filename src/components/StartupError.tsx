export function StartupError() {
    return (
        <main className="app">
            <section className="page-state" aria-live="assertive">
                <div className="page-state-content">
                    <p className="eyebrow">CONNECTION ISSUE</p>
                    <h1>Tonight could not start.</h1>
                    <p>
                        Check your connection and try again. If this keeps happening, the online service may be unavailable.
                    </p>
                    <button
                        className="primary-button"
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        Try again
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
            </section>
        </main>
    )
}
